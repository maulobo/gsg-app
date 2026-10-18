import assert from "node:assert/strict";
import test from "node:test";

import {
  PeriodError,
  periodBuckets,
  previousComparableRange,
  resolvePeriod,
  localDay,
  bucketIndex,
} from "./period.ts";

// 20/10/2026 15:30 en Córdoba (UTC-3)
const NOW = new Date("2026-10-20T18:30:00.000Z");

test("Hoy: desde las 00:00 de Córdoba, incompleto, por hora", () => {
  const p = resolvePeriod("today", NOW);
  assert.equal(p.from, "2026-10-20");
  assert.equal(p.start, "2026-10-20T03:00:00.000Z");
  assert.equal(p.end, "2026-10-21T03:00:00.000Z");
  assert.equal(p.effectiveEnd, NOW.toISOString());
  assert.equal(p.isPartial, true);
  assert.equal(p.granularity, "hour");
});

test("Ayer: día completo", () => {
  const p = resolvePeriod("yesterday", NOW);
  assert.equal(p.from, "2026-10-19");
  assert.equal(p.to, "2026-10-19");
  assert.equal(p.isPartial, false);
  assert.equal(p.effectiveEnd, "2026-10-20T03:00:00.000Z");
});

test("Últimos 7 días incluye exactamente 7 días", () => {
  const p = resolvePeriod("7d", NOW);
  assert.equal(p.days, 7);
  assert.equal(p.from, "2026-10-14");
  assert.equal(p.to, "2026-10-20");
  assert.equal(periodBuckets(p).length, 7);
});

test("Últimos 30 días incluye exactamente 30 días", () => {
  const p = resolvePeriod("30d", NOW);
  assert.equal(p.days, 30);
  assert.equal(p.from, "2026-09-21");
  assert.equal(periodBuckets(p).length, 30);
});

test("El día se calcula en Córdoba aunque en UTC ya sea mañana", () => {
  // 21/10 01:00 UTC = 20/10 22:00 en Córdoba
  const lateNight = new Date("2026-10-21T01:00:00.000Z");
  assert.equal(localDay(lateNight), "2026-10-20");
  assert.equal(resolvePeriod("today", lateNight).from, "2026-10-20");
});

test("Comparación con el mismo tramo transcurrido del período anterior", () => {
  const today = resolvePeriod("today", NOW);
  assert.deepEqual(previousComparableRange(today), {
    start: "2026-10-19T03:00:00.000Z",
    end: "2026-10-19T18:30:00.000Z",
  });
  const week = resolvePeriod("7d", NOW);
  assert.deepEqual(previousComparableRange(week), {
    start: "2026-10-07T03:00:00.000Z",
    end: "2026-10-13T18:30:00.000Z",
  });
  const yesterday = resolvePeriod("yesterday", NOW);
  assert.deepEqual(previousComparableRange(yesterday), {
    start: "2026-10-18T03:00:00.000Z",
    end: "2026-10-19T03:00:00.000Z",
  });
});

test("Rango personalizado: inclusivo, validado y recortado a hoy", () => {
  const p = resolvePeriod("custom", NOW, { from: "2026-10-01", to: "2026-10-31" });
  assert.equal(p.to, "2026-10-20");
  assert.equal(p.days, 20);
  assert.throws(() => resolvePeriod("custom", NOW, { from: "2026-10-10", to: "2026-10-01" }), PeriodError);
  assert.throws(() => resolvePeriod("custom", NOW, { from: "2026-02-30", to: "2026-03-01" }), PeriodError);
  assert.throws(() => resolvePeriod("custom", NOW, { from: "2024-01-01", to: "2026-10-01" }), PeriodError);
  assert.throws(() => resolvePeriod("custom", NOW, { from: "2026-11-01", to: "2026-11-02" }), PeriodError);
});

test("Buckets por día y por hora cubren todo el período", () => {
  const week = periodBuckets(resolvePeriod("7d", NOW));
  assert.equal(week[0].key, "2026-10-14");
  assert.equal(week[6].key, "2026-10-20");
  const hours = periodBuckets(resolvePeriod("today", NOW));
  assert.equal(hours.length, 24);
  assert.equal(hours[0].start, "2026-10-20T03:00:00.000Z");
  assert.equal(bucketIndex(new Date("2026-10-20T03:30:00.000Z"), "2026-10-20", "hour"), 0);
  assert.equal(bucketIndex(new Date("2026-10-16T02:59:00.000Z"), "2026-10-14", "day"), 1);
});
