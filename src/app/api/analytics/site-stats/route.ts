import { NextRequest, NextResponse } from "next/server";

import { aggregateSiteStats } from "@/lib/analytics/site-stats/aggregate";
import { attachProductImages, fetchCoverage, fetchEventsInRange } from "@/lib/analytics/site-stats/fetch";
import { isFamily } from "@/lib/analytics/site-stats/labels";
import { PeriodError, previousComparableRange, resolvePeriod, type PresetId } from "@/lib/analytics/site-stats/period";
import { createAdminSupabaseClient, createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PRESETS: PresetId[] = ["today", "yesterday", "7d", "30d", "custom"];
const MAX_PRODUCTS = 100;

/**
 * GET /api/analytics/site-stats?preset=7d|30d|today|yesterday|custom&from=YYYY-MM-DD&to=YYYY-MM-DD&family=fuentes
 * Solo para usuarios con sesión; la lectura usa service role del lado del servidor.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: authData, error: authError } = await sessionClient.auth.getUser();
    if (authError || !authData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const params = request.nextUrl.searchParams;
    const preset = (params.get("preset") || "7d") as PresetId;
    if (!PRESETS.includes(preset)) {
      return NextResponse.json({ error: "Período inválido" }, { status: 400 });
    }
    const familyParam = params.get("family");
    if (familyParam && !isFamily(familyParam)) {
      return NextResponse.json({ error: "Familia inválida" }, { status: 400 });
    }

    // Datos de prueba (localhost/preview) solo visibles corriendo el admin en desarrollo
    const includeDevEvents = process.env.NODE_ENV !== "production" && params.get("include_dev") === "1";

    const now = new Date();
    const period = resolvePeriod(preset, now, { from: params.get("from"), to: params.get("to") });
    const comparisonRange = previousComparableRange(period);

    const admin = createAdminSupabaseClient();
    const [current, previous, coverage] = await Promise.all([
      fetchEventsInRange(admin, { start: period.start, end: period.effectiveEnd }),
      fetchEventsInRange(admin, comparisonRange),
      fetchCoverage(admin, includeDevEvents),
    ]);

    const stats = aggregateSiteStats({
      current,
      previous,
      period,
      comparisonRange,
      family: familyParam && isFamily(familyParam) ? familyParam : null,
      coverage,
      now,
      includeDevEvents,
    });
    stats.products = stats.products.slice(0, MAX_PRODUCTS);
    await attachProductImages(admin, stats.products);

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof PeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Site stats error:", error);
    return NextResponse.json({ error: "No se pudieron cargar las estadísticas" }, { status: 500 });
  }
}
