import type { SupabaseClient } from "@supabase/supabase-js";

import { FAMILIES, TRACKED_EVENT_TYPES, type AnalyticsEventRow, type Family } from "./labels.ts";
import type { Coverage, ProductRow } from "./aggregate.ts";
import type { Range } from "./period.ts";

export const PAGE_SIZE = 1000;

/** Lee todas las páginas hasta que una venga incompleta: no se pierden registros por encima de 1000 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => Promise<T[]>,
  pageSize = PAGE_SIZE,
): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const page = await fetchPage(from, from + pageSize - 1);
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

const EVENT_COLUMNS = "id, event_type, product_code, product_name, category, created_at, metadata";

/** Eventos del rango [start, end) ordenados por id (orden estable para paginar) */
export function fetchEventsInRange(admin: SupabaseClient, range: Range): Promise<AnalyticsEventRow[]> {
  return fetchAllPages(async (from, to) => {
    const { data, error } = await admin
      .from("analytics_events")
      .select(EVENT_COLUMNS)
      .in("event_type", TRACKED_EVENT_TYPES)
      .gte("created_at", range.start)
      .lt("created_at", range.end)
      .order("id", { ascending: true })
      .range(from, to);
    if (error) throw error;
    return (data ?? []) as AnalyticsEventRow[];
  });
}

// Producción: los eventos nuevos traen env; los históricos no lo tienen
const PRODUCTION_FILTER = "metadata->>env.is.null,metadata->>env.eq.production";

async function firstEventAt(
  admin: SupabaseClient,
  eventType: string,
  extra?: (q: any) => any,
): Promise<string | null> {
  let query = admin
    .from("analytics_events")
    .select("created_at")
    .eq("event_type", eventType)
    .or(PRODUCTION_FILTER);
  if (extra) query = extra(query);
  const { data, error } = await query.order("created_at", { ascending: true }).limit(1);
  if (error) throw error;
  return (data?.[0]?.created_at as string | undefined) ?? null;
}

/** Desde cuándo existe cada medición (primer evento de producción) */
export async function fetchCoverage(admin: SupabaseClient): Promise<Coverage> {
  const types = TRACKED_EVENT_TYPES.filter((t) => t !== "view_product");
  const [byType, byFamily] = await Promise.all([
    Promise.all(types.map(async (t) => [t, await firstEventAt(admin, t)] as const)),
    Promise.all(
      FAMILIES.map(
        async (f) =>
          [
            f,
            await firstEventAt(admin, "view_product", (q) =>
              // Histórico sin familia = luminarias
              f === "luminarias" ? q.or("metadata->>family.is.null,metadata->>family.eq.luminarias") : q.eq("metadata->>family", f),
            ),
          ] as const,
      ),
    ),
  ]);

  const viewsByFamily = Object.fromEntries(byFamily) as Record<Family, string | null>;
  const firstView = Object.values(viewsByFamily).reduce<string | null>(
    (acc, v) => (!acc ? v : !v ? acc : v < acc ? v : acc),
    null,
  );
  return {
    byEvent: { ...Object.fromEntries(byType), view_product: firstView },
    viewsByFamily,
  };
}

type MediaRow = { path: string; kind: string; variant_id?: number | null };

function pickImage(media: MediaRow[] | null | undefined): string | null {
  if (!media?.length) return null;
  const rank = (m: MediaRow) => (m.kind === "cover" ? 0 : m.kind === "gallery" ? 1 : 2) + (m.variant_id ? 3 : 0);
  const images = media.filter((m) => !/\.pdf($|\?)/i.test(m.path) && ["cover", "gallery"].includes(m.kind));
  return [...images].sort((a, b) => rank(a) - rank(b))[0]?.path ?? null;
}

/** Miniatura de cada producto del ranking según su familia */
export async function attachProductImages(admin: SupabaseClient, products: ProductRow[]): Promise<void> {
  const codes = (family: Family) => [...new Set(products.filter((p) => p.family === family).map((p) => p.code))];
  const images = new Map<string, string | null>();
  const set = (family: Family, code: string | number, image: string | null) => images.set(`${family}:${code}`, image);

  const tasks: Array<Promise<void>> = [];
  const lum = codes("luminarias");
  if (lum.length)
    tasks.push(
      (async () => {
        const { data } = await admin
          .from("products")
          .select("code, media_assets!media_assets_product_id_fkey ( path, kind, variant_id )")
          .in("code", lum);
        for (const p of data ?? []) set("luminarias", p.code, pickImage(p.media_assets as MediaRow[]));
      })(),
    );
  const per = codes("perfiles");
  if (per.length)
    tasks.push(
      (async () => {
        const { data } = await admin.from("led_profiles").select("code, led_profile_media ( path, kind )").in("code", per);
        for (const p of data ?? []) set("perfiles", p.code, pickImage(p.led_profile_media as MediaRow[]));
      })(),
    );
  const rol = codes("rollos").map(Number).filter(Number.isFinite);
  if (rol.length)
    tasks.push(
      (async () => {
        const { data } = await admin.from("led_roll_families").select("id, led_roll_family_media ( path, kind )").in("id", rol);
        for (const p of data ?? []) set("rollos", p.id, pickImage(p.led_roll_family_media as MediaRow[]));
      })(),
    );
  for (const [family, table] of [
    ["accesorios", "accessories"],
    ["fuentes", "power_supplies"],
  ] as const) {
    const list = codes(family);
    if (list.length)
      tasks.push(
        (async () => {
          const { data } = await admin.from(table).select("code, photo_url").in("code", list);
          for (const p of data ?? []) set(family, p.code, p.photo_url ?? null);
        })(),
      );
  }

  // Una miniatura faltante no debe romper la pantalla
  await Promise.allSettled(tasks);
  for (const p of products) p.image = images.get(`${p.family}:${p.code}`) ?? null;
}
