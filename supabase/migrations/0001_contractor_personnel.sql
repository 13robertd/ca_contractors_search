-- =====================================================================
-- Migration 0001 — contractor_personnel
--
-- Adds a personnel table keyed to the CSLB license number. One row per
-- person (owner / officer / RME / RMO / etc.) associated with a license,
-- including association/disassociation dates so we can reason about
-- "current" vs "historical" personnel.
--
-- The detail page does NOT read from this table yet — the CSLB
-- personnel file still needs to be ingested. This migration just
-- provisions the schema + read-only public access policy.
--
-- Run this in Supabase Dashboard → SQL Editor → New Query → Run.
-- =====================================================================

create table if not exists contractor_personnel (
    id                  bigserial primary key,
    license_number      text not null
        references contractors(license_number) on delete cascade,
    full_name           text not null,
    title               text,
    association_date    date,
    disassociation_date date,
    created_at          timestamptz not null default now()
);

-- Primary access pattern: look up all personnel for a given license.
create index if not exists idx_personnel_license
    on contractor_personnel (license_number);

-- Hot path for "who is currently associated with this license?"
-- Partial index keeps it tiny even after years of historical churn.
create index if not exists idx_personnel_active_license
    on contractor_personnel (license_number)
    where disassociation_date is null;

-- ---------------------------------------------------------------------
-- Row Level Security — public read, matching the `contractors` table.
-- ---------------------------------------------------------------------
alter table contractor_personnel enable row level security;

drop policy if exists "Public can read personnel" on contractor_personnel;
create policy "Public can read personnel"
    on contractor_personnel
    for select
    to anon, authenticated
    using (true);
