import { outfits, type CharacterLook, type OutfitChoice } from '@cr/content';

const FALLBACK_ID = 'baba-bullabaa';

/** Identity (look) is fixed per Contender; the outfit is player-editable and local-only. */
export function getCharacter(
  contenderId: string,
  overrides: Partial<OutfitChoice> | undefined,
): { look: CharacterLook; outfit: OutfitChoice } {
  const base = outfits.characters[contenderId] ?? outfits.characters[FALLBACK_ID]!;
  return { look: base.look, outfit: { ...base.outfit, ...(overrides ?? {}) } };
}
