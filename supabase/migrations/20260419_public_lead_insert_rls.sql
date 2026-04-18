begin;

alter table public.leads enable row level security;

revoke all on table public.leads from anon;
revoke all on table public.leads from authenticated;

grant usage on schema public to anon;
grant insert on table public.leads to anon;

drop policy if exists "anon_insert_leads" on public.leads;

create policy "anon_insert_leads"
on public.leads
for insert
to anon
with check (
  status = 'new'
  and internal_notes = ''
  and contact_name <> ''
  and contact_value <> ''
  and service_intent <> ''
  and rule_version <> ''
  and contact_channel in ('wechat', 'phone', 'email', 'other')
  and jsonb_typeof(inputs) = 'object'
  and jsonb_typeof(quote_snapshot) = 'object'
  and (inputs ->> 'source') in ('quote', 'contact')
);

commit;
