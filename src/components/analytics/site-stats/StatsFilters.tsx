"use client";

import { useEffect, useState } from "react";

import { FAMILIES, FAMILY_LABELS, type Family } from "@/lib/analytics/site-stats/labels";
import type { PresetId } from "@/lib/analytics/site-stats/period";

export interface StatsQuery {
  preset: PresetId;
  from: string;
  to: string;
  family: Family | "";
}

const PRESETS: Array<{ id: PresetId; label: string }> = [
  { id: "today", label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "7d", label: "Últimos 7 días" },
  { id: "30d", label: "Últimos 30 días" },
  { id: "custom", label: "Personalizado" },
];

const controlCls =
  "h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200";

export default function StatsFilters({
  query,
  onChange,
  disabled,
}: {
  query: StatsQuery;
  onChange: (q: StatsQuery) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState({ from: query.from, to: query.to });
  useEffect(() => setDraft({ from: query.from, to: query.to }), [query.from, query.to]);
  const draftValid = draft.from && draft.to && draft.from <= draft.to;

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Período"
          className="flex max-w-full overflow-x-auto rounded-lg border border-gray-300 bg-white p-0.5 dark:border-gray-700 dark:bg-gray-900"
        >
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={query.preset === p.id}
              disabled={disabled}
              onClick={() => onChange({ ...query, preset: p.id })}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 ${
                query.preset === p.id
                  ? "bg-gray-900 font-medium text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <select
          aria-label="Familia"
          value={query.family}
          disabled={disabled}
          onChange={(e) => onChange({ ...query, family: e.target.value as Family | "" })}
          className={controlCls}
        >
          <option value="">Todas las familias</option>
          {FAMILIES.map((f) => (
            <option key={f} value={f}>
              {FAMILY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      {query.preset === "custom" && (
        <form
          className="flex flex-wrap items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (draftValid) onChange({ ...query, from: draft.from, to: draft.to });
          }}
        >
          <label className="sr-only" htmlFor="stats-from">
            Desde
          </label>
          <input
            id="stats-from"
            type="date"
            value={draft.from}
            onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
            className={controlCls}
          />
          <span className="text-sm text-gray-500">a</span>
          <label className="sr-only" htmlFor="stats-to">
            Hasta
          </label>
          <input
            id="stats-to"
            type="date"
            value={draft.to}
            onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
            className={controlCls}
          />
          <button
            type="submit"
            disabled={!draftValid || disabled}
            className="h-9 rounded-lg bg-gray-900 px-3 text-sm font-medium text-white disabled:opacity-40 dark:bg-white dark:text-gray-900"
          >
            Aplicar
          </button>
        </form>
      )}
    </div>
  );
}
