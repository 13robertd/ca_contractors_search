-- Align `contractors` with clean_contractors.py JSONL / app CSV.
-- Run in SQL Editor if you are not using Supabase CLI migrations.

alter table contractors add column if not exists entity_type text;
alter table contractors add column if not exists owner_name text;
alter table contractors add column if not exists workers_comp_coverage_type text;
