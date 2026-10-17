import assert from "node:assert/strict";
import test from "node:test";

import { fetchAllPages } from "./fetch.ts";

test("Lee todos los registros aunque superen 1000", async () => {
  const total = 2503;
  const calls: Array<[number, number]> = [];
  const rows = await fetchAllPages(async (from, to) => {
    calls.push([from, to]);
    return Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, i) => from + i);
  });
  assert.equal(rows.length, total);
  assert.deepEqual(calls, [[0, 999], [1000, 1999], [2000, 2999]]);
  assert.equal(new Set(rows).size, total);
});

test("Exactamente 1000 registros: pide una página más y termina", async () => {
  let n = 0;
  const rows = await fetchAllPages(async (from) => {
    n += 1;
    return from === 0 ? Array.from({ length: 1000 }, (_, i) => i) : [];
  });
  assert.equal(rows.length, 1000);
  assert.equal(n, 2);
});
