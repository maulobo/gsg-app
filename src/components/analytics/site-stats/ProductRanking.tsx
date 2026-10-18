"use client";

import { ArrowDown, ArrowUp, ExternalLink, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";

import type { ProductRow } from "@/lib/analytics/site-stats/aggregate";
import { FAMILY_LABELS } from "@/lib/analytics/site-stats/labels";

import { formatInt } from "./format";

const PUBLIC_WEB = (process.env.NEXT_PUBLIC_WEB_URL || "https://www.gsgdesign.com.ar").replace(/\/+$/, "");
const PAGE = 15;

type SortKey = "views" | "documentClicks" | "whatsappClicks" | "name";

const COLUMNS: Array<{ key: SortKey; label: string; help: string }> = [
  { key: "views", label: "Vistas", help: "Aperturas de la ficha" },
  { key: "documentClicks", label: "Documentación", help: "Clics en fichas técnicas de este producto" },
  { key: "whatsappClicks", label: "WhatsApp", help: "Clics hacia WhatsApp desde esta ficha" },
];

function SortHeader({
  col,
  sort,
  onSort,
  className = "",
}: {
  className?: string;
  col: { key: SortKey; label: string; help: string };
  sort: { key: SortKey; dir: "asc" | "desc" };
  onSort: (k: SortKey) => void;
}) {
  const active = sort.key === col.key;
  return (
    <th scope="col" className={`px-3 py-2.5 text-right font-medium ${className}`} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(col.key)}
        title={col.help}
        className={`inline-flex items-center gap-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50 ${
          active ? "text-gray-900 dark:text-white" : "hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        {col.label}
        {active && (sort.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
      </button>
    </th>
  );
}

export default function ProductRanking({
  products,
  attributedActionsMeasured,
}: {
  products: ProductRow[];
  attributedActionsMeasured: boolean;
}) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "views", dir: "desc" });
  const [showAll, setShowAll] = useState(false);

  const sorted = useMemo(() => {
    const list = [...products];
    list.sort((a, b) => {
      const r = sort.key === "name" ? a.name.localeCompare(b.name) : (a[sort.key] as number) - (b[sort.key] as number);
      return (sort.dir === "asc" ? r : -r) || b.views - a.views;
    });
    return list;
  }, [products, sort]);

  const onSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "desc" ? "asc" : "desc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  const visible = showAll ? sorted : sorted.slice(0, PAGE);

  return (
    <section aria-labelledby="ranking-title">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="ranking-title" className="text-base font-semibold text-gray-900 dark:text-white">
          Productos
        </h2>
        <p className="text-xs text-gray-500">
          Solo acciones hechas dentro de la ficha de cada producto
          {!attributedActionsMeasured && ". Documentación y WhatsApp por producto se miden desde la nueva versión de la web"}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-800">
          No se abrieron fichas en este período.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-400">
              <tr>
                <th scope="col" className="w-8 py-2.5 pl-3 text-left font-medium">
                  #
                </th>
                <th scope="col" className="px-3 py-2.5 text-left font-medium" aria-sort={sort.key === "name" ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => onSort("name")} className="inline-flex items-center gap-1 hover:text-gray-900 dark:hover:text-white">
                    Producto
                    {sort.key === "name" && (sort.dir === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />)}
                  </button>
                </th>
                <th scope="col" className="hidden px-3 py-2.5 text-left font-medium md:table-cell">
                  Familia
                </th>
                {COLUMNS.map((c, i) => (
                  <SortHeader key={c.key} col={c} sort={sort} onSort={onSort} className={i > 0 ? "hidden sm:table-cell" : ""} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {visible.map((p, i) => (
                <tr key={p.key} className="hover:bg-gray-50/70 dark:hover:bg-white/[0.02]">
                  <td className="py-2.5 pl-3 align-middle text-xs tabular-nums text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                        {p.image ? (
                          <img src={p.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          <ImageOff className="h-4 w-4 text-gray-400" aria-hidden />
                        )}
                      </div>
                      <div className="min-w-0">
                        {p.path ? (
                          <a
                            href={`${PUBLIC_WEB}${p.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex max-w-full items-center gap-1 font-medium text-gray-900 hover:underline dark:text-white"
                            title="Abrir la ficha en la web"
                          >
                            <span className="truncate">{p.name}</span>
                            <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100" aria-hidden />
                          </a>
                        ) : (
                          <span className="block truncate font-medium text-gray-900 dark:text-white">{p.name}</span>
                        )}
                        <span className="block truncate text-xs text-gray-500">
                          {p.family === "rollos" ? "Familia de rollos" : p.code}
                          <span className="md:hidden"> · {FAMILY_LABELS[p.family]}</span>
                          {p.category && p.family === "luminarias" && <span> · {p.category}</span>}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-3 py-2 text-gray-600 md:table-cell dark:text-gray-400">{FAMILY_LABELS[p.family]}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums text-gray-900 dark:text-white">{formatInt(p.views)}</td>
                  <td className="hidden px-3 py-2 text-right tabular-nums text-gray-600 sm:table-cell dark:text-gray-400">
                    {attributedActionsMeasured ? formatInt(p.documentClicks) : "—"}
                  </td>
                  <td className="hidden px-3 py-2 pr-4 text-right tabular-nums text-gray-600 sm:table-cell dark:text-gray-400">
                    {attributedActionsMeasured ? formatInt(p.whatsappClicks) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length > PAGE && (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full border-t border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.02] dark:hover:text-white"
            >
              {showAll ? "Mostrar menos" : `Ver los ${sorted.length} productos`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
