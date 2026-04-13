# AGENTS.md

## Product Direction

- This repository currently serves a public-facing marketing website prototype.
- The current product theme is `Melbourne arrival assistance / local companion service`.
- Primary audiences:
  - Chinese international students newly arriving in Melbourne
  - Parents visiting Melbourne for a child's first arrival and settlement

## Build Rules

- Prefer `Next.js + TypeScript + Tailwind CSS`
- Keep the site mobile-first and deployable from the repository root
- Use Simplified Chinese for default copy unless a task explicitly changes locale behavior
- Keep pricing logic decoupled from UI components
- Put reusable business rules in `src/config` and calculations in `src/lib`

## Content Rules

- Tone should be calm, credible, and service-oriented
- Avoid exaggerated promises, fake endorsements, or unverifiable claims
- Position the service as `local life concierge + experienced senior guidance`

## Handoff Notes

- If later work needs real pricing, contact methods, or legal copy, update README placeholder sections first
- Preserve a clean separation between content data, components, and business logic
