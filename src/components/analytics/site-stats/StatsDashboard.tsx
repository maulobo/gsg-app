"use client";

import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { MetricKey, SiteStats } from "@/lib/analytics/site-stats/aggregate";
import { FAMILY_LABELS } from "@/lib/analytics/site-stats/labels";
import { addDays, localDay } from "@/lib/analytics/site-stats/period";

import { ActivityPanels, FamilyBreakdown } from "./Breakdowns";
import { formatDate, formatInt, formatYmd } from "./format";
import KpiStrip from "./KpiStrip";
import ProductRanking from "./ProductRanking";
import StatsFilters, { type StatsQuery } from "./StatsFilters";
import TrendChart from "./TrendChart";

function initialQuery(): StatsQuery {
  const today = localDay(new Date());
  return { preset: "7d", from: addDays(today, -29), to: today, family: "" };
}

function Skeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-8">
      <div className="h-36 rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      <div className="h-72 rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <div className="h-80 rounded-xl bg-gray-100 dark:bg-gray-800/60" />
        <div className="h-80 rounded-xl bg-gray-100 dark:bg-gray-800/60" />
      </div>
    </div>
  );
}

export default function StatsDashboard() {
  const [query, setQuery] = useState<StatsQuery>(initialQuery);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricKey>("views");
  const requestId = useRef(0);

  const load = useCallback(async (q: StatsQuery) => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ preset: q.preset });
      // Verificación local con datos de prueba: /statistics?include_dev=1 (ignorado en producción)
      if (new URLSearchParams(window.location.search).get("include_dev") === "1") params.set("include_dev", "1");
      if (q.preset === "custom") {
        params.set("from", q.from);
        params.set("to", q.to);
      }
      if (q.family) params.set("family", q.family);
      const res = await fetch(`/api/analytics/site-stats?${params}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar las estadísticas");
      // Ignora respuestas viejas si el filtro cambió mientras cargaba
      if (id === requestId.current) setStats(data as SiteStats);
    } catch (e) {
      if (id === requestId.current) setError(e instanceof Error ? e.message : "No se pudieron cargar las estadísticas");
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(query);
  }, [query, load]);

  const periodText = stats
    ? stats.period.from === stats.period.to
      ? formatYmd(stats.period.from)
      : `${formatYmd(stats.period.from)} al ${formatYmd(stats.period.to)}`
    : "";

  const noActivity =
    stats &&
    (Object.values(stats.metrics).every((m) => !m.value) &&
      stats.contacts.whatsappOpens.total === 0 &&
      stats.contacts.distributorTotal === 0 &&
      stats.documents.downloadPages.length === 0);

  const attributedMeasured = !!stats && !!(stats.coverage.byEvent.document_click || stats.coverage.byEvent.whatsapp_click);

  return (
    <div className="mx-auto max-w-[1400px] space-y-8 p-4 md:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Estadísticas</h1>
          <p className="mt-1 text-sm text-gray-500" aria-live="polite">
            {stats ? (
              <>
                {periodText}
                {query.family && <> · {FAMILY_LABELS[query.family]}</>}
                {loading && " · actualizando…"}
              </>
            ) : (
              "Cargando…"
            )}
          </p>
        </div>
        <StatsFilters query={query} onChange={setQuery} disabled={false} />
      </header>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => load(query)}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-current px-3 py-1.5 font-medium sm:self-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
        </div>
      )}

      {!stats && loading && <Skeleton />}

      {stats && (
        <div className={`space-y-10 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {stats.includesDevEvents && (
            <p role="status" className="rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700 dark:bg-warning-500/10 dark:text-warning-400">
              Modo verificación: se incluyen eventos de prueba de desarrollo y preview.
            </p>
          )}
          {query.family && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Con filtro de familia solo se cuentan acciones hechas dentro de fichas de {FAMILY_LABELS[query.family]}. El catálogo, los
              distribuidores y las páginas de descargas no aplican.
            </p>
          )}

          <div className="space-y-6">
            <KpiStrip metrics={stats.metrics} selected={metric} onSelect={setMetric} isPartialPeriod={stats.period.isPartial} />
            {noActivity ? (
              <p className="rounded-xl border border-dashed border-gray-200 px-4 py-12 text-center text-sm text-gray-500 dark:border-gray-800">
                Sin actividad registrada en este período. Probá con un período más largo.
              </p>
            ) : (
              <TrendChart stats={stats} metric={metric} />
            )}
          </div>

          {!noActivity && (
            <>
              <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ProductRanking products={stats.products} attributedActionsMeasured={attributedMeasured} />
                <FamilyBreakdown stats={stats} />
              </div>
              <div className="border-t border-gray-200 pt-8 dark:border-gray-800">
                <ActivityPanels stats={stats} />
              </div>
            </>
          )}

          <footer className="space-y-1 border-t border-gray-200 pt-4 text-xs text-gray-500 dark:border-gray-800">
            <p>
              Fechas en hora de Córdoba (Argentina). Las vistas de fichas se miden desde el{" "}
              {stats.coverage.viewsByFamily.luminarias ? formatDate(stats.coverage.viewsByFamily.luminarias) : "—"} (luminarias); el resto de las
              métricas, desde que se publicó la versión de la web que las registra. Antes de esa fecha aparecen como &quot;sin medición&quot;, no
              como cero.
            </p>
            {stats.excludedDevEvents > 0 && (
              <p>
                Se excluyeron {formatInt(stats.excludedDevEvents)} {stats.excludedDevEvents === 1 ? "evento" : "eventos"} de prueba (desarrollo o
                preview).
              </p>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}
