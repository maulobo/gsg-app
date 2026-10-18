"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "@/context/ThemeContext";
import type { VercelTraffic } from "@/lib/analytics/vercel-traffic/traffic";

import { RowList } from "./Breakdowns";
import { delta, formatDate, formatInt, GSG_ACCENT } from "./format";
import type { StatsQuery } from "./StatsFilters";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type TrafficMetric = "visitors" | "pageviews";

const INFO: Record<TrafficMetric, { label: string; help: string }> = {
  visitors: { label: "Visitantes únicos", help: "Personas distintas que entraron a la web, según Vercel." },
  pageviews: { label: "Páginas vistas", help: "Todas las páginas abiertas: inicio, listados, fichas, contacto." },
};

function Foot({ value, previous, isPartial }: { value: number; previous: number | null; isPartial: boolean }) {
  if (previous === null) return <span className="text-gray-500">Sin comparación disponible</span>;
  const d = delta(value, previous);
  const color =
    d.kind === "up" ? "text-success-600 dark:text-success-400" : d.kind === "down" ? "text-error-600 dark:text-error-400" : "text-gray-500";
  return (
    <span>
      <span className={`font-medium ${color}`}>{d.text}</span>{" "}
      <span className="text-gray-500">
        vs. {formatInt(previous)} {isPartial ? "en el mismo tramo anterior" : "en el período anterior"}
      </span>
    </span>
  );
}

function Chart({ traffic, metric, byHour }: { traffic: VercelTraffic; metric: TrafficMetric; byHour: boolean }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const { labels } = traffic.series;
  const options = useMemo<ApexOptions>(() => {
    const muted = dark ? "#9ca3af" : "#6b7280";
    return {
      chart: { type: "area", fontFamily: "Outfit, sans-serif", toolbar: { show: false }, zoom: { enabled: false }, animations: { enabled: false }, background: "transparent" },
      theme: { mode: dark ? "dark" : "light" },
      colors: [GSG_ACCENT, dark ? "#6b7280" : "#9ca3af"],
      stroke: { curve: "straight", width: [2.5, 1.5], dashArray: [0, 5] },
      fill: { type: ["gradient", "solid"], opacity: [1, 0], gradient: { opacityFrom: 0.18, opacityTo: 0, stops: [0, 95] } },
      markers: { size: labels.length <= 2 ? 4 : 0, hover: { size: 4 } },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: dark ? "#1f2937" : "#eef0f3", padding: { left: 4, right: 8 } },
      xaxis: {
        categories: labels,
        tickAmount: byHour ? 8 : Math.min(labels.length, 10),
        labels: { style: { colors: muted, fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: { min: 0, forceNiceScale: true, labels: { style: { colors: muted, fontSize: "11px" }, formatter: (v: number) => formatInt(Math.round(v)) } },
      tooltip: { shared: true, intersect: false, y: { formatter: (v: number | null) => (v === null || v === undefined ? "Sin datos" : formatInt(v)) } },
    };
  }, [dark, labels, byHour]);

  const series = [
    { name: byHour ? "Este día" : "Este período", data: traffic.series.current[metric] },
    ...(traffic.series.previous ? [{ name: byHour ? "Día anterior" : "Período anterior", data: traffic.series.previous[metric] }] : []),
  ];
  return (
    <div className="-mx-2">
      <ReactApexChart key={`${metric}-${dark}`} options={options} series={series} type="area" height={220} />
    </div>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">{children}</h3>;
}

export default function TrafficPanel({ query, isPartial, byHour }: { query: StatsQuery; isPartial: boolean; byHour: boolean }) {
  const [traffic, setTraffic] = useState<VercelTraffic | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [metric, setMetric] = useState<TrafficMetric>("visitors");
  const requestId = useRef(0);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setFailed(false);
    const params = new URLSearchParams({ preset: query.preset });
    if (query.preset === "custom") {
      params.set("from", query.from);
      params.set("to", query.to);
    }
    fetch(`/api/analytics/vercel-traffic?${params}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return (await res.json()) as VercelTraffic;
      })
      .then((data) => id === requestId.current && setTraffic(data))
      .catch(() => id === requestId.current && setFailed(true))
      .finally(() => id === requestId.current && setLoading(false));
  }, [query.preset, query.from, query.to]);

  if (traffic?.status === "not_configured") return null;

  const header = (
    <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <h2 id="traffic-title" className="text-base font-semibold text-gray-900 dark:text-white">
        Tráfico de la web
      </h2>
      <p className="text-xs text-gray-500">
        Fuente: Vercel Web Analytics{query.family && " · no se filtra por familia"}
        {loading && traffic && " · actualizando…"}
      </p>
    </div>
  );

  let body: React.ReactNode;
  if (!traffic && loading) {
    body = <div aria-hidden className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/60" />;
  } else if (failed || !traffic || traffic.status === "error") {
    body = <p className="py-2 text-sm text-gray-500">No se pudieron traer los datos de Vercel. Probá de nuevo en unos minutos.</p>;
  } else if (traffic.status === "out_of_range") {
    body = (
      <p className="py-2 text-sm text-gray-500">
        Vercel solo guarda los últimos {traffic.retentionDays} días (desde el {formatDate(traffic.availableFrom)}). Elegí un período más reciente.
      </p>
    );
  } else {
    const t = traffic;
    body = (
      <div className={`space-y-8 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <div className="space-y-4">
          <div
            role="tablist"
            aria-label="Indicador del gráfico de tráfico"
            className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2 dark:border-gray-800 dark:bg-gray-800"
          >
            {(Object.keys(INFO) as TrafficMetric[]).map((key) => {
              const active = key === metric;
              const previous = key === "visitors" ? t.totals.previousVisitors : t.totals.previousPageviews;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setMetric(key)}
                  className={`relative flex flex-col gap-1 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/50 sm:px-5 ${
                    active ? "bg-gray-50 dark:bg-gray-800/70" : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/40"
                  }`}
                >
                  <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: active ? GSG_ACCENT : "transparent" }} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{INFO[key].label}</span>
                  <span className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{formatInt(t.totals[key])}</span>
                  <span className="text-xs leading-relaxed">
                    <Foot value={t.totals[key]} previous={previous} isPartial={isPartial} />
                  </span>
                  <span className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">{INFO[key].help}</span>
                </button>
              );
            })}
          </div>
          <Chart traffic={t} metric={metric} byHour={byHour} />
          {(t.clipped || !t.totals.comparable) && (
            <p className="text-xs text-gray-500">
              {t.clipped
                ? `Vercel solo guarda los últimos ${t.retentionDays} días: se muestran los días desde el ${formatDate(t.availableFrom)}.`
                : `Sin comparación: el período anterior es más viejo que los ${t.retentionDays} días que guarda Vercel.`}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-x-10 gap-y-8 md:grid-cols-2 xl:grid-cols-4">
          <section>
            <Subhead>Páginas más vistas</Subhead>
            <RowList rows={t.pages} total={t.totals.pageviews} empty="Sin páginas vistas." />
          </section>
          <section>
            <Subhead>Origen (visitantes)</Subhead>
            <RowList rows={t.sources} empty="Sin visitas." />
          </section>
          <section>
            <Subhead>Dispositivo</Subhead>
            <RowList rows={t.devices} total={t.totals.visitors} empty="Sin visitas." />
          </section>
          <section>
            <Subhead>País</Subhead>
            <RowList rows={t.countries} total={t.totals.visitors} empty="Sin visitas." />
          </section>
        </div>
        <p className="text-xs text-gray-400">
          Vercel cuenta visitas con su propio método (sin cookies) y puede no coincidir con las vistas de fichas de arriba. Una persona puede
          llegar desde más de un origen en el período.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="traffic-title" className="border-t border-gray-200 pt-8 dark:border-gray-800">
      {header}
      {body}
    </section>
  );
}
