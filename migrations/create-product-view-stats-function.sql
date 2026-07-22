create index if not exists analytics_events_event_type_created_at_idx
  on public.analytics_events (event_type, created_at desc);

create or replace function public.get_product_view_stats(
  p_start timestamptz default null,
  p_end timestamptz default null,
  p_prev_start timestamptz default null,
  p_prev_end timestamptz default null
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with filtered as materialized (
    select
      product_name,
      product_code,
      created_at,
      metadata,
      -- El día/hora se agrupan por el momento real de visita del usuario
      -- (metadata.viewedAt) cuando viene en formato ISO válido; si no, created_at.
      case
        when coalesce(metadata ->> 'viewedAt', '') ~ '^\d{4}-\d{2}-\d{2}[T ]'
          then (metadata ->> 'viewedAt')::timestamptz
        else created_at
      end as effective_at
    from public.analytics_events
    where event_type = 'view_product'
      and (p_start is null or created_at >= p_start)
      and (p_end is null or created_at <= p_end)
  ),
  prev_totals as (
    select
      count(*)::bigint as total_views,
      count(distinct coalesce(nullif(product_code, ''), 'N/A'))::bigint as unique_products
    from public.analytics_events
    where p_prev_start is not null
      and event_type = 'view_product'
      and created_at >= p_prev_start
      and created_at <= p_prev_end
  ),
  totals as (
    select
      count(*)::bigint as total_views,
      count(distinct coalesce(nullif(product_code, ''), 'N/A'))::bigint as unique_products
    from filtered
  ),
  products as (
    select
      coalesce(nullif(product_name, ''), 'Desconocido') as product_name,
      coalesce(nullif(product_code, ''), 'N/A') as product_code,
      count(*)::bigint as view_count,
      max(created_at) as last_viewed
    from filtered
    group by 1, 2
    order by view_count desc, product_name
    limit 20
  ),
  daily as (
    select
      to_char(effective_at at time zone 'America/Argentina/Cordoba', 'YYYY-MM-DD') as day,
      count(*)::bigint as view_count
    from filtered
    group by 1
    order by 1
  ),
  hourly_counts as (
    select
      extract(hour from effective_at at time zone 'America/Argentina/Cordoba')::integer as hour,
      count(*)::bigint as view_count
    from filtered
    group by 1
  ),
  hourly as (
    select series.hour, coalesce(hourly_counts.view_count, 0)::bigint as view_count
    from generate_series(0, 23) as series(hour)
    left join hourly_counts using (hour)
    order by series.hour
  ),
  referrers as (
    select
      coalesce(nullif(metadata ->> 'referrer', ''), 'Directo') as label,
      count(*)::bigint as view_count
    from filtered
    group by 1
    order by view_count desc, label
    limit 10
  ),
  paths as (
    select
      coalesce(nullif(metadata ->> 'path', ''), 'Desconocido') as label,
      count(*)::bigint as view_count
    from filtered
    group by 1
    order by view_count desc, label
    limit 10
  ),
  zones as (
    select
      coalesce(nullif(metadata ->> 'timezone', ''), 'Desconocido') as label,
      count(*)::bigint as view_count
    from filtered
    group by 1
    order by view_count desc, label
  )
  select jsonb_build_object(
    'totalViews', totals.total_views,
    'uniqueProducts', totals.unique_products,
    'averagePerProduct', case
      when totals.unique_products = 0 then 0
      else round(totals.total_views::numeric / totals.unique_products)::bigint
    end,
    'topProducts', coalesce((
      select jsonb_agg(jsonb_build_object(
        'productName', product_name,
        'productCode', product_code,
        'count', view_count,
        'lastViewed', last_viewed
      ) order by view_count desc, product_name)
      from products
    ), '[]'::jsonb),
    'viewsByDay', coalesce((
      select jsonb_agg(jsonb_build_object('day', day, 'count', view_count) order by day)
      from daily
    ), '[]'::jsonb),
    'viewsByHour', coalesce((
      select jsonb_agg(jsonb_build_object('hour', hour, 'count', view_count) order by hour)
      from hourly
    ), '[]'::jsonb),
    'topReferrers', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', view_count) order by view_count desc, label)
      from referrers
    ), '[]'::jsonb),
    'topPaths', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', view_count) order by view_count desc, label)
      from paths
    ), '[]'::jsonb),
    'timezones', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', view_count) order by view_count desc, label)
      from zones
    ), '[]'::jsonb),
    'comparison', case
      when p_prev_start is null then null
      else (
        select jsonb_build_object(
          'totalViews', prev_totals.total_views,
          'uniqueProducts', prev_totals.unique_products
        )
        from prev_totals
      )
    end
  )
  from totals;
$$;

revoke all on function public.get_product_view_stats(timestamptz, timestamptz, timestamptz, timestamptz)
  from public, anon, authenticated;
grant execute on function public.get_product_view_stats(timestamptz, timestamptz, timestamptz, timestamptz)
  to service_role;

-- Elimina la firma anterior de 2 parámetros si quedó de una migración previa.
drop function if exists public.get_product_view_stats(timestamptz, timestamptz);
