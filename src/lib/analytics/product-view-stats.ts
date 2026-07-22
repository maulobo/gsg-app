export const ANALYTICS_PAGE_SIZE = 1000;
export const ANALYTICS_TIME_ZONE = "America/Argentina/Cordoba";

export interface ProductViewEvent {
  id: number | string;
  product_name: string | null;
  product_code: string | null;
  created_at: string;
  metadata: {
    path?: string | null;
    referrer?: string | null;
    timezone?: string | null;
    viewedAt?: string | null;
  } | null;
}

export interface ProductViewCount {
  label: string;
  count: number;
}

export interface ProductViewProduct {
  productName: string;
  productCode: string;
  count: number;
  lastViewed: string;
}

export interface ProductViewComparison {
  totalViews: number;
  uniqueProducts: number;
}

export interface ProductViewStats {
  totalViews: number;
  uniqueProducts: number;
  averagePerProduct: number;
  topProducts: ProductViewProduct[];
  viewsByDay: Array<{ day: string; count: number }>;
  viewsByHour: Array<{ hour: number; count: number }>;
  topReferrers: ProductViewCount[];
  topPaths: ProductViewCount[];
  timezones: ProductViewCount[];
  /** Totales del período inmediatamente anterior de igual duración. Null si no aplica (ej: "Todo"). */
  comparison: ProductViewComparison | null;
}

type PageFetcher = (from: number, to: number) => Promise<ProductViewEvent[]>;

export async function fetchAllProductViewEvents(
  fetchPage: PageFetcher,
  pageSize = ANALYTICS_PAGE_SIZE,
): Promise<ProductViewEvent[]> {
  const events: ProductViewEvent[] = [];

  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    events.push(...page);

    if (page.length < pageSize) {
      return events;
    }
  }
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function sortedCounts(map: Map<string, number>, limit?: number): ProductViewCount[] {
  const values = Array.from(map, ([label, count]) => ({ label, count })).sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
  return typeof limit === "number" ? values.slice(0, limit) : values;
}

function analyticsDateParts(value: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
  };
}

export function aggregateProductViewEvents(events: ProductViewEvent[]): ProductViewStats {
  const products = new Map<string, ProductViewProduct>();
  const days = new Map<string, number>();
  const hours = new Map<string, number>();
  const referrers = new Map<string, number>();
  const paths = new Map<string, number>();
  const timezones = new Map<string, number>();

  for (const event of events) {
    const productCode = event.product_code || "N/A";
    const existing = products.get(productCode);
    if (existing) {
      existing.count += 1;
      if (event.created_at > existing.lastViewed) existing.lastViewed = event.created_at;
    } else {
      products.set(productCode, {
        productName: event.product_name || "Desconocido",
        productCode,
        count: 1,
        lastViewed: event.created_at,
      });
    }

    const viewedAt = event.metadata?.viewedAt || event.created_at;
    const { day, hour } = analyticsDateParts(viewedAt);
    increment(days, day);
    increment(hours, String(hour));
    increment(referrers, event.metadata?.referrer || "Directo");
    increment(paths, event.metadata?.path || "Desconocido");
    increment(timezones, event.metadata?.timezone || "Desconocido");
  }

  const topProducts = Array.from(products.values())
    .sort((a, b) => b.count - a.count || a.productName.localeCompare(b.productName))
    .slice(0, 20);
  const uniqueProducts = products.size;

  return {
    totalViews: events.length,
    uniqueProducts,
    averagePerProduct: uniqueProducts ? Math.round(events.length / uniqueProducts) : 0,
    topProducts,
    viewsByDay: Array.from(days, ([day, count]) => ({ day, count })).sort((a, b) =>
      a.day.localeCompare(b.day),
    ),
    viewsByHour: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: hours.get(String(hour)) ?? 0,
    })),
    topReferrers: sortedCounts(referrers, 10),
    topPaths: sortedCounts(paths, 10),
    timezones: sortedCounts(timezones),
    comparison: null,
  };
}

/**
 * Ventana inmediatamente anterior, de igual duración, para comparar períodos.
 * Devuelve null si falta alguno de los extremos (ej: preset "Todo").
 */
export function previousPeriodRange(
  start: string | null,
  end: string | null,
): { start: string; end: string } | null {
  if (!start || !end) return null;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) return null;

  const duration = endMs - startMs;
  const prevEnd = new Date(startMs - 1);
  const prevStart = new Date(startMs - 1 - duration);
  return { start: prevStart.toISOString(), end: prevEnd.toISOString() };
}

export function parseAnalyticsDateRange(start: string | null, end: string | null) {
  const parse = (value: string | null, label: string) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error(`Fecha ${label} inválida`);
    return date.toISOString();
  };

  const parsed = { start: parse(start, "inicial"), end: parse(end, "final") };
  if (parsed.start && parsed.end && parsed.start > parsed.end) {
    throw new Error("La fecha inicial no puede ser posterior a la fecha final");
  }
  return parsed;
}

export function dateInputRangeToIso(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00.000`);
  const endDate = new Date(`${end}T23:59:59.999`);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new Error("Rango de fechas inválido");
  }
  if (startDate > endDate) {
    throw new Error("La fecha inicial no puede ser posterior a la fecha final");
  }
  return { start: startDate.toISOString(), end: endDate.toISOString() };
}

export function isMissingProductViewStatsRpcError(
  error: { code?: string; message?: string } | null,
) {
  return error?.code === "PGRST202" || error?.code === "42883";
}
