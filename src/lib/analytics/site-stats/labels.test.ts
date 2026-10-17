import assert from "node:assert/strict";
import test from "node:test";

import { eventFamily, eventProductKey, isDevEvent, pageLabel, sourceOf, type AnalyticsEventRow } from "./labels.ts";

const ev = (over: Partial<AnalyticsEventRow>): AnalyticsEventRow => ({
  id: 1,
  event_type: "view_product",
  product_code: "KRO",
  product_name: "Kro",
  category: "Techo",
  created_at: "2026-10-20T15:00:00.000Z",
  metadata: {},
  ...over,
});

test("Compatibilidad histórica: view_product sin familia es luminarias", () => {
  const historic = ev({ metadata: { path: "/productos/techo/KRO", referrer: "https://www.google.com/" } });
  assert.equal(eventFamily(historic), "luminarias");
  assert.equal(eventProductKey(historic), "luminarias:KRO");
});

test("Mismo código en familias distintas da claves distintas", () => {
  const a = ev({ product_code: "P02", metadata: { v: 2, family: "perfiles" } });
  const b = ev({ product_code: "P02", metadata: { v: 2, family: "accesorios" } });
  assert.notEqual(eventProductKey(a), eventProductKey(b));
});

test("Acción general v2 sin familia no se atribuye a producto", () => {
  const click = ev({ event_type: "catalog_click", product_code: null, metadata: { v: 2 } });
  assert.equal(eventFamily(click), null);
  assert.equal(eventProductKey(click), null);
});

test("Actividad de desarrollo", () => {
  assert.equal(isDevEvent(ev({ metadata: { v: 2, env: "development" } })), true);
  assert.equal(isDevEvent(ev({ metadata: { v: 2, env: "preview" } })), true);
  assert.equal(isDevEvent(ev({ metadata: { v: 2, env: "production" } })), false);
  // Histórico: se infiere por referrer
  assert.equal(isDevEvent(ev({ metadata: { referrer: "http://localhost:3001/productos" } })), true);
  assert.equal(isDevEvent(ev({ metadata: { referrer: "https://gsg-web-v2.vercel.app/" } })), true);
  assert.equal(isDevEvent(ev({ metadata: { referrer: "https://www.google.com/" } })), false);
  assert.equal(isDevEvent(ev({ metadata: null })), false);
});

test("Orígenes normalizados", () => {
  assert.deepEqual(sourceOf(""), { kind: "direct", label: "Sin referencia" });
  assert.deepEqual(sourceOf("https://www.gsgdesign.com.ar/productos"), { kind: "internal", label: "Navegación interna" });
  assert.deepEqual(sourceOf("http://www.gsgdesign.com.ar"), { kind: "internal", label: "Navegación interna" });
  assert.deepEqual(sourceOf("https://www.google.com.ar/"), { kind: "search", label: "Google" });
  assert.deepEqual(sourceOf("android-app://com.google.android.googlequicksearchbox/"), { kind: "search", label: "Google" });
  assert.deepEqual(sourceOf("https://chatgpt.com/"), { kind: "ai", label: "ChatGPT" });
  assert.deepEqual(sourceOf("https://l.facebook.com/"), { kind: "social", label: "Facebook" });
  assert.deepEqual(sourceOf("https://linktr.ee"), { kind: "social", label: "Linktree" });
  assert.deepEqual(sourceOf("https://iluminando.adhoc.ar/x?utm_source=y"), { kind: "other", label: "iluminando.adhoc.ar" });
});

test("Rutas técnicas a nombres de página", () => {
  assert.equal(pageLabel("/"), "Inicio");
  assert.equal(pageLabel("/productos/techo/KRO"), "Ficha de luminaria");
  assert.equal(pageLabel("/productos/colgantes"), "Listado de luminarias");
  assert.equal(pageLabel("/productos/perfiles/P02"), "Ficha de perfil LED");
  assert.equal(pageLabel("/led/4"), "Ficha de rollo LED");
  assert.equal(pageLabel("/fuentes/GSG-36WHH"), "Ficha de fuente LED");
  assert.equal(pageLabel("/descargas/fuentes"), 'Página de descargas "fuentes"');
  assert.equal(pageLabel("/distribuidores/"), "Distribuidores");
});
