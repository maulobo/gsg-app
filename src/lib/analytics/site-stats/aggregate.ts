import {
  DISTRIBUTOR_ACTION_LABELS,
  DOC_TYPE_LABELS,
  EVENT_TYPES,
  FAMILIES,
  FAMILY_LABELS,
  SOURCE_KIND_LABELS,
  WHATSAPP_REASON_LABELS,
  eventFamily,
  eventProductKey,
  isDevEvent,
  metaString,
  pageLabel,
  productFallbackPath,
  sourceOf,
  type AnalyticsEventRow,
  type Family,
  type SourceKind,
} from "./labels.ts";
import { bucketIndex, periodBuckets, type Range, type ResolvedPeriod } from "./period.ts";

export const METRICS = {
  views: EVENT_TYPES.viewProduct,
  whatsapp: EVENT_TYPES.whatsappClick,
  documents: EVENT_TYPES.documentClick,
  catalog: EVENT_TYPES.catalogClick,
} as const;
export type MetricKey = keyof typeof METRICS;
export const METRIC_KEYS = Object.keys(METRICS) as MetricKey[];

/** Primer evento de producción de cada tipo (y de vistas por familia): desde cuándo hay medición */
export interface Coverage {
  byEvent: Record<string, string | null>;
  viewsByFamily: Record<Family, string | null>;
}

export type MetricStatus = "ok" | "partial" | "not_measured" | "not_applicable";

export interface MetricResult {
  value: number | null;
  previous: number | null;
  comparable: boolean;
  status: MetricStatus;
  coverageStart: string | null;
}

export interface ProductRow {
  key: string;
  family: Family;
  code: string;
  name: string;
  category: string | null;
  path: string | null;
  image: string | null;
  views: number;
  documentClicks: number;
  whatsappClicks: number;
  whatsappOpens: number;
}

export interface CountRow {
  id: string;
  label: string;
  count: number;
  detail?: string;
}

export interface SiteStats {
  period: ResolvedPeriod;
  comparisonRange: Range;
  family: Family | null;
  generatedAt: string;
  excludedDevEvents: number;
  includesDevEvents: boolean;
  metrics: Record<MetricKey, MetricResult>;
  series: {
    labels: string[];
    current: Record<MetricKey, Array<number | null>>;
    previous: Record<MetricKey, Array<number | null>>;
  };
  products: ProductRow[];
  families: Array<{
    family: Family;
    label: string;
    views: number;
    coverageStart: string | null;
    categories: CountRow[];
  }>;
  documents: {
    total: number;
    fromProducts: number;
    general: number;
    top: CountRow[];
    downloadPages: Array<{ slug: string; views: number; fileClicks: number }>;
  };
  contacts: {
    whatsappOpens: { total: number; fromProducts: number; general: number };
    whatsappClicks: { total: number; fromProducts: number; general: number };
    whatsappByReason: CountRow[];
    whatsappByPage: CountRow[];
    distributorTotal: number;
    distributorByAction: CountRow[];
    distributorTop: CountRow[];
  };
  sources: {
    kinds: CountRow[];
    top: CountRow[];
    total: number;
  };
  coverage: Coverage;
}

const inc = (map: Map<string, CountRow>, id: string, label: string, detail?: string) => {
  const row = map.get(id);
  if (row) row.count += 1;
  else map.set(id, { id, label, count: 1, detail });
};

const sortedRows = (map: Map<string, CountRow>, limit?: number) => {
  const rows = [...map.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  return limit ? rows.slice(0, limit) : rows;
};

const minIso = (a: string | null, b: string | null) => (!a ? b : !b ? a : a < b ? a : b);

function metricCoverage(metric: MetricKey, family: Family | null, coverage: Coverage): string | null {
  if (metric === "views") {
    if (family) return coverage.viewsByFamily[family];
    return FAMILIES.reduce<string | null>((acc, f) => minIso(acc, coverage.viewsByFamily[f]), null);
  }
  return coverage.byEvent[METRICS[metric]] ?? null;
}

interface AggregateInput {
  current: AnalyticsEventRow[];
  previous: AnalyticsEventRow[];
  period: ResolvedPeriod;
  comparisonRange: Range;
  family: Family | null;
  coverage: Coverage;
  now: Date;
  /** Solo para verificar en desarrollo con datos de prueba: incluye eventos de localhost/preview */
  includeDevEvents?: boolean;
}

/**
 * Agrega los eventos del período (ya filtrados por fecha) para todos los bloques de Estadísticas.
 * Usa created_at (hora del servidor) para filtrar y agrupar; excluye la actividad de desarrollo.
 */
export function aggregateSiteStats(input: AggregateInput): SiteStats {
  const { period, comparisonRange, family, coverage, now } = input;

  let excludedDevEvents = 0;
  const keep = (events: AnalyticsEventRow[], countExcluded: boolean) =>
    events.filter((e) => {
      if (!input.includeDevEvents && isDevEvent(e)) {
        if (countExcluded) excludedDevEvents += 1;
        return false;
      }
      // Con filtro de familia solo quedan las acciones atribuidas a productos de esa familia
      return family ? eventFamily(e) === family : true;
    });

  const current = keep(input.current, true);
  const previous = keep(input.previous, false);

  // --- Indicadores ---
  const periodStart = period.start;
  const metrics = {} as Record<MetricKey, MetricResult>;
  for (const metric of METRIC_KEYS) {
    const coverageStart = metricCoverage(metric, family, coverage);
    const type = METRICS[metric];
    if (metric === "catalog" && family) {
      metrics[metric] = { value: null, previous: null, comparable: false, status: "not_applicable", coverageStart };
      continue;
    }
    if (!coverageStart || coverageStart >= period.effectiveEnd) {
      metrics[metric] = { value: null, previous: null, comparable: false, status: "not_measured", coverageStart };
      continue;
    }
    const value = current.filter((e) => e.event_type === type).length;
    const comparable = comparisonRange.start >= coverageStart;
    metrics[metric] = {
      value,
      previous: comparable ? previous.filter((e) => e.event_type === type).length : null,
      comparable,
      status: coverageStart > periodStart ? "partial" : "ok",
      coverageStart,
    };
  }

  // --- Serie temporal: todos los días/horas; null donde todavía no se medía o es futuro ---
  const buckets = periodBuckets(period);
  const nowMs = now.getTime();
  const prevEndMs = new Date(comparisonRange.end).getTime();
  // Corrimiento entre el período anterior y el actual: alinea cada día/hora con su par
  const shiftMs = new Date(period.start).getTime() - new Date(comparisonRange.start).getTime();

  const series = {
    labels: buckets.map((b) => b.label),
    current: {} as Record<MetricKey, Array<number | null>>,
    previous: {} as Record<MetricKey, Array<number | null>>,
  };
  for (const metric of METRIC_KEYS) {
    const coverageStart = metrics[metric].status === "not_applicable" ? null : metrics[metric].coverageStart;
    const covMs = coverageStart ? new Date(coverageStart).getTime() : Infinity;
    const cur: Array<number | null> = buckets.map((b) => {
      const s = new Date(b.start).getTime();
      const e = new Date(b.end).getTime();
      return e <= covMs || s > nowMs ? null : 0;
    });
    const prev: Array<number | null> = buckets.map((b) => {
      const s = new Date(b.start).getTime() - shiftMs;
      const e = new Date(b.end).getTime() - shiftMs;
      return e <= covMs || s >= prevEndMs ? null : 0;
    });
    const type = METRICS[metric];
    for (const ev of current) {
      if (ev.event_type !== type) continue;
      const i = bucketIndex(new Date(ev.created_at), period.from, period.granularity);
      if (cur[i] !== null && cur[i] !== undefined) cur[i] = (cur[i] as number) + 1;
    }
    for (const ev of previous) {
      if (ev.event_type !== type) continue;
      const shifted = new Date(new Date(ev.created_at).getTime() + shiftMs);
      const i = bucketIndex(shifted, period.from, period.granularity);
      if (prev[i] !== null && prev[i] !== undefined) prev[i] = (prev[i] as number) + 1;
    }
    series.current[metric] = cur;
    series.previous[metric] = metrics[metric].comparable ? prev : prev.map(() => null);
  }

  // --- Productos ---
  const products = new Map<string, ProductRow & { lastViewAt: string }>();
  for (const ev of current) {
    const key = eventProductKey(ev);
    const fam = eventFamily(ev);
    if (!key || !fam || !ev.product_code) continue;
    let row = products.get(key);
    if (!row) {
      row = {
        key,
        family: fam,
        code: ev.product_code,
        name: ev.product_name || ev.product_code,
        category: ev.category,
        path: productFallbackPath(fam, ev.product_code),
        image: null,
        views: 0,
        documentClicks: 0,
        whatsappClicks: 0,
        whatsappOpens: 0,
        lastViewAt: "",
      };
      products.set(key, row);
    }
    switch (ev.event_type) {
      case EVENT_TYPES.viewProduct:
        row.views += 1;
        if (ev.created_at > row.lastViewAt) {
          row.lastViewAt = ev.created_at;
          row.name = ev.product_name || row.name;
          row.category = ev.category || row.category;
          row.path = metaString(ev, "path") || row.path;
        }
        break;
      case EVENT_TYPES.documentClick:
        row.documentClicks += 1;
        break;
      case EVENT_TYPES.whatsappClick:
        row.whatsappClicks += 1;
        break;
      case EVENT_TYPES.whatsappOpen:
        row.whatsappOpens += 1;
        break;
    }
  }
  const productRows = [...products.values()]
    .map(({ lastViewAt: _ignored, ...row }) => row)
    .sort(
      (a, b) =>
        b.views - a.views ||
        b.documentClicks + b.whatsappClicks - (a.documentClicks + a.whatsappClicks) ||
        a.name.localeCompare(b.name),
    );

  // --- Familias ---
  const families = (family ? [family] : [...FAMILIES]).map((f) => {
    const cats = new Map<string, CountRow>();
    let views = 0;
    for (const ev of current) {
      if (ev.event_type !== EVENT_TYPES.viewProduct || eventFamily(ev) !== f) continue;
      views += 1;
      const cat = ev.category || FAMILY_LABELS[f];
      inc(cats, cat, cat);
    }
    return {
      family: f,
      label: FAMILY_LABELS[f],
      views,
      coverageStart: coverage.viewsByFamily[f],
      categories: f === "luminarias" ? sortedRows(cats, 8) : [],
    };
  });

  // --- Documentación ---
  const docs = current.filter((e) => e.event_type === EVENT_TYPES.documentClick);
  const topDocs = new Map<string, CountRow>();
  for (const ev of docs) {
    const docType = metaString(ev, "doc_type");
    const label = metaString(ev, "doc_label") || DOC_TYPE_LABELS[docType] || "Documento";
    const slug = metaString(ev, "slug");
    const owner = ev.product_name || (slug ? `Descargas "${slug}"` : "");
    const id = `${eventProductKey(ev) ?? `page:${slug}`}|${metaString(ev, "target_id") || label}`;
    inc(topDocs, id, label, owner);
  }
  const pages = new Map<string, { slug: string; views: number; fileClicks: number }>();
  for (const ev of current) {
    const slug = metaString(ev, "slug");
    if (!slug) continue;
    if (ev.event_type !== EVENT_TYPES.viewDownloadPage && !(ev.event_type === EVENT_TYPES.documentClick && metaString(ev, "location") === "download_page")) continue;
    const row = pages.get(slug) ?? { slug, views: 0, fileClicks: 0 };
    if (ev.event_type === EVENT_TYPES.viewDownloadPage) row.views += 1;
    else row.fileClicks += 1;
    pages.set(slug, row);
  }
  const docsFromProducts = docs.filter((e) => eventProductKey(e)).length;

  // --- Contactos ---
  const split = (type: string) => {
    const list = current.filter((e) => e.event_type === type);
    const fromProducts = list.filter((e) => eventProductKey(e)).length;
    return { total: list.length, fromProducts, general: list.length - fromProducts };
  };
  const byReason = new Map<string, CountRow>();
  const byPage = new Map<string, CountRow>();
  for (const ev of current) {
    if (ev.event_type !== EVENT_TYPES.whatsappClick) continue;
    const reason = metaString(ev, "reason") || "sin_motivo";
    inc(byReason, reason, WHATSAPP_REASON_LABELS[reason] ?? "Sin motivo registrado");
    const label = pageLabel(metaString(ev, "path"));
    inc(byPage, label, label);
  }
  const distributors = current.filter((e) => e.event_type === EVENT_TYPES.distributorClick);
  const byAction = new Map<string, CountRow>();
  const topDistributors = new Map<string, CountRow>();
  for (const ev of distributors) {
    const action = metaString(ev, "action") || "otro";
    inc(byAction, action, DISTRIBUTOR_ACTION_LABELS[action] ?? action);
    const id = metaString(ev, "target_id") || metaString(ev, "distributor_name");
    inc(topDistributors, id, metaString(ev, "distributor_name") || `Distribuidor ${id}`, metaString(ev, "province") || undefined);
  }

  // --- Origen de las visitas (fichas y páginas de descargas) ---
  const kinds = new Map<string, CountRow>();
  const topSources = new Map<string, CountRow>();
  let sourceTotal = 0;
  for (const ev of current) {
    if (ev.event_type !== EVENT_TYPES.viewProduct && ev.event_type !== EVENT_TYPES.viewDownloadPage) continue;
    sourceTotal += 1;
    const src = sourceOf(metaString(ev, "referrer"));
    inc(kinds, src.kind, SOURCE_KIND_LABELS[src.kind as SourceKind]);
    inc(topSources, `${src.kind}|${src.label}`, src.label, SOURCE_KIND_LABELS[src.kind as SourceKind]);
  }

  return {
    period,
    comparisonRange,
    family,
    generatedAt: now.toISOString(),
    excludedDevEvents,
    includesDevEvents: !!input.includeDevEvents,
    metrics,
    series,
    products: productRows,
    families,
    documents: {
      total: docs.length,
      fromProducts: docsFromProducts,
      general: docs.length - docsFromProducts,
      top: sortedRows(topDocs, 8),
      downloadPages: [...pages.values()].sort((a, b) => b.views + b.fileClicks - (a.views + a.fileClicks)),
    },
    contacts: {
      whatsappOpens: split(EVENT_TYPES.whatsappOpen),
      whatsappClicks: split(EVENT_TYPES.whatsappClick),
      whatsappByReason: sortedRows(byReason),
      whatsappByPage: sortedRows(byPage, 6),
      distributorTotal: distributors.length,
      distributorByAction: sortedRows(byAction),
      distributorTop: sortedRows(topDistributors, 6),
    },
    sources: { kinds: sortedRows(kinds), top: sortedRows(topSources, 8), total: sourceTotal },
    coverage,
  };
}

