# ADR-0001: pnpm monorepo

## Decision
pnpm workspaces (`apps/*`, `packages/*`, `tools`). TypeScript `strict` + `noUncheckedIndexedAccess`. No Turborepo until needed.

## Consequences
Single `pnpm verify`. Workspace packages `@cr/sim`, `@cr/content`, `@cr/game`.
