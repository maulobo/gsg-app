"use client";

import type { ApexOptions } from "apexcharts";
import {
  Activity,
  Boxes,
  Clock3,
  Eye,
  Minus,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  dateInputRangeToIso,
  type ProductViewStats,
} from "@/lib/analytics/product-view-stats";

const ReactApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type Preset = "today" | "yesterday" | "week" | "month" | "all" | "custom";

interface DateFilter {
  startDate: string;
  endDate: string;
  preset: Preset;
}

const EMPTY_STATS: ProductViewStats = {
  totalViews: 0,
  uniqueProducts: 0,
  averagePerProduct: 0,
  topProducts: [],
  viewsByDay: [],
  viewsByHour: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 })),
  topReferrers: [],
  topPaths: [],
  timezones: [],
  comparison: null,
};

const PRESET_LABELS: Record<Exclude<Preset, "custom">, string> = {
  today: "Hoy",
  yesterday: "Ayer",
  week: "7 días",
  month: "30 días",
  all: "Todo",
};

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function presetRange(preset: Exclude<Preset, "custom">): DateFilter {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  let end = new Date(today);

  if (preset === "yesterday") {
    start.setDate(start.getDate() - 1);
    end = new Date(start);
  } else if (preset === "week") {
    start.setDate(start.getDate() - 7);
  } else if (preset === "month") {
    start.setDate(start.getDate() - 30);
  } else if (preset === "all") {
    return { startDate: "", endDate: "", preset };
  }

  return { startDate: toDateInput(start), endDate: toDateInput(end), preset };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-AR").format(value);
}

function formatDay(day: string) {
  return new Date(`${day}T12:00:00`).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-AR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Variación porcentual respecto al período anterior. null si no hay base comparable. */
function computeDelta(current: number, previous: number | undefined): number | null {
  if (previous === undefined) return null;
  if (previous === 0) return current === 0 ? 0 : null; // sin base: mostramos "nuevo"
  return ((current - previous) / previous) * 100;
}

/** Observa la clase `dark` del <html> para tematizar los charts en vivo. */
function useIsDarkTheme() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const update = () => setIsDark(root.classList.contains("dark"));
    update();
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

export default function ProductViewsDashboard() {
  const [appliedFilter, setAppliedFilter] = useState<DateFilter>(() => presetRange("month"));
  const [draftFilter, setDraftFilter] = useState<DateFilter>(() => presetRange("month"));
  const [stats, setStats] = useState<ProductViewStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isDark = useIsDarkTheme();

  const fetchStats = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams();
      if (appliedFilter.preset !== "all") {
        const range = dateInputRangeToIso(appliedFilter.startDate, appliedFilter.endDate);
        query.set("start", range.start);
        query.set("end", range.end);
      }

      const response = await fetch(`/api/analytics/product-views?${query}`, {
        cache: "no-store",
        signal,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No se pudieron cargar las estadísticas");
      setStats(payload as ProductViewStats);
    } catch (fetchError) {
      if (fetchError instanceof DOMException && fetchError.name === "AbortError") return;
      setError(fetchError instanceof Error ? fetchError.message : "No se pudieron cargar las estadísticas");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [appliedFilter]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchStats(controller.signal);
    return () => controller.abort();
  }, [fetchStats]);

  const selectPreset = (preset: Exclude<Preset, "custom">) => {
    const next = presetRange(preset);
    setDraftFilter(next);
    setAppliedFilter(next);
  };

  const applyCustomRange = () => {
    setAppliedFilter({ ...draftFilter, preset: "custom" });
  };

  const chartBase = useMemo<Partial<ApexOptions>>(
    () => ({
      chart: {
        fontFamily: "Outfit, sans-serif",
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, speed: 450 },
      },
      dataLabels: { enabled: false },
      grid: { borderColor: isDark ? "#374151" : "#e5e7eb", strokeDashArray: 4 },
      tooltip: { theme: isDark ? "dark" : "light" },
      theme: { mode: isDark ? "dark" : "light" },
    }),
    [isDark],
  );

  const dailyOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "area" },
      colors: ["#465fff"],
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.38, opacityTo: 0.03, stops: [0, 95, 100] },
      },
      stroke: { curve: "smooth", width: 3 },
      markers: { size: 0, hover: { size: 5 } },
      xaxis: {
        categories: stats.viewsByDay.map((item) => formatDay(item.day)),
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: "#6b7280", fontSize: "11px" } },
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: { formatter: (value) => Math.round(value).toString() },
      },
    }),
    [chartBase, stats.viewsByDay],
  );

  const productOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "bar" },
      colors: ["#12b76a"],
      plotOptions: {
        bar: { horizontal: true, borderRadius: 5, barHeight: "58%", distributed: false },
      },
      xaxis: {
        categories: stats.topProducts.slice(0, 8).map((item) => item.productName),
        labels: { formatter: (value) => Math.round(Number(value)).toString() },
      },
      yaxis: { labels: { maxWidth: 150 } },
    }),
    [chartBase, stats.topProducts],
  );

  const hourlyOptions = useMemo<ApexOptions>(
    () => ({
      ...chartBase,
      chart: { ...chartBase.chart, type: "bar" },
      colors: ["#f79009"],
      plotOptions: { bar: { borderRadius: 4, columnWidth: "62%" } },
      xaxis: {
        categories: stats.viewsByHour.map((item) => `${String(item.hour).padStart(2, "0")}h`),
        tickAmount: 11,
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { min: 0, labels: { formatter: (value) => Math.round(value).toString() } },
    }),
    [chartBase, stats.viewsByHour],
  );

  const metricCards = [
    { label: "Visualizaciones", value: stats.totalViews, delta: computeDelta(stats.totalViews, stats.comparison?.totalViews), previous: stats.comparison?.totalViews, icon: Eye, accent: "text-brand-600 bg-brand-50 dark:bg-brand-500/10" },
    { label: "Productos vistos", value: stats.uniqueProducts, delta: computeDelta(stats.uniqueProducts, stats.comparison?.uniqueProducts), previous: stats.comparison?.uniqueProducts, icon: Boxes, accent: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Promedio por producto", value: stats.averagePerProduct, delta: null, previous: undefined, icon: Activity, accent: "text-amber-600 bg-amber-50 dark:bg-amber-500/10" },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-5 dark:border-gray-800 md:px-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-brand-600 dark:text-brand-400">
                <TrendingUp className="h-4 w-4" />
                Pulso del catálogo
              </div>
              <h2 className="mt-1 text-xl font-semibold text-gray-950 dark:text-white">
                Demanda de productos
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Datos agregados en el servidor, sin límite de 1000 registros.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PRESET_LABELS) as Array<Exclude<Preset, "custom">>).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
                    appliedFilter.preset === preset
                      ? "bg-gray-950 text-white dark:bg-white dark:text-gray-950"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  {PRESET_LABELS[preset]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 bg-gray-50/70 px-5 py-4 dark:bg-gray-950/30 sm:flex-row sm:items-end md:px-6">
          <label className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            Desde
            <input
              type="date"
              value={draftFilter.startDate}
              onChange={(event) => setDraftFilter({ ...draftFilter, startDate: event.target.value, preset: "custom" })}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <label className="flex-1 text-xs font-medium text-gray-600 dark:text-gray-300">
            Hasta
            <input
              type="date"
              value={draftFilter.endDate}
              onChange={(event) => setDraftFilter({ ...draftFilter, endDate: event.target.value, preset: "custom" })}
              className="mt-1.5 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            />
          </label>
          <button
            type="button"
            onClick={applyCustomRange}
            disabled={!draftFilter.startDate || !draftFilter.endDate || loading}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Aplicar rango
          </button>
        </div>
      </section>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900/60 dark:bg-red-950/30">
          <p className="font-medium text-red-800 dark:text-red-200">No se pudieron cargar las estadísticas</p>
          <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          <button type="button" onClick={() => void fetchStats()} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white">
            <RefreshCw className="h-4 w-4" /> Reintentar
          </button>
        </section>
      ) : loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800" />
          ))}
        </div>
      ) : stats.totalViews === 0 ? (
        <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
          <Eye className="mx-auto h-9 w-9 text-gray-400" />
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-white">Sin visualizaciones en este período</h3>
          <p className="mt-1 text-sm text-gray-500">Probá ampliando el rango de fechas.</p>
        </section>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {metricCards.map(({ label, value, delta, previous, icon: Icon, accent }) => (
              <article key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="flex items-start justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}><Icon className="h-5 w-5" /></div>
                  <DeltaBadge delta={delta} />
                </div>
                <p className="mt-5 text-3xl font-semibold tracking-tight text-gray-950 dark:text-white">{formatNumber(value)}</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</p>
                {delta !== null && previous !== undefined ? (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    vs. período anterior: <span className="font-medium text-gray-500 dark:text-gray-400">{formatNumber(previous)}</span>
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-5">
            <ChartCard title="Tendencia diaria" subtitle="Cómo evoluciona el interés en el período" className="xl:col-span-3">
              <ReactApexChart options={dailyOptions} series={[{ name: "Visualizaciones", data: stats.viewsByDay.map((item) => item.count) }]} type="area" height={310} />
            </ChartCard>
            <ChartCard title="Productos con más demanda" subtitle="Los 8 productos más vistos" className="xl:col-span-2">
              <ReactApexChart options={productOptions} series={[{ name: "Visualizaciones", data: stats.topProducts.slice(0, 8).map((item) => item.count) }]} type="bar" height={310} />
            </ChartCard>
          </div>

          <ChartCard title="Actividad por hora" subtitle="Hora local de Argentina">
            <ReactApexChart options={hourlyOptions} series={[{ name: "Visualizaciones", data: stats.viewsByHour.map((item) => item.count) }]} type="bar" height={250} />
          </ChartCard>

          <div className="grid gap-6 xl:grid-cols-3">
            <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
              <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
                <h3 className="font-semibold text-gray-950 dark:text-white">Ranking completo</h3>
                <p className="mt-1 text-sm text-gray-500">Hasta 20 productos, calculados sobre el total real.</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-950/40">
                    <tr><th className="px-5 py-3 text-left">#</th><th className="px-3 py-3 text-left">Producto</th><th className="px-3 py-3 text-left">Código</th><th className="px-3 py-3 text-right">Vistas</th><th className="px-5 py-3 text-left">Última vista</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.topProducts.map((product, index) => (
                      <tr key={product.productCode} className="text-gray-700 hover:bg-gray-50/70 dark:text-gray-300 dark:hover:bg-gray-800/50">
                        <td className="px-5 py-3 font-semibold text-gray-400">{String(index + 1).padStart(2, "0")}</td>
                        <td className="px-3 py-3 font-medium text-gray-950 dark:text-white">{product.productName}</td>
                        <td className="px-3 py-3 font-mono text-xs">{product.productCode}</td>
                        <td className="px-3 py-3 text-right font-semibold text-brand-600 dark:text-brand-400">{formatNumber(product.count)}</td>
                        <td className="px-5 py-3 text-xs">{formatDate(product.lastViewed)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>

            <div className="space-y-6">
              <BreakdownCard title="Fuentes de tráfico" items={stats.topReferrers} total={stats.totalViews} />
              <BreakdownCard title="Rutas más visitadas" items={stats.topPaths} total={stats.totalViews} mono />
            </div>
          </div>

          <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-brand-600" /><h3 className="font-semibold text-gray-950 dark:text-white">Zonas horarias detectadas</h3></div>
            <div className="mt-4 flex flex-wrap gap-2">
              {stats.timezones.map((item) => (
                <span key={item.label} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                  {item.label.replace("America/", "").replaceAll("_", " ")} · <strong>{formatNumber(item.count)}</strong>
                </span>
              ))}
            </div>
          </article>
        </>
      )}
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return null;
  const rounded = Math.round(delta);
  const isUp = rounded > 0;
  const isFlat = rounded === 0;
  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;
  const tone = isFlat
    ? "text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400"
    : isUp
      ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"
      : "text-red-700 bg-red-50 dark:bg-red-500/10 dark:text-red-400";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${tone}`}
      title="Comparado con el período anterior de igual duración"
    >
      <Icon className="h-3 w-3" />
      {isUp ? "+" : ""}
      {rounded}%
    </span>
  );
}

function ChartCard({ title, subtitle, className = "", children }: { title: string; subtitle: string; className?: string; children: React.ReactNode }) {
  return (
    <article className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      <h3 className="font-semibold text-gray-950 dark:text-white">{title}</h3>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
      <div className="mt-4 min-h-[240px]">{children}</div>
    </article>
  );
}

function BreakdownCard({ title, items, total, mono = false }: { title: string; items: ProductViewStats["topReferrers"]; total: number; mono?: boolean }) {
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="font-semibold text-gray-950 dark:text-white">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.slice(0, 6).map((item) => {
          const percentage = total ? (item.count / total) * 100 : 0;
          return (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className={`truncate text-gray-600 dark:text-gray-300 ${mono ? "font-mono text-xs" : ""}`} title={item.label}>{item.label === "Directo" ? "Acceso directo" : item.label}</span>
                <span className="font-semibold text-gray-950 dark:text-white">{formatNumber(item.count)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800"><div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.max(2, percentage)}%` }} /></div>
            </div>
          );
        })}
      </div>
    </article>
  );
}
