// Helpers for fixed-point integer math if needed
export function clamp(val: number, min: number, max: number): number {
  return val < min ? min : val > max ? max : val;
}

// Fixed point integer percentage: 1000 = 1.0 (100%)
export function applyPermille(value: number, permille: number): number {
  return Math.floor((value * permille) / 1000);
}
