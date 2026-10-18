import assert from "node:assert/strict";
import test from "node:test";

import { aggregateSiteStats, type Coverage } from "./aggregate.ts";
import type { AnalyticsEventRow } from "./labels.ts";
import { previousComparableRange, resolvePeriod } from "./period.ts";

// 20/10/2026 15:30 Córdoba
const NOW = new Date("2026-10-20T18:30:00.000Z");
const week = resolvePeriod("7d", NOW); // 14/10 → 20/10
const comparisonRange = previousComparableRange(week); // 07/10 03:00 → 13/10 18:30

let nextId = 1;
const ev = (event_type: string, created_at: string, over: Partial<AnalyticsEventRow> = {}): AnalyticsEventRow => ({
  id: nextId++,
  event_type,
  product_code: null,
  product_name: null,
  category: null,
  created_at,
  metadata: { v: 2, env: "production", path: "/", referrer: "" },
  ...over,
});
const view = (created_at: string, family: string, code: string, extra: Record<string, unknown> = {}) =>
  ev("view_product", created_at, {
    product_code: code,
    product_name: `Producto ${code}`,
    category: family === "luminarias" ? "Techo" : null,
    metadata: { v: 2, env: "production", family, product_key: `${family}:${code}`, path: `/x/${code}`, referrer: "", ...extra },
  });
const historicView = (created_at: string, code: string) =>
  ev("view_product", created_at, {
    product_code: code,
    product_name: `Hist ${code}`,
    category: "Colgantes",
    metadata: { path: `/productos/colgantes/${code}`, referrer: "https://www.google.com/", viewedAt: created_at },
  });

const coverage = (over: Partial<Coverage["byEvent"]> = {}): Coverage => ({
  byEvent: {
    view_product: "2026-01-29T16:06:00.000Z",
    whatsapp_click: "2026-10-01T00:00:00.000Z",
    document_click: "2026-10-01T00:00:00.000Z",
    catalog_click: "2026-10-01T00:00:00.000Z",
    ...over,
  },
  viewsByFamily: {
    luminarias: "2026-01-29T16:06:00.000Z",
    perfiles: "2026-10-01T00:00:00.000Z",
    rollos: null,
    accesorios: "2026-10-01T00:00:00.000Z",
    fuentes: "2026-10-01T00:00:00.000Z",
  },
});

const run = (current: AnalyticsEventRow[], previous: AnalyticsEventRow[] = [], opts: { family?: any; coverage?: Coverage } = {}) =>
  aggregateSiteStats({
    current,
    previous,
    period: week,
    comparisonRange,
    family: opts.family ?? null,
    coverage: opts.coverage ?? coverage(),
    now: NOW,
  });

test("Cuenta vistas históricas y nuevas, y compara con el período anterior", () => {
  const stats = run(
    [historicView("2026-10-15T12:00:00Z", "LIRA"), view("2026-10-16T12:00:00Z", "perfiles", "P02")],
    [historicView("2026-10-08T12:00:00Z", "LIRA")],
  );
  assert.equal(stats.metrics.views.value, 2);
  assert.equal(stats.metrics.views.previous, 1);
  assert.equal(stats.metrics.views.comparable, true);
  assert.equal(stats.metrics.views.status, "ok");
});

test("Mismo código en dos familias son dos productos", () => {
  const stats = run([view("2026-10-16T12:00:00Z", "perfiles", "P02"), view("2026-10-16T13:00:00Z", "accesorios", "P02")]);
  assert.equal(stats.products.length, 2);
  assert.deepEqual(stats.products.map((p) => p.key).sort(), ["accesorios:P02", "perfiles:P02"]);
});

test("Excluye la actividad de desarrollo y la informa", () => {
  const dev = view("2026-10-16T12:00:00Z", "fuentes", "GSG-36WHH", { env: "development" });
  const stats = run([dev, view("2026-10-16T12:00:00Z", "fuentes", "GSG-36WHH")]);
  assert.equal(stats.metrics.views.value, 1);
  assert.equal(stats.excludedDevEvents, 1);
});

test("Métrica sin medición en el período: null, no cero", () => {
  const stats = run([], [], { coverage: coverage({ catalog_click: null }) });
  assert.equal(stats.metrics.catalog.value, null);
  assert.equal(stats.metrics.catalog.status, "not_measured");
  assert.ok(stats.series.current.catalog.every((v) => v === null));
});

test("Cobertura que empieza dentro del período: parcial, sin comparación y días previos en null", () => {
  const stats = run([ev("whatsapp_click", "2026-10-18T15:00:00Z")], [], {
    coverage: coverage({ whatsapp_click: "2026-10-17T15:00:00.000Z" }),
  });
  const m = stats.metrics.whatsapp;
  assert.equal(m.value, 1);
  assert.equal(m.status, "partial");
  assert.equal(m.comparable, false);
  assert.equal(m.previous, null);
  // 14, 15, 16 sin medir; 17 ya se medía (parcial); 18 tiene 1
  assert.deepEqual(stats.series.current.whatsapp.slice(0, 5), [null, null, null, 0, 1]);
  assert.ok(stats.series.previous.whatsapp.every((v) => v === null));
});

test("El gráfico incluye los días sin eventos y deja en null el futuro", () => {
  const today = resolvePeriod("today", NOW);
  const stats = aggregateSiteStats({
    current: [view("2026-10-20T12:10:00Z", "fuentes", "A")], // 09 h Córdoba
    previous: [view("2026-10-19T12:20:00Z", "fuentes", "A")],
    period: today,
    comparisonRange: previousComparableRange(today),
    family: null,
    coverage: coverage(),
    now: NOW,
  });
  const cur = stats.series.current.views;
  assert.equal(cur.length, 24);
  assert.equal(cur[9], 1);
  assert.equal(cur[8], 0);
  assert.equal(cur[16], null); // 16 h todavía no pasó
  assert.equal(stats.series.previous.views[9], 1);
  assert.equal(stats.series.previous.views[16], null); // fuera del tramo comparable
});

test("Filtro de familia: solo acciones atribuidas; el catálogo no aplica", () => {
  const stats = run(
    [
      view("2026-10-16T12:00:00Z", "fuentes", "A"),
      view("2026-10-16T12:00:00Z", "perfiles", "B"),
      ev("document_click", "2026-10-16T12:05:00Z", {
        product_code: "A",
        metadata: { v: 2, env: "production", family: "fuentes", product_key: "fuentes:A", doc_type: "datasheet" },
      }),
      ev("document_click", "2026-10-16T12:05:00Z", { metadata: { v: 2, env: "production", slug: "fuentes", location: "download_page" } }),
      ev("catalog_click", "2026-10-16T12:05:00Z"),
    ],
    [],
    { family: "fuentes" },
  );
  assert.equal(stats.metrics.views.value, 1);
  assert.equal(stats.metrics.documents.value, 1);
  assert.equal(stats.metrics.catalog.status, "not_applicable");
  assert.equal(stats.families.length, 1);
  assert.equal(stats.products[0].documentClicks, 1);
});

test("Separa acciones generales de las atribuidas a productos", () => {
  const stats = run([
    ev("whatsapp_click", "2026-10-16T12:00:00Z", { metadata: { v: 2, env: "production", reason: "business_inquiry", path: "/" } }),
    ev("whatsapp_click", "2026-10-16T12:00:00Z", {
      product_code: "A",
      product_name: "A",
      metadata: { v: 2, env: "production", reason: "existing_customer", family: "fuentes", product_key: "fuentes:A", path: "/fuentes/A" },
    }),
  ]);
  assert.deepEqual(stats.contacts.whatsappClicks, { total: 2, fromProducts: 1, general: 1 });
  assert.deepEqual(stats.contacts.whatsappByPage.map((r) => r.label).sort(), ["Ficha de fuente LED", "Inicio"]);
});

test("Páginas de descargas: visitas y clics en archivos", () => {
  const stats = run([
    ev("view_download_page", "2026-10-16T12:00:00Z", { metadata: { v: 2, env: "production", slug: "fuentes" } }),
    ev("view_download_page", "2026-10-16T13:00:00Z", { metadata: { v: 2, env: "production", slug: "fuentes" } }),
    ev("document_click", "2026-10-16T13:01:00Z", {
      metadata: { v: 2, env: "production", slug: "fuentes", location: "download_page", doc_label: "Catálogo fuentes", target_id: "7" },
    }),
  ]);
  assert.deepEqual(stats.documents.downloadPages, [{ slug: "fuentes", views: 2, fileClicks: 1 }]);
  assert.equal(stats.documents.general, 1);
  assert.equal(stats.documents.top[0].label, "Catálogo fuentes");
});

test("Origen de las visitas agrupado", () => {
  const stats = run([historicView("2026-10-15T12:00:00Z", "A"), view("2026-10-16T12:00:00Z", "fuentes", "B")]);
  assert.equal(stats.sources.total, 2);
  assert.deepEqual(stats.sources.kinds.map((k) => k.id).sort(), ["direct", "search"]);
});

test("includeDevEvents (solo verificación en desarrollo) cuenta los eventos de prueba", () => {
  const dev = view("2026-10-16T12:00:00Z", "fuentes", "GSG-36WHH", { env: "development" });
  const stats = aggregateSiteStats({
    current: [dev],
    previous: [],
    period: week,
    comparisonRange,
    family: null,
    coverage: coverage(),
    now: NOW,
    includeDevEvents: true,
  });
  assert.equal(stats.metrics.views.value, 1);
  assert.equal(stats.includesDevEvents, true);
});
