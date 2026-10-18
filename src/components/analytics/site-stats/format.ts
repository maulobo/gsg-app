import { STATS_TIME_ZONE } from "@/lib/analytics/site-stats/period";

export const GSG_ACCENT = "#f53e16";

const intFmt = new Intl.NumberFormat("es-AR");
export const formatInt = (n: number) => intFmt.format(n);

const shortDate = new Intl.DateTimeFormat("es-AR", { timeZone: STATS_TIME_ZONE, day: "numeric", month: "short" });
const shortDateYear = new Intl.DateTimeFormat("es-AR", {
  timeZone: STATS_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDate = (iso: string) => shortDate.format(new Date(iso));
export const formatDateYear = (iso: string) => shortDateYear.format(new Date(iso));

/** YYYY-MM-DD como fecha corta, sin pasar por la zona del navegador */
export function formatYmd(ymd: string) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", day: "numeric", month: "short" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

export type Delta = { kind: "up" | "down" | "flat" | "new"; text: string };

export function delta(value: number, previous: number): Delta {
  if (previous === 0) return value === 0 ? { kind: "flat", text: "Sin cambios" } : { kind: "new", text: "Antes: 0" };
  const pct = ((value - previous) / previous) * 100;
  if (Math.abs(pct) < 0.5) return { kind: "flat", text: "Sin cambios" };
  const rounded = Math.abs(pct) >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10;
  return {
    kind: pct > 0 ? "up" : "down",
    text: `${pct > 0 ? "+" : "−"}${String(Math.abs(rounded)).replace(".", ",")} %`,
  };
}

export const share = (count: number, total: number) =>
  total ? `${String(Math.round((count / total) * 1000) / 10).replace(".", ",")} %` : "0 %";
