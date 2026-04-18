create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default timezone('utc', now()),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam')),
  contact_name text not null,
  contact_channel text not null check (contact_channel in ('wechat', 'phone', 'email', 'other')),
  contact_value text not null,
  service_date_time timestamptz null,
  service_intent text not null,
  inputs jsonb not null default '{}'::jsonb,
  quote_snapshot jsonb not null default '{}'::jsonb,
  rule_version text not null,
  internal_notes text not null default ''
);

create index if not exists leads_created_at_idx
  on public.leads (created_at desc);

create index if not exists leads_status_created_at_idx
  on public.leads (status, created_at desc);
