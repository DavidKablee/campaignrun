import { outfits, type OutfitChoice } from '@cr/content';

/**
 * The four things you can change about a Contender, and what counts as a change.
 *
 * Pure, because the screen that uses it cannot be tested here (vitest runs in
 * node with no DOM) and because "have I changed anything?" is the one piece of
 * real logic on the page: it decides whether Reset means anything, and which
 * tabs carry an edited dot. Before C42 the page could not answer it at all —
 * Reset was always offered, including to a player who had changed nothing, and
 * nothing said which of the four tabs held your edits.
 */
export type Slot = 'top' | 'bottom' | 'footwear' | 'headwear';

export interface SlotDef {
  id: Slot;
  label: string;
  /** Which option list in `outfits.options` fills this slot. */
  list: keyof typeof outfits.options;
  /** The colour field that travels with the slot, if it has one. */
  colorKey: keyof OutfitChoice;
}

export const SLOTS: SlotDef[] = [
  { id: 'top', label: 'Top', list: 'tops', colorKey: 'topColor' },
  { id: 'bottom', label: 'Trousers', list: 'bottoms', colorKey: 'bottomColor' },
  { id: 'footwear', label: 'Footwear', list: 'footwear', colorKey: 'footColor' },
  { id: 'headwear', label: 'Headwear', list: 'headwear', colorKey: 'headColor' },
];

/**
 * Which slots differ from the Contender's own look.
 *
 * A slot counts as changed when either the garment or its colour has moved, so
 * recolouring a shirt you kept is still an edit — it is the change most players
 * make first, and a dot that ignored it would look broken.
 */
export function changedSlots(base: OutfitChoice, current: OutfitChoice): Set<Slot> {
  const out = new Set<Slot>();
  for (const slot of SLOTS) {
    const sameItem = base[slot.id] === current[slot.id];
    // Hex comparison is case-insensitive: content and a colour picked in the UI
    // are both authored strings, and `#E0902B` is the same paint as `#e0902b`.
    const sameColor = String(base[slot.colorKey]).toLowerCase() === String(current[slot.colorKey]).toLowerCase();
    if (!sameItem || !sameColor) out.add(slot.id);
  }
  return out;
}

export function isCustomised(base: OutfitChoice, current: OutfitChoice): boolean {
  return changedSlots(base, current).size > 0;
}

/** The colour field's label, so the swatch row says what it paints. */
export function colorLabel(slot: SlotDef): string {
  return `${slot.label} colour`;
}
