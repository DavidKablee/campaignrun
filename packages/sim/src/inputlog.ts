export interface InputRecord {
  tick: number;
  input: number; // bitmask of Btn
}

export function encodeInputLog(records: InputRecord[]): Uint8Array {
  // Simple delta encoding for compactness
  const out = [];
  let lastTick = 0;
  for (const r of records) {
    const dt = r.tick - lastTick;
    // Varint encode dt
    let val = dt;
    while (val >= 0x80) {
      out.push((val & 0x7f) | 0x80);
      val >>>= 7;
    }
    out.push(val);
    out.push(r.input);
    lastTick = r.tick;
  }
  return new Uint8Array(out);
}

export function decodeInputLog(bytes: Uint8Array): InputRecord[] {
  const records: InputRecord[] = [];
  let lastTick = 0;
  let i = 0;
  while (i < bytes.length) {
    let dt = 0;
    let shift = 0;
    let b: number;
    do {
      b = bytes[i++]!;
      dt |= (b & 0x7f) << shift;
      shift += 7;
    } while (b >= 0x80);
    const tick = lastTick + dt;
    const input = bytes[i++]!;
    records.push({ tick, input });
    lastTick = tick;
  }
  return records;
}
