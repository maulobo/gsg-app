import { NextRequest, NextResponse } from "next/server";

import {
  aggregateProductViewEvents,
  fetchAllProductViewEvents,
  isMissingProductViewStatsRpcError,
  parseAnalyticsDateRange,
  previousPeriodRange,
  type ProductViewEvent,
  type ProductViewStats,
} from "@/lib/analytics/product-view-stats";
import {
  createAdminSupabaseClient,
  createServerSupabaseClient,
} from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const sessionClient = await createServerSupabaseClient();
    const { data: authData, error: authError } = await sessionClient.auth.getUser();

    if (authError || !authData.user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const { start, end } = parseAnalyticsDateRange(
      searchParams.get("start"),
      searchParams.get("end"),
    );
    const previous = previousPeriodRange(start, end);
    const admin = createAdminSupabaseClient();
    const { data: rpcData, error: rpcError } = await admin.rpc("get_product_view_stats", {
      p_start: start,
      p_end: end,
      p_prev_start: previous?.start ?? null,
      p_prev_end: previous?.end ?? null,
    });

    if (!rpcError) {
      return NextResponse.json(rpcData as ProductViewStats);
    }

    if (!isMissingProductViewStatsRpcError(rpcError)) {
      throw rpcError;
    }

    const events = await fetchAllProductViewEvents(async (from, to) => {
      let query = admin
        .from("analytics_events")
        .select("id, product_name, product_code, created_at, metadata")
        .eq("event_type", "view_product")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (start) query = query.gte("created_at", start);
      if (end) query = query.lte("created_at", end);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as ProductViewEvent[];
    });

    return NextResponse.json(aggregateProductViewEvents(events));
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudieron cargar las estadísticas";
    const status = /fecha/i.test(message) ? 400 : 500;
    console.error("Product view analytics error:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
