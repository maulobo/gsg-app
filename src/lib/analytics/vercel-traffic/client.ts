// Solo del lado del servidor: usa el token privado de Vercel
import type { Range } from "../site-stats/period";
import type { TrafficQuery, TrafficRow } from "./traffic";

const API = "https://api.vercel.com/v1/query/web-analytics/visits/aggregate";
const CACHE_TTL_MS = 10 * 60000;
const CACHE_MAX = 600;

export interface VercelConfig {
  token: string;
  projectId: string;
  teamId?: string;
  /** Días de historia que conserva el plan (Hobby: 31) */
  retentionDays: number;
}

export function vercelConfig(): VercelConfig | null {
  const token = process.env.VERCEL_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_ANALYTICS_PROJECT_ID;
  if (!token || !projectId) return null;
  const retention = Number(process.env.VERCEL_ANALYTICS_RETENTION_DAYS);
  return {
    token,
    projectId,
    teamId: process.env.VERCEL_ANALYTICS_TEAM_ID || undefined,
    retentionDays: Number.isFinite(retention) && retention > 0 ? retention : 31,
  };
}

export class VercelAnalyticsError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Las consultas se repiten mucho (cada cambio de filtro) y Vercel limita la cantidad por minuto
const cache = new Map<string, { at: number; rows: TrafficRow[] }>();

export function createVercelQuery(config: VercelConfig): TrafficQuery {
  return async (by: string, range: Range, limit?: number) => {
    const params = new URLSearchParams({
      projectId: config.projectId,
      by,
      since: String(new Date(range.start).getTime()),
      // `until` es inclusivo en Vercel; el rango es [start, end)
      until: String(new Date(range.end).getTime() - 1),
    });
    if (config.teamId) params.set("teamId", config.teamId);
    if (limit) params.set("limit", String(limit));
    const url = `${API}?${params}`;

    const hit = cache.get(url);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.rows;

    const res = await fetch(url, { headers: { Authorization: `Bearer ${config.token}` }, cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new VercelAnalyticsError(body?.error?.message || `Vercel respondió ${res.status}`, res.status);

    const rows = (Array.isArray(body.data) ? body.data : []) as TrafficRow[];
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!);
    cache.set(url, { at: Date.now(), rows });
    return rows;
  };
}
