"use client";

import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";
import { useMemo } from "react";

import { useTheme } from "@/context/ThemeContext";
import type { MetricKey, SiteStats } from "@/lib/analytics/site-stats/aggregate";

import { formatInt, formatYmd, GSG_ACCENT } from "./format";
import { METRIC_INFO } from "./KpiStrip";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

export default function TrendChart({ stats, metric }: { stats: SiteStats; metric: MetricKey }) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const m = stats.metrics[metric];
  const current = stats.series.current[metric];
  const previous = stats.series.previous[metric];
  const hasComparison = m.comparable && previous.some((v) => v !== null);
  const byHour = stats.period.granularity === "hour";
  const prevLabel = byHour ? "Día anterior" : "Período anterior";

  const options = useMemo<ApexOptions>(() => {
    const grid = dark ? "#1f2937" : "#eef0f3";
    const muted = dark ? "#9ca3af" : "#6b7280";
    return {
      chart: {
        type: "area",
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false },
        background: "transparent",
      },
      theme: { mode: dark ? "dark" : "light" },
      colors: [GSG_ACCENT, dark ? "#6b7280" : "#9ca3af"],
      stroke: { curve: "straight", width: [2.5, 1.5], dashArray: [0, 5] },
      fill: { type: ["gradient", "solid"], opacity: [1, 0], gradient: { opacityFrom: 0.18, opacityTo: 0, stops: [0, 95] } },
      markers: { size: stats.series.labels.length <= 2 ? 4 : 0, hover: { size: 4 } },
      dataLabels: { enabled: false },
      legend: { show: false },
      grid: { borderColor: grid, strokeDashArray: 0, padding: { left: 4, right: 8 } },
      xaxis: {
        categories: stats.series.labels,
        tickAmount: byHour ? 8 : Math.min(stats.series.labels.length, 10),
        labels: { style: { colors: muted, fontSize: "11px" }, rotate: 0, hideOverlappingLabels: true },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: { style: { colors: muted, fontSize: "11px" }, formatter: (v: number) => formatInt(Math.round(v)) },
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (v: number | null) => (v === null || v === undefined ? "Sin medición" : formatInt(v)) },
      },
    };
  }, [dark, stats.series.labels, byHour]);

  const series = [
    { name: byHour ? "Este día" : "Este período", data: current },
    ...(hasComparison ? [{ name: prevLabel, data: previous }] : []),
  ];

  const allNull = current.every((v) => v === null);

  return (
    <section aria-labelledby="trend-title" className="pt-2">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="trend-title" className="text-base font-semibold text-gray-900 dark:text-white">
          {METRIC_INFO[metric].label} {byHour ? "por hora" : "por día"}
        </h2>
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded" style={{ background: GSG_ACCENT }} />
            {byHour ? "Este día" : `${formatYmd(stats.period.from)} – ${formatYmd(stats.period.to)}`}
          </span>
          {hasComparison ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 border-t-[1.5px] border-dashed border-gray-400" />
              {prevLabel}
            </span>
          ) : (
            <span>Sin comparación disponible</span>
          )}
        </div>
      </div>
      {allNull ? (
        <div className="flex h-[280px] items-center justify-center rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500 dark:border-gray-800">
          Esta métrica todavía no se medía en este período.
        </div>
      ) : (
        <div className="-mx-2">
          <ReactApexChart key={`${metric}-${dark}`} options={options} series={series} type="area" height={280} />
        </div>
      )}
      {stats.period.isPartial && !allNull && (
        <p className="mt-1 text-xs text-gray-500">
          Incluye hoy, que todavía no terminó: la comparación usa el mismo tramo del período anterior.
        </p>
      )}
    </section>
  );
}
