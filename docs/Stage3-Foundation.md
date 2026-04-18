# Stage 3 Foundation

## Status

This document freezes the scope for stage 3, part 1 only.

The goal of this step is limited to:

- review the current quote and contact flow
- choose the minimum storage route
- define the minimum `leads` data model

This step does not implement the full backend flow yet.

## Current Reuse

The following existing assets are intentionally reused:

- `/quote` three-step intake flow
- `QuoteEngineOutput` from `src/lib/quote-engine/types.ts`
- `rule_version` from the quote engine result
- the current `/admin` page position as a lightweight admin entry

The following current limitations are also kept for now:

- `/quote` and `/contact` still write to browser `localStorage`
- `/admin` still reads masked local records only
- no login, no order system, no CRM, no dispatch workflow

## Scope Freeze

Stage 3, part 1 does:

- define the storage route
- define the minimum table shape
- define the minimum TypeScript shape
- define the environment variables required for later wiring

Stage 3, part 1 does not do:

- payment
- CRM
- multi-role permissions
- dispatching
- full order management
- auth screens
- notification integrations
- automatic follow-up workflows
- a complex operations backend

## Storage Decision

Selected route:

- `Supabase / Postgres`
- `Next.js` server-side route handler for writes and later admin reads

Why this is the lightest fit for this repository:

- the repo is already a `Next.js` app, so route handlers add no new runtime layer
- Postgres gives one stable table for leads without inventing a custom file store
- Supabase removes the need to self-build connection pooling, auth primitives, and hosted backups on day one
- the write path can stay server-only, so secrets remain in environment variables
- this route scales one step further than `localStorage` without turning the project into a heavy backend system

Rejected options for this step:

- `localStorage` only: too fragile and device-bound for real lead intake
- a full custom backend service: too much complexity for a solo-maintained platform
- expanding into multiple tables now: premature for the current stage

## Minimum Lead Model

Single table only: `leads`

Core fields:

- `id uuid primary key`
- `created_at timestamptz not null default now()`
- `status text not null default 'new'`
- `contact_name text not null`
- `contact_channel text not null`
- `contact_value text not null`
- `service_date_time timestamptz null`
- `service_intent text not null`
- `inputs jsonb not null`
- `quote_snapshot jsonb not null`
- `rule_version text not null`
- `internal_notes text not null default ''`

Allowed `status` values:

- `new`
- `contacted`
- `closed`
- `spam`

Minimum indexes:

- `created_at desc`
- `(status, created_at desc)`

Notes:

- `inputs` stores the normalized intake payload we already collect from `/quote` or `/contact`
- `quote_snapshot` stores the public quote result snapshot, not internal pricing debug data
- `service_date_time` is nullable because the contact page may only have a rough date or no confirmed time yet
- no order table, payment table, or customer master table is added in this step

## Mapping Rule

The default lead source for the next step should be `/quote`.

Expected mapping:

- `contact_name` <- `customerName`
- `contact_channel` <- parsed from `contactMethod`
- `contact_value` <- raw contact value
- `service_date_time` <- `serviceDate + startTime` when available
- `service_intent` <- public service label or `trip_intent`
- `inputs` <- current form snapshot
- `quote_snapshot` <- public quote result card plus price range data
- `rule_version` <- `QuoteEngineOutput.rule_version`

The standalone `/contact` page can later write into the same `leads` table with a smaller `inputs` payload and an empty quote snapshot shape when no quote exists.
