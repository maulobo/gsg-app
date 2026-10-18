/**
 * Tráfico de la web según Vercel Web Analytics: visitantes únicos y páginas vistas.
 * Vercel agrupa los días en UTC, así que cada día de Córdoba se pide con su horario exacto.
 */

import type { CountRow } from "../site-stats/aggregate.ts";
import { pageLabel, sourceOf } from "../site-stats/labels.ts";
import { addDays, periodBuckets, startOfLocalDay, type Range, type ResolvedPeriod } from "../site-stats/period.ts";

export type TrafficRow = Record<string, unknown> & { visitors: number; pageviews: number; timestamp?: string };

/** Consulta a visits/aggregate agrupando por `by` dentro del rango [start, end) */
export type TrafficQuery = (by: string, range: Range, limit?: number) => Promise<TrafficRow[]>;

export type TrafficStatus = "ok" | "out_of_range" | "not_configured" | "error";

export interface VercelTraffic {
  status: TrafficStatus;
  retentionDays: number;
  /** Primer instante que Vercel todavía conserva (ISO) */
  availableFrom: string;
  /** El período empieza antes de lo que Vercel conserva: se muestran solo los días disponibles */
  clipped: boolean;
  totals: {
    visitors: number;
    pageviews: number;
    previousVisitors: number | null;
    previousPageviews: number | null;
    comparable: boolean;
  };
  series: {
    labels: string[];
    current: { visitors: Array<number | null>; pageviews: Array<number | null> };
    previous: { visitors: Array<number | null>; pageviews: Array<number | null> } | null;
  };
  pages: CountRow[];
  sources: CountRow[];
  devices: CountRow[];
  countries: CountRow[];
}

const HOUR = 3600000;
const DAY = 86400000;
const CONCURRENCY = 6;

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

const sum = (rows: TrafficRow[]) =>
  rows.reduce((acc, r) => ({ visitors: acc.visitors + (r.visitors || 0), pageviews: acc.pageviews + (r.pageviews || 0) }), {
    visitors: 0,
    pageviews: 0,
  });

const iso = (ms: number) => new Date(ms).toISOString();
const ms = (s: string) => new Date(s).getTime();

/** Agrupa filas con el mismo nombre; "Otros" de Vercel siempre al final */
function rank(rows: TrafficRow[], key: string, metric: "visitors" | "pageviews", label: (v: string) => string, others: string): CountRow[] {
  const merged = new Map<string, CountRow>();
  let rest = 0;
  for (const r of rows) {
    const raw = String(r[key] ?? "");
    if (raw === "Others") {
      rest += r[metric] || 0;
      continue;
    }
    const name = label(raw);
    const row = merged.get(name) ?? { id: name, label: name, count: 0 };
    row.count += r[metric] || 0;
    merged.set(name, row);
  }
  const list = [...merged.values()].filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  if (rest > 0) list.push({ id: "others", label: others, count: rest });
  return list;
}

function routeLabel(route: string): string {
  if (/^\/descargas\/\[/.test(route)) return "Páginas de descargas (QR)";
  return pageLabel(route);
}

const DEVICE_LABELS: Record<string, string> = { desktop: "Computadora", mobile: "Celular", tablet: "Tablet" };

let regionNames: Intl.DisplayNames | null = null;
function countryLabel(code: string): string {
  if (!code) return "Desconocido";
  try {
    regionNames ??= new Intl.DisplayNames(["es"], { type: "region" });
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

function emptyTraffic(status: TrafficStatus, retentionDays: number, availableFrom: string, labels: string[] = []): VercelTraffic {
  const blank = labels.map(() => null);
  return {
    status,
    retentionDays,
    availableFrom,
    clipped: false,
    totals: { visitors: 0, pageviews: 0, previousVisitors: null, previousPageviews: null, comparable: false },
    series: { labels, current: { visitors: blank, pageviews: [...blank] }, previous: null },
    pages: [],
    sources: [],
    devices: [],
    countries: [],
  };
}

export function emptyVercelTraffic(status: "not_configured" | "error", retentionDays: number, now: Date): VercelTraffic {
  return emptyTraffic(status, retentionDays, iso(now.getTime() - retentionDays * DAY));
}

/** Serie por hora del rango: índice = horas desde `start`; las horas posteriores a `end` quedan vacías */
async function hourlySeries(query: TrafficQuery, range: Range) {
  const rows = await query("hour", range);
  const visitors: Array<number | null> = Array.from({ length: 24 }, (_, h) => (ms(range.start) + h * HOUR < ms(range.end) ? 0 : null));
  const pageviews = [...visitors];
  for (const r of rows) {
    const i = Math.round((ms(r.timestamp ?? "") - ms(range.start)) / HOUR);
    if (i >= 0 && i < 24 && visitors[i] !== null) {
      visitors[i] = (visitors[i] ?? 0) + (r.visitors || 0);
      pageviews[i] = (pageviews[i] ?? 0) + (r.pageviews || 0);
    }
  }
  return { visitors, pageviews };
}

/** Un total exacto por día (los visitantes únicos no se pueden sumar por hora) */
async function dailySeries(query: TrafficQuery, ranges: Array<Range | null>) {
  const totals = await mapLimit(ranges, CONCURRENCY, async (r) => (r ? sum(await query("environment", r)) : null));
  return { visitors: totals.map((t) => t?.visitors ?? null), pageviews: totals.map((t) => t?.pageviews ?? null) };
}

export async function buildVercelTraffic({
  period,
  comparisonRange,
  now,
  query,
  retentionDays,
}: {
  period: ResolvedPeriod;
  comparisonRange: Range;
  now: Date;
  query: TrafficQuery;
  retentionDays: number;
}): Promise<VercelTraffic> {
  // Margen para no pedir justo en el borde de lo que Vercel conserva
  const earliest = now.getTime() - retentionDays * DAY + 10 * 60000;
  const availableFrom = iso(earliest);
  const buckets = periodBuckets(period);
  const labels = buckets.map((b) => b.label);
  const end = period.effectiveEnd;

  // Primer instante del período con datos completos disponibles
  let start = period.start;
  if (ms(start) < earliest) {
    const firstFull = period.granularity === "day" ? buckets.find((b) => ms(b.start) >= earliest && ms(b.start) < ms(end)) : undefined;
    if (!firstFull) return emptyTraffic("out_of_range", retentionDays, availableFrom, labels);
    start = firstFull.start;
  }
  const clipped = start !== period.start;
  const current: Range = { start, end };
  const previousAvailable = !clipped && ms(comparisonRange.start) >= earliest && ms(comparisonRange.end) > ms(comparisonRange.start);

  let series: VercelTraffic["series"];
  if (period.granularity === "hour") {
    const [cur, prev] = await Promise.all([
      hourlySeries(query, current),
      previousAvailable ? hourlySeries(query, comparisonRange) : Promise.resolve(null),
    ]);
    series = { labels, current: cur, previous: prev };
  } else {
    const prevFrom = addDays(period.from, -period.days);
    const curRanges = buckets.map((b) =>
      ms(b.start) >= ms(start) && ms(b.start) < ms(end) ? { start: b.start, end: iso(Math.min(ms(b.end), ms(end))) } : null,
    );
    const prevRanges = buckets.map((_, i) => {
      const s = startOfLocalDay(addDays(prevFrom, i)).getTime();
      const e = Math.min(startOfLocalDay(addDays(prevFrom, i + 1)).getTime(), ms(comparisonRange.end));
      return s < e ? { start: iso(s), end: iso(e) } : null;
    });
    const [cur, prev] = await Promise.all([
      dailySeries(query, curRanges),
      previousAvailable ? dailySeries(query, prevRanges) : Promise.resolve(null),
    ]);
    series = { labels, current: cur, previous: prev };
  }

  const [totalRows, prevRows, routes, referrers, devices, countries] = await Promise.all([
    query("environment", current),
    previousAvailable ? query("environment", comparisonRange) : Promise.resolve(null),
    query("route", current, 12),
    query("referrerHostname", current, 12),
    query("deviceType", current),
    query("country", current, 8),
  ]);
  const totals = sum(totalRows);
  const prevTotals = prevRows ? sum(prevRows) : null;

  return {
    status: "ok",
    retentionDays,
    availableFrom,
    clipped,
    totals: {
      ...totals,
      previousVisitors: prevTotals?.visitors ?? null,
      previousPageviews: prevTotals?.pageviews ?? null,
      comparable: !!prevTotals,
    },
    series,
    pages: rank(routes, "route", "pageviews", routeLabel, "Otras páginas"),
    sources: rank(referrers, "referrerHostname", "visitors", (h) => sourceOf(h ? `https://${h}` : "").label, "Otros"),
    devices: rank(devices, "deviceType", "visitors", (d) => DEVICE_LABELS[d] ?? "Otro", "Otros"),
    countries: rank(countries, "country", "visitors", countryLabel, "Otros países"),
  };
}
