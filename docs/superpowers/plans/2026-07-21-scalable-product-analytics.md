# Scalable Product Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make product-view statistics exact beyond 1000 events and keep the dashboard efficient as `analytics_events` grows.

**Architecture:** The browser requests one summarized payload from an authenticated Next.js route. The route prefers a PostgreSQL RPC that aggregates in the database and falls back to paginated server-side aggregation until the migration is installed, so totals are always correct. The UI renders the summary with ApexCharts and no longer downloads raw analytics events.

**Tech Stack:** Next.js 15, TypeScript, Supabase/PostgreSQL, ApexCharts, Node.js test runner.

## Global Constraints

- Never calculate totals from a single default Supabase result page.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client code.
- Preserve the existing date presets and custom date range.
- Add no runtime dependency.
- Keep the existing light/dark dashboard visual language.

---

### Task 1: Tested analytics aggregation boundary

**Files:**
- Create: `src/lib/analytics/product-view-stats.ts`
- Test: `src/lib/analytics/product-view-stats.test.ts`

**Interfaces:**
- Consumes: pages of `ProductViewEvent` records.
- Produces: `aggregateProductViewEvents(events)` and `fetchAllProductViewEvents(fetchPage, pageSize)` plus the `ProductViewStats` payload type.

- [ ] Write tests proving that 1,503 events produce a total of 1,503, that products/days/hours are aggregated correctly, and that page fetching continues after the first 1,000 rows.
- [ ] Run `node --test --experimental-strip-types src/lib/analytics/product-view-stats.test.ts` and confirm failure because the module does not exist.
- [ ] Implement the minimal pure aggregation and pagination helpers.
- [ ] Re-run the focused tests and confirm all pass.

### Task 2: Database aggregation and server API

**Files:**
- Create: `migrations/create-product-view-stats-function.sql`
- Create: `src/app/api/analytics/product-views/route.ts`
- Test: `src/lib/analytics/product-view-stats.test.ts`

**Interfaces:**
- Consumes: optional ISO `start` and `end` query parameters.
- Produces: `GET /api/analytics/product-views` returning `ProductViewStats`.

- [ ] Add validation tests for invalid and reversed ranges.
- [ ] Add a stable PostgreSQL function `get_product_view_stats(p_start, p_end)` that returns total, unique products, daily/hourly series, top products, referrers, paths, and timezones using SQL aggregation.
- [ ] Implement the authenticated server route: call the RPC first; if PostgreSQL reports the function is not installed, fetch `.range()` pages and aggregate on the server; return other errors as HTTP 500.
- [ ] Run the focused tests and TypeScript checking.

### Task 3: Summary-driven dashboard

**Files:**
- Modify: `src/components/analytics/ProductViewsDashboard.tsx`
- Modify: `src/app/(admin)/statistics/page.tsx`
- Remove: `src/components/dashboard/DashboardStats.tsx`

**Interfaces:**
- Consumes: `ProductViewStats` from `/api/analytics/product-views`.
- Produces: one responsive statistics dashboard with exact totals and ApexCharts visualizations.

- [ ] Replace raw Supabase browser queries and `views.length` calculations with the summarized API payload.
- [ ] Replace hand-built bars with a daily area chart, an hourly column chart, and a horizontal top-products chart using the installed ApexCharts package.
- [ ] Keep source/path/timezone summaries and remove the duplicated 7/30-day cards that performed separate truncated queries.
- [ ] Add visible loading, empty, and error states.
- [ ] Run focused tests, `npx tsc --noEmit`, and `npm run build`.
- [ ] Verify `/statistics` in the browser after authentication and confirm the 30-day total exceeds 1000 and matches the exact database count.

## Self-review

- Coverage: exact totals, scalable SQL aggregation, safe fallback, charts, filters, and error states are included.
- Placeholder scan: no implementation placeholders remain.
- Type consistency: the API and UI share the single `ProductViewStats` contract from `src/lib/analytics/product-view-stats.ts`.
