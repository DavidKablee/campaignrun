/**
 * "Is this your state?" corrections.
 *
 * A correction is anonymous on purpose: the people best placed to catch a wrong name or a wrong
 * outfit are the people who live there, and asking them to sign in first would lose most of them.
 * The price is that the note must not carry a contact detail, so the form refuses one before it is
 * sent. The server applies the same rule (api/src/validate.ts), because a client is not trusted.
 */
const PERSONAL = /(https?:\/\/|www\.|[\w.+-]+@[\w-]+\.[\w.]+|\+?\d[\d\s().-]{6,}\d)/i;

export function looksPersonal(note: string): boolean {
  return PERSONAL.test(note);
}

export interface Correction {
  stateId: string;
  landmark: string;
  topic: string;
  note: string;
  fromHere: boolean;
}

/** The same note as plain text, for a player to copy when the server cannot be reached. */
export function correctionText(c: Correction, stateName: string, topicLabel: string): string {
  const where = c.landmark ? `${stateName} / ${c.landmark}` : stateName;
  return `Campaigner correction · ${where} · ${topicLabel}${c.fromHere ? ' (from there)' : ''}${c.note ? `\n${c.note}` : ''}`;
}
