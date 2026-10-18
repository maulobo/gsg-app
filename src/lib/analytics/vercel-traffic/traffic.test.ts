import assert from "node:assert/strict";
import { test } from "node:test";

import { previousComparableRange, resolvePeriod } from "../site-stats/period.ts";
import { buildVercelTraffic, type TrafficQuery } from "./traffic.ts";

type Call = { by: string; start: string; end: string; limit?: number };

/** Simula Vercel: 1 visitante y 3 páginas vistas por hora, y respuestas fijas por dimensión */
function fakeQuery(calls: Call[], dims: Record<string, Array<Record<string, unknown>>> = {}): TrafficQuery {
  return async (by, range, limit) => {
    calls.push({ by, ...range, limit });
    const hours = (new Date(range.end).getTime() - new Date(range.start).getTime()) / 3600000;
    if (by === "environment") return [{ environment: "production", visitors: Math.round(hours), pageviews: Math.round(hours * 3) }];
    if (by === "hour") {
      return Array.from({ length: Math.ceil(hours) }, (_, h) => ({
        timestamp: new Date(new Date(range.start).getTime() + h * 3600000).toISOString(),
        visitors: 1,
        pageviews: 3,
      }));
    }
    return dims[by] ?? [];
  };
}

const NOW = new Date("2026-10-17T18:00:00Z"); // 15 h en Córdoba

test("7 días: totales con rango exacto, comparación y una consulta por día", async () => {
  const period = resolvePeriod("7d", NOW);
  const calls: Call[] = [];
  const t = await buildVercelTraffic({ period, comparisonRange: previousComparableRange(period), now: NOW, query: fakeQuery(calls), retentionDays: 31 });

  assert.equal(t.status, "ok");
  const total = calls.find((c) => c.by === "environment" && c.start === period.start && c.end === period.effectiveEnd);
  assert.ok(total, "pide el total del período con el horario exacto de Córdoba");
  assert.equal(t.totals.pageviews, t.totals.visitors * 3);
  assert.equal(t.totals.comparable, true);
  assert.ok(t.totals.previousVisitors !== null);
  assert.equal(t.series.labels.length, 7);
  assert.equal(t.series.current.visitors.length, 7);
  assert.equal(t.series.current.visitors[0], 24, "un día completo = 24 h");
  assert.equal(t.series.current.visitors[6], 15, "hoy hasta las 15 h");
  assert.ok(t.series.previous);
  assert.equal(t.series.previous!.visitors.length, 7);
});

test("hoy: serie por hora con horas futuras vacías", async () => {
  const period = resolvePeriod("today", NOW);
  const t = await buildVercelTraffic({ period, comparisonRange: previousComparableRange(period), now: NOW, query: fakeQuery([]), retentionDays: 31 });
  assert.equal(t.series.labels.length, 24);
  assert.equal(t.series.current.pageviews[0], 3);
  assert.equal(t.series.current.pageviews[14], 3);
  assert.equal(t.series.current.pageviews[15], null);
  assert.equal(t.series.previous!.pageviews[14], 3);
});

test("30 días en plan Hobby: sin comparación porque el período anterior ya no está disponible", async () => {
  const period = resolvePeriod("30d", NOW);
  const calls: Call[] = [];
  const t = await buildVercelTraffic({ period, comparisonRange: previousComparableRange(period), now: NOW, query: fakeQuery(calls), retentionDays: 31 });
  assert.equal(t.totals.comparable, false);
  assert.equal(t.totals.previousVisitors, null);
  assert.equal(t.series.previous, null);
  assert.equal(t.clipped, false);
  const limitStart = NOW.getTime() - 31 * 86400000;
  for (const c of calls) assert.ok(new Date(c.start).getTime() >= limitStart, `no pide datos fuera de la retención: ${c.start}`);
});

test("período más viejo que la retención: se recorta y lo informa", async () => {
  const period = resolvePeriod("custom", NOW, { from: "2026-08-01", to: "2026-10-10" });
  const calls: Call[] = [];
  const t = await buildVercelTraffic({ period, comparisonRange: previousComparableRange(period), now: NOW, query: fakeQuery(calls), retentionDays: 31 });
  assert.equal(t.clipped, true);
  assert.equal(t.series.current.visitors[0], null, "días fuera de la retención = sin datos, no cero");
  assert.ok(t.series.current.visitors.at(-1)! > 0);
  const limitStart = NOW.getTime() - 31 * 86400000;
  for (const c of calls) assert.ok(new Date(c.start).getTime() >= limitStart);
});

test("período totalmente fuera de la retención", async () => {
  const period = resolvePeriod("custom", NOW, { from: "2026-07-01", to: "2026-07-31" });
  const calls: Call[] = [];
  const t = await buildVercelTraffic({ period, comparisonRange: previousComparableRange(period), now: NOW, query: fakeQuery(calls), retentionDays: 31 });
  assert.equal(t.status, "out_of_range");
  assert.equal(calls.length, 0);
});

test("rankings con nombres comprensibles y orígenes agrupados", async () => {
  const period = resolvePeriod("7d", NOW);
  const t = await buildVercelTraffic({
    period,
    comparisonRange: previousComparableRange(period),
    now: NOW,
    retentionDays: 31,
    query: fakeQuery([], {
      route: [
        { route: "/productos/[categoria]/[code]", visitors: 50, pageviews: 120 },
        { route: "/", visitors: 80, pageviews: 100 },
        { route: "Others", visitors: 5, pageviews: 9 },
      ],
      referrerHostname: [
        { referrerHostname: "", visitors: 70, pageviews: 300 },
        { referrerHostname: "google.com", visitors: 40, pageviews: 50 },
        { referrerHostname: "facebook.com", visitors: 3, pageviews: 3 },
        { referrerHostname: "m.facebook.com", visitors: 2, pageviews: 2 },
      ],
      deviceType: [
        { deviceType: "desktop", visitors: 60, pageviews: 200 },
        { deviceType: "mobile", visitors: 30, pageviews: 80 },
      ],
      country: [
        { country: "AR", visitors: 90, pageviews: 270 },
        { country: "Others", visitors: 2, pageviews: 2 },
      ],
    }),
  });

  assert.deepEqual(
    t.pages.map((r) => [r.label, r.count]),
    [
      ["Ficha de luminaria", 120],
      ["Inicio", 100],
      ["Otras páginas", 9],
    ],
  );
  assert.deepEqual(
    t.sources.map((r) => [r.label, r.count]),
    [
      ["Sin referencia", 70],
      ["Google", 40],
      ["Facebook", 5],
    ],
  );
  assert.deepEqual(t.devices.map((r) => r.label), ["Computadora", "Celular"]);
  assert.equal(t.countries[0].label, "Argentina");
  assert.equal(t.countries[1].label, "Otros países");
});
