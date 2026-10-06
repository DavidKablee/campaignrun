# ADR-0006: Contender data local until consent

## Decision
Contender choice stays in device storage until C11 explicit NDPA consent. R0 score paths must not send `contenderId`. Input logs stay local in R0.

## Consequences
Zustand persist is fine. Analytics `switch_contender` aggregate-only without user id until C11.
