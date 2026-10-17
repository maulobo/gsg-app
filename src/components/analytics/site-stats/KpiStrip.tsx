"use client";

import type { MetricKey, MetricResult } from "@/lib/analytics/site-stats/aggregate";

import { delta, formatDate, formatInt, GSG_ACCENT } from "./format";

export const METRIC_INFO: Record<MetricKey, { label: string; help: string }> = {
  views: {
    label: "Vistas de fichas",
    help: "Aperturas de fichas de producto. No son visitantes únicos.",
  },
  whatsapp: {
    label: "Clics hacia WhatsApp",
    help: "Clics que abren WhatsApp. No confirman que se haya enviado un mensaje.",
  },
  documents: {
    label: "Clics en documentación",
    help: "Clics en fichas técnicas y archivos. No confirman la descarga completa.",
  },
  catalog: {
    label: "Clics en el catálogo",
    help: "Clics en Descargar catálogo, en el inicio de la web.",
  },
};

function MetricFoot({ m, isPartialPeriod }: { m: MetricResult; isPartialPeriod: boolean }) {
  if (m.status === "not_applicable") return <span>No se atribuye a familias</span>;
  if (m.status === "not_measured") {
    return <span>{m.coverageStart ? `Se mide desde el ${formatDate(m.coverageStart)}` : "Todavía sin datos medidos"}</span>;
  }
  if (!m.comparable || m.previous === null) {
    return <span>{m.coverageStart ? `Se mide desde el ${formatDate(m.coverageStart)}` : "Sin comparación"}</span>;
  }
  const d = delta(m.value ?? 0, m.previous);
  const color =
    d.kind === "up" ? "text-success-600 dark:text-success-400" : d.kind === "down" ? "text-error-600 dark:text-error-400" : "text-gray-500";
  return (
    <span>
      <span className={`font-medium ${color}`}>{d.text}</span>{" "}
      <span className="text-gray-500">
        vs. {formatInt(m.previous)} {isPartialPeriod ? "en el mismo tramo anterior" : "en el período anterior"}
      </span>
    </span>
  );
}

export default function KpiStrip({
  metrics,
  selected,
  onSelect,
  isPartialPeriod,
}: {
  metrics: Record<MetricKey, MetricResult>;
  selected: MetricKey;
  onSelect: (m: MetricKey) => void;
  isPartialPeriod: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="Indicador del gráfico"
      className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-gray-800 dark:bg-gray-800"
    >
      {(Object.keys(METRIC_INFO) as MetricKey[]).map((key) => {
        const m = metrics[key];
        const active = key === selected;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(key)}
            className={`relative flex flex-col gap-1 px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/50 sm:px-5 ${
              active ? "bg-gray-50 dark:bg-gray-800/70" : "bg-white hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800/40"
            }`}
          >
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: active ? GSG_ACCENT : "transparent" }}
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{METRIC_INFO[key].label}</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">
              {m.value === null ? "—" : formatInt(m.value)}
            </span>
            <span className="text-xs leading-relaxed">
              <MetricFoot m={m} isPartialPeriod={isPartialPeriod} />
            </span>
            <span className="text-xs leading-relaxed text-gray-400 dark:text-gray-500">{METRIC_INFO[key].help}</span>
          </button>
        );
      })}
    </div>
  );
}
