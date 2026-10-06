# ADR-0005: Original Contenders + hashed blocklist

## Decision
Six fictional Contenders. Parody names are allowed when the joke is about a role, not a real person. Real politician and party names stay blocked via SHA-256 hashes of normalised strings. The plain list is never committed. No character→person mapping in the repo.

## Consequences
Content lint fails on hashed hits and banned words (`candidate`, electoral-body marks). Resemblance test before R0 art final.
