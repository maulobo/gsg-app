"use client";

import type { CountRow, SiteStats } from "@/lib/analytics/site-stats/aggregate";

import { formatDate, formatInt, GSG_ACCENT, share } from "./format";

/** Fila con barra proporcional. La barra usa el acento solo en la primera fila. */
function BarRow({ label, detail, count, max, total, strong }: { label: string; detail?: string; count: number; max: number; total?: number; strong?: boolean }) {
  return (
    <li className="py-1.5">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="min-w-0 truncate text-gray-800 dark:text-gray-200" title={label}>
          {label}
          {detail && <span className="text-gray-500"> · {detail}</span>}
        </span>
        <span className="shrink-0 tabular-nums text-gray-900 dark:text-white">
          {formatInt(count)}
          {total !== undefined && <span className="ml-2 text-xs text-gray-500">{share(count, total)}</span>}
        </span>
      </div>
      <div className="mt-1 h-1 rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-1 rounded-full"
          style={{ width: `${max ? Math.max(2, (count / max) * 100) : 0}%`, background: strong ? GSG_ACCENT : "#9ca3af" }}
        />
      </div>
    </li>
  );
}

function RowList({ rows, total, empty }: { rows: CountRow[]; total?: number; empty: string }) {
  if (!rows.length) return <p className="py-2 text-sm text-gray-500">{empty}</p>;
  const max = rows[0].count;
  return (
    <ul>
      {rows.map((r, i) => (
        <BarRow key={r.id} label={r.label} detail={r.detail} count={r.count} max={max} total={total} strong={i === 0} />
      ))}
    </ul>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold tabular-nums text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  );
}

function Subhead({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-1 mt-5 text-sm font-medium text-gray-700 first:mt-0 dark:text-gray-300">{children}</h3>;
}

function NotMeasured({ since }: { since: string | null }) {
  return (
    <p className="py-2 text-sm text-gray-500">
      {since ? `Se mide desde el ${formatDate(since)}.` : "Todavía sin datos: empieza a medirse con la nueva versión de la web."}
    </p>
  );
}

export function FamilyBreakdown({ stats }: { stats: SiteStats }) {
  const total = stats.families.reduce((n, f) => n + f.views, 0);
  const max = Math.max(...stats.families.map((f) => f.views), 0);
  const ranked = [...stats.families].sort((a, b) => b.views - a.views);
  const luminarias = stats.families.find((f) => f.family === "luminarias");

  return (
    <section aria-labelledby="families-title">
      <h2 id="families-title" className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
        Vistas por familia
      </h2>
      <ul>
        {ranked.map((f, i) =>
          f.coverageStart && f.coverageStart < stats.period.effectiveEnd ? (
            <BarRow key={f.family} label={f.label} count={f.views} max={max} total={total} strong={i === 0 && f.views > 0} />
          ) : (
            <li key={f.family} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
              <span className="text-gray-800 dark:text-gray-200">{f.label}</span>
              <span className="text-xs text-gray-500">
                {f.coverageStart ? `Se mide desde el ${formatDate(f.coverageStart)}` : "Sin datos medidos todavía"}
              </span>
            </li>
          ),
        )}
      </ul>
      {luminarias && luminarias.categories.length > 0 && (
        <>
          <Subhead>Luminarias por categoría</Subhead>
          <RowList rows={luminarias.categories} total={luminarias.views} empty="" />
        </>
      )}
    </section>
  );
}

export function ActivityPanels({ stats }: { stats: SiteStats }) {
  const { documents, contacts, sources, coverage, family } = stats;
  const docsSince = coverage.byEvent.document_click;
  const waSince = coverage.byEvent.whatsapp_click;
  const waOpenSince = coverage.byEvent.whatsapp_widget_open;
  const distSince = coverage.byEvent.distributor_contact_click;
  const dlSince = coverage.byEvent.view_download_page;
  const measured = (since: string | null) => !!since && since < stats.period.effectiveEnd;

  return (
    <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-3">
      <section aria-labelledby="docs-title">
        <h2 id="docs-title" className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Documentación
        </h2>
        {!measured(docsSince) ? (
          <NotMeasured since={docsSince} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <Stat label="Desde fichas" value={formatInt(documents.fromProducts)} />
              <Stat label="Desde páginas de descargas" value={formatInt(documents.general)} />
            </div>
            <Subhead>Archivos con más clics</Subhead>
            <RowList rows={documents.top} empty="Sin clics en documentación en este período." />
          </>
        )}
        {!family && (
          <>
            <Subhead>Páginas de descargas (QR)</Subhead>
            {!measured(dlSince) ? (
              <NotMeasured since={dlSince} />
            ) : documents.downloadPages.length === 0 ? (
              <p className="py-2 text-sm text-gray-500">Sin visitas en este período.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {documents.downloadPages.map((p) => (
                  <li key={p.slug} className="flex items-baseline justify-between gap-3 py-2 text-sm">
                    <span className="truncate text-gray-800 dark:text-gray-200">/descargas/{p.slug}</span>
                    <span className="shrink-0 text-xs text-gray-500">
                      <span className="tabular-nums text-gray-900 dark:text-white">{formatInt(p.views)}</span> visitas ·{" "}
                      <span className="tabular-nums text-gray-900 dark:text-white">{formatInt(p.fileClicks)}</span> clics en archivos
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-1 text-xs text-gray-400">Una visita puede venir de un QR o de un enlace compartido.</p>
          </>
        )}
      </section>

      <section aria-labelledby="contacts-title">
        <h2 id="contacts-title" className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
          Contactos
        </h2>
        {!measured(waSince) && !measured(waOpenSince) ? (
          <NotMeasured since={waSince} />
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-4">
              <Stat
                label="Aperturas del panel"
                value={formatInt(contacts.whatsappOpens.total)}
                sub={`${formatInt(contacts.whatsappOpens.fromProducts)} desde fichas`}
              />
              <Stat
                label="Clics hacia WhatsApp"
                value={formatInt(contacts.whatsappClicks.total)}
                sub={`${formatInt(contacts.whatsappClicks.fromProducts)} desde fichas`}
              />
            </div>
            <Subhead>Motivo elegido</Subhead>
            <RowList rows={contacts.whatsappByReason} total={contacts.whatsappClicks.total} empty="Sin clics hacia WhatsApp." />
            <Subhead>Página desde la que se contactó</Subhead>
            <RowList rows={contacts.whatsappByPage} total={contacts.whatsappClicks.total} empty="Sin clics hacia WhatsApp." />
          </>
        )}
        {!family && (
          <>
            <Subhead>Distribuidores</Subhead>
            {!measured(distSince) ? (
              <NotMeasured since={distSince} />
            ) : (
              <>
                <RowList rows={contacts.distributorByAction} total={contacts.distributorTotal} empty="Sin clics en distribuidores." />
                {contacts.distributorTop.length > 0 && (
                  <>
                    <Subhead>Distribuidores con más clics</Subhead>
                    <RowList rows={contacts.distributorTop} empty="" />
                  </>
                )}
              </>
            )}
          </>
        )}
      </section>

      <section aria-labelledby="sources-title">
        <h2 id="sources-title" className="mb-1 text-base font-semibold text-gray-900 dark:text-white">
          Origen de las visitas
        </h2>
        <p className="mb-3 text-xs text-gray-500">
          Sitio desde el que se llegó a la web, para vistas de fichas y páginas de descargas. No identifica campañas.
        </p>
        <RowList rows={sources.kinds} total={sources.total} empty="Sin visitas en este período." />
        {sources.top.length > 0 && (
          <>
            <Subhead>Principales orígenes</Subhead>
            <RowList rows={sources.top} total={sources.total} empty="" />
          </>
        )}
      </section>
    </div>
  );
}
