# ADR-0002: Three.js low-poly 3D

## Decision
Client renderer is **Three.js (WebGL2)**, stylized low-poly with toon/gradient lighting. Not Pixi / pseudo-3D.

## Why
Target quality ≥ Lagos Run: real perspective, chase cam, instanced crowds, lighting per state, set-piece venues.

## Consequences
C02 is heavier. Models start as procedural primitives; glTF meshopt swaps via registry. Perf: InstancedMesh, no shadow maps, DPR ≤ 1.5, ≤ 150 draw calls / 120k tris.
