/**
 * Períodos de Estadísticas. Todo se calcula en la zona horaria de GSG,
 * sin depender de la zona del navegador ni del servidor.
 */

export const STATS_TIME_ZONE = "America/Argentina/Cordoba";
export const MAX_CUSTOM_DAYS = 366;

export type PresetId = "today" | "yesterday" | "7d" | "30d" | "custom";
export type Granularity = "hour" | "day";

export interface ResolvedPeriod {
  preset: PresetId;
  /** Primer día incluido (YYYY-MM-DD, hora de Córdoba) */
  from: string;
  /** Último día incluido */
  to: string;
  /** Inicio del período (ISO) */
  start: string;
  /** Fin exclusivo del período completo (ISO) */
  end: string;
  /** Fin efectivo: el fin o "ahora" si el período todavía no terminó (ISO) */
  effectiveEnd: string;
  isPartial: boolean;
  days: number;
  granularity: Granularity;
}

export interface Range {
  start: string;
  end: string;
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: STATS_TIME_ZONE,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function zonedParts(at: Date) {
  const parts = partsFormatter.formatToParts(at);
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** Minutos que la hora local de Córdoba está adelantada respecto de UTC en ese instante */
function tzOffsetMinutes(at: Date): number {
  const p = zonedParts(at);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60000);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Día (YYYY-MM-DD) en hora de Córdoba */
export function localDay(at: Date): string {
  const p = zonedParts(at);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

/** Hora (0-23) en hora de Córdoba */
export function localHour(at: Date): number {
  return zonedParts(at).hour;
}

/** Instante UTC de las 00:00 de ese día en Córdoba */
export function startOfLocalDay(ymd: string): Date {
  const [y, m, d] = ymd.split("-").map(Number);
  const guess = Date.UTC(y, m - 1, d);
  let instant = guess - tzOffsetMinutes(new Date(guess)) * 60000;
  // Segunda pasada por si el offset cambia justo en ese día
  instant = guess - tzOffsetMinutes(new Date(instant)) * 60000;
  return new Date(instant);
}

export function addDays(ymd: string, n: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + n));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

function ymdToUtc(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((ymdToUtc(to) - ymdToUtc(from)) / 86400000);
}

function isValidYmd(ymd: string): boolean {
  if (!YMD_RE.test(ymd)) return false;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export class PeriodError extends Error {}

export function resolvePeriod(
  preset: PresetId,
  now: Date,
  custom?: { from?: string | null; to?: string | null },
): ResolvedPeriod {
  const today = localDay(now);
  let from: string;
  let to: string;

  switch (preset) {
    case "today":
      from = to = today;
      break;
    case "yesterday":
      from = to = addDays(today, -1);
      break;
    case "7d":
      from = addDays(today, -6);
      to = today;
      break;
    case "30d":
      from = addDays(today, -29);
      to = today;
      break;
    case "custom": {
      const cFrom = custom?.from ?? "";
      const cTo = custom?.to ?? "";
      if (!isValidYmd(cFrom) || !isValidYmd(cTo)) throw new PeriodError("Elegí una fecha de inicio y una de fin válidas");
      if (cFrom > cTo) throw new PeriodError("La fecha de inicio no puede ser posterior a la de fin");
      if (cFrom > today) throw new PeriodError("El período no puede empezar en el futuro");
      to = cTo > today ? today : cTo;
      from = cFrom;
      if (daysBetween(from, to) + 1 > MAX_CUSTOM_DAYS) {
        throw new PeriodError(`El período puede tener como máximo ${MAX_CUSTOM_DAYS} días`);
      }
      break;
    }
    default:
      throw new PeriodError("Período inválido");
  }

  const start = startOfLocalDay(from);
  const end = startOfLocalDay(addDays(to, 1));
  const isPartial = now < end;
  const days = daysBetween(from, to) + 1;

  return {
    preset,
    from,
    to,
    start: start.toISOString(),
    end: end.toISOString(),
    effectiveEnd: (isPartial ? now : end).toISOString(),
    isPartial,
    days,
    granularity: days === 1 ? "hour" : "day",
  };
}

/**
 * Período anterior comparable: misma cantidad de días inmediatamente antes, y si el actual
 * está incompleto, solo el mismo tramo transcurrido (ej: hoy hasta las 15 h vs ayer hasta las 15 h).
 */
export function previousComparableRange(period: ResolvedPeriod): Range {
  const prevStart = startOfLocalDay(addDays(period.from, -period.days));
  const elapsed = new Date(period.effectiveEnd).getTime() - new Date(period.start).getTime();
  return {
    start: prevStart.toISOString(),
    end: new Date(prevStart.getTime() + elapsed).toISOString(),
  };
}

export interface Bucket {
  key: string;
  label: string;
  /** Inicio del bucket (ISO) */
  start: string;
  /** Fin exclusivo del bucket (ISO) */
  end: string;
}

const DAY_LABEL = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "short" });

/** Todos los días (o las 24 horas) del período, aunque no tengan eventos */
export function periodBuckets(period: ResolvedPeriod): Bucket[] {
  if (period.granularity === "hour") {
    const dayStart = new Date(period.start).getTime();
    return Array.from({ length: 24 }, (_, h) => ({
      key: pad(h),
      label: `${pad(h)} h`,
      start: new Date(dayStart + h * 3600000).toISOString(),
      end: new Date(dayStart + (h + 1) * 3600000).toISOString(),
    }));
  }
  return Array.from({ length: period.days }, (_, i) => {
    const ymd = addDays(period.from, i);
    const [y, m, d] = ymd.split("-").map(Number);
    return {
      key: ymd,
      label: DAY_LABEL.format(new Date(Date.UTC(y, m - 1, d))),
      start: startOfLocalDay(ymd).toISOString(),
      end: startOfLocalDay(addDays(ymd, 1)).toISOString(),
    };
  });
}

/** Posición del instante dentro del período que empieza en `periodStart` (día o hora) */
export function bucketIndex(at: Date, periodFrom: string, granularity: Granularity): number {
  if (granularity === "hour") return localHour(at);
  return daysBetween(periodFrom, localDay(at));
}
