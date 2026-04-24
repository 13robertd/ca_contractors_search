-- Pass 2 geocoder metadata + RPC for failed / missing-coordinate rows only.

alter table contractors add column if not exists geocode_notes text;
alter table contractors add column if not exists normalized_address text;
alter table contractors add column if not exists geocode_pass integer not null default 0;

comment on column contractors.geocode_notes is
  'Human-readable geocode pipeline notes (e.g. pass2 variant used).';

comment on column contractors.normalized_address is
  'Last one-line address string sent to geocoders (pass1/pass2).';

-- Pass 2 batch fetch: failures, missing coords, pass2 re-runs — never high-quality success.
create or replace function public.contractors_geocode_pass2_fetch_batch(
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
    and c.geocode_attempts < 30
    and c.geocode_status is distinct from 'mailing_only'
    and c.geocode_status is distinct from 'success'
    and (
      c.geocode_status in ('failed', 'failed_pass2')
      or c.latitude is null
      or c.longitude is null
    )
  order by c.license_number
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;

revoke all on function public.contractors_geocode_pass2_fetch_batch(text, int) from public;
grant execute on function public.contractors_geocode_pass2_fetch_batch(text, int) to service_role;

-- Exact pending count for Pass 2 progress logs (same filter as fetch batch).
create or replace function public.contractor_geocode_pass2_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from contractors c
  where
    c.geocode_attempts < 30
    and c.geocode_status is distinct from 'mailing_only'
    and c.geocode_status is distinct from 'success'
    and (
      c.geocode_status in ('failed', 'failed_pass2')
      or c.latitude is null
      or c.longitude is null
    );
$$;

revoke all on function public.contractor_geocode_pass2_count() from public;
grant execute on function public.contractor_geocode_pass2_count() to service_role;

-- Pass 1 must not re-process rows finalized by Pass 2.
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
    and c.geocode_status is distinct from 'failed_pass2'
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
