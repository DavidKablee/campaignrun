# ADR-0004: Staged backend

## Decision
R0: static hosting + optional score Worker + plausibility checks. Queues, ledger, full replay verification arrive in later chunks (C09+).

## Consequences
No Cloudflare required for Gate 1 local play. Kill switch via `public/flags.json`.
