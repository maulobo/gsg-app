import assert from "node:assert/strict";
import test from "node:test";

import {
  aggregateProductViewEvents,
  dateInputRangeToIso,
  fetchAllProductViewEvents,
  isMissingProductViewStatsRpcError,
  parseAnalyticsDateRange,
  previousPeriodRange,
  type ProductViewEvent,
} from "./product-view-stats.ts";

function makeEvent(index: number): ProductViewEvent {
  const day = index % 2 === 0 ? "2026-07-20" : "2026-07-21";
  const hour = index % 2 === 0 ? "10" : "15";

  return {
    id: index + 1,
    product_name: index % 3 === 0 ? "Lira" : "Cala",
    product_code: index % 3 === 0 ? "LIRA" : "CALA",
    created_at: `${day}T${hour}:00:00.000Z`,
    metadata: {
      path: index % 2 === 0 ? "/productos/lira" : "/productos/cala",
      referrer: index % 4 === 0 ? "https://google.com" : "",
      timezone: "America/Argentina/Cordoba",
      viewedAt: `${day}T${hour}:00:00.000Z`,
    },
  };
}

test("aggregates every event when the period contains more than 1000 rows", () => {
  const events = Array.from({ length: 1503 }, (_, index) => makeEvent(index));

  const result = aggregateProductViewEvents(events);

  assert.equal(result.totalViews, 1503);
  assert.equal(result.uniqueProducts, 2);
  assert.equal(result.topProducts.reduce((sum, item) => sum + item.count, 0), 1503);
  assert.equal(result.viewsByDay.reduce((sum, item) => sum + item.count, 0), 1503);
  assert.equal(result.viewsByHour.reduce((sum, item) => sum + item.count, 0), 1503);
  assert.equal(result.topReferrers.reduce((sum, item) => sum + item.count, 0), 1503);
  assert.equal(result.comparison, null);
});

test("previous period is the equal-length window immediately before the range", () => {
  const range = previousPeriodRange(
    "2026-07-15T00:00:00.000Z",
    "2026-07-21T23:59:59.999Z",
  );

  assert.ok(range);
  // Termina 1ms antes del inicio del período actual.
  assert.equal(range.end, "2026-07-14T23:59:59.999Z");
  // Y dura exactamente lo mismo que el período actual.
  const currentMs =
    new Date("2026-07-21T23:59:59.999Z").getTime() -
    new Date("2026-07-15T00:00:00.000Z").getTime();
  const prevMs = new Date(range.end).getTime() - new Date(range.start).getTime();
  assert.equal(prevMs, currentMs);
});

test("previous period is null when the range is open-ended (preset Todo)", () => {
  assert.equal(previousPeriodRange(null, null), null);
  assert.equal(previousPeriodRange(null, "2026-07-21T23:59:59.999Z"), null);
  assert.equal(previousPeriodRange("2026-07-15T00:00:00.000Z", null), null);
});

test("keeps requesting pages until Supabase returns a short page", async () => {
  const events = Array.from({ length: 1503 }, (_, index) => makeEvent(index));
  const requestedPages: Array<[number, number]> = [];

  const result = await fetchAllProductViewEvents(async (from, to) => {
    requestedPages.push([from, to]);
    return events.slice(from, to + 1);
  });

  assert.equal(result.length, 1503);
  assert.deepEqual(requestedPages, [
    [0, 999],
    [1000, 1999],
  ]);
});

test("rejects invalid or reversed analytics date ranges", () => {
  assert.throws(
    () => parseAnalyticsDateRange("not-a-date", "2026-07-21T23:59:59.999Z"),
    /inválida/i,
  );
  assert.throws(
    () => parseAnalyticsDateRange("2026-07-22T00:00:00.000Z", "2026-07-21T23:59:59.999Z"),
    /posterior/i,
  );
  assert.deepEqual(parseAnalyticsDateRange(null, null), { start: null, end: null });
});

test("falls back only when the product stats RPC is not installed", () => {
  assert.equal(isMissingProductViewStatsRpcError({ code: "PGRST202" }), true);
  assert.equal(isMissingProductViewStatsRpcError({ code: "42883" }), true);
  assert.equal(
    isMissingProductViewStatsRpcError({ code: "PGRST301", message: "JWT expired" }),
    false,
  );
  assert.equal(isMissingProductViewStatsRpcError(null), false);
});

test("turns date inputs into an inclusive local-day range", () => {
  const range = dateInputRangeToIso("2026-07-01", "2026-07-21");

  assert.match(range.start, /^2026-07-01T0[23]:00:00\.000Z$/);
  assert.match(range.end, /^2026-07-22T0[23]:59:59\.999Z$/);
});
