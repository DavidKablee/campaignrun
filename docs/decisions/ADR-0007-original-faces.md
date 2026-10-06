# ADR-0007: Original faces, not real campaigners

## Context
A review asked for Contenders modelled on real Nigerian campaigners, with real facial likeness.

## Decision
Contenders stay six fictional archetypes. Parody names are allowed. The name, face, and prop must not be close to a real person: no phonetic echo, no signature look, no face a stranger would match to one public figure. Faces in `packages/content/data/outfits.json` stay stylised adult features (a range of Nigerian skin tones, hair, and face shape). The player can change top, trousers, footwear, headwear, and colours in the studio. That is cosmetic only: the sim never reads it, and the choice stays on the device until C11 consent.

## Consequences
The same look and outfit data can later drive original glTF meshes. A resemblance check still happens before release art is treated as final.
