import { NextRequest, NextResponse } from "next/server";

import { PeriodError, previousComparableRange, resolvePeriod, type PresetId } from "@/lib/analytics/site-stats/period";
import { createVercelQuery, vercelConfig } from "@/lib/analytics/vercel-traffic/client";
import { buildVercelTraffic, emptyVercelTraffic } from "@/lib/analytics/vercel-traffic/traffic";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const PRESETS: PresetId[] = ["today", "yesterday", "7d", "30d", "custom"];
// "Ahora" redondeado: así las consultas repetidas usan la caché y no gastan el límite de Vercel
const NOW_STEP_MS = 5 * 60000;

/**
 * GET /api/analytics/vercel-traffic?preset=...&from=...&to=...
 * Visitantes y páginas vistas de la web pública (Vercel Web Analytics). El token queda en el servidor.
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

    const now = new Date(Math.floor(Date.now() / NOW_STEP_MS) * NOW_STEP_MS);
    const config = vercelConfig();
    if (!config) return NextResponse.json(emptyVercelTraffic("not_configured", 31, now));

    const period = resolvePeriod(preset, now, { from: params.get("from"), to: params.get("to") });
    try {
      const traffic = await buildVercelTraffic({
        period,
        comparisonRange: previousComparableRange(period),
        now,
        query: createVercelQuery(config),
        retentionDays: config.retentionDays,
      });
      return NextResponse.json(traffic);
    } catch (error) {
      console.error("Vercel traffic error:", error);
      return NextResponse.json(emptyVercelTraffic("error", config.retentionDays, now));
    }
  } catch (error) {
    if (error instanceof PeriodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Vercel traffic route error:", error);
    return NextResponse.json({ error: "No se pudo cargar el tráfico de la web" }, { status: 500 });
  }
}
