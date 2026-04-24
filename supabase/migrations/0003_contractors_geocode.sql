-- Geocoding columns for contractor map accuracy (batch script + app read).
-- Safe to re-run.

alter table contractors add column if not exists latitude double precision;
alter table contractors add column if not exists longitude double precision;
alter table contractors add column if not exists geocode_precision text;
alter table contractors add column if not exists geocode_source text;
alter table contractors add column if not exists geocoded_at timestamptz;
alter table contractors add column if not exists geocode_status text;
alter table contractors add column if not exists geocode_attempts integer not null default 0;

comment on column contractors.geocode_precision is
  'rooftop | street | interpolated | city | zip | failed — see lib/geo.ts STRONG_GEOCODE_PRECISIONS';

comment on column contractors.geocode_status is
  'success | failed | retry — script selects rows needing work';

create index if not exists idx_contractors_geocode_precision
  on contractors (geocode_precision);

-- Optional: speed “needs geocode” scans (partial index).
create index if not exists idx_contractors_needs_geocode
  on contractors (license_number)
  where latitude is null
     or longitude is null
     or geocode_precision in ('zip', 'city', 'failed')
     or geocode_precision is null
     or geocode_status = 'retry';

-- Aggregated stats for npm run geocode:stats (service role / postgres).
create or replace function public.contractor_geocode_stats()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'total', (select count(*)::int from contractors),
    'missing_coords', (
      select count(*)::int from contractors
      where latitude is null or longitude is null
    ),
    'needs_refresh', (
      select count(*)::int from contractors
      where (latitude is null or longitude is null)
         or geocode_precision in ('zip', 'city', 'failed')
         or geocode_precision is null
         or geocode_status = 'retry'
    ),
    'by_precision', coalesce(
      (
        select jsonb_object_agg(coalesce(geocode_precision, '(null)'), c)
        from (
          select geocode_precision, count(*)::int as c
          from contractors
          group by geocode_precision
        ) s
      ),
      '{}'::jsonb
    ),
    'by_status', coalesce(
      (
        select jsonb_object_agg(coalesce(geocode_status, '(null)'), c)
        from (
          select geocode_status, count(*)::int as c
          from contractors
          group by geocode_status
        ) t
      ),
      '{}'::jsonb
    )
  );
$$;

revoke all on function public.contractor_geocode_stats() from public;
grant execute on function public.contractor_geocode_stats() to service_role;

-- Cursor-paginated candidates for the geocoder script (deterministic order).
create or replace function public.contractors_geocode_fetch_batch(
  p_after text,
  p_limit int
)
returns table (
  license_number text,
  business_name text,
  address text,
  city text,
  state text,
  zip_code text,
  latitude double precision,
  longitude double precision,
  geocode_precision text,
  geocode_status text,
  geocode_attempts integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.license_number,
    c.business_name,
    c.address,
    c.city,
    c.state,
    c.zip_code,
    c.latitude,
    c.longitude,
    c.geocode_precision,
    c.geocode_status,
    c.geocode_attempts
  from contractors c
  where
    (coalesce(nullif(trim(p_after), ''), '') = '' or c.license_number > trim(p_after))
    and c.geocode_attempts < 15
    and (
      c.latitude is null
      or c.longitude is null
      or c.geocode_precision in ('zip', 'city', 'failed')
      or c.geocode_precision is null
      or c.geocode_status = 'retry'
    )
  order by c.license_number
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.contractors_geocode_fetch_batch(text, int) from public;
grant execute on function public.contractors_geocode_fetch_batch(text, int) to service_role;
