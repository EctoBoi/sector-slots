export const Side = {
    T: 1,
    R: 2,
    B: 4,
    L: 8,
} as const;

export interface Symbol {
    id: number;
    name: string;
    borders: number; // bitmask of Side flags
}

export const SYMBOLS: Symbol[] = [
    { id: 0, name: "TL Corner", borders: Side.T | Side.L },
    { id: 1, name: "TR Corner", borders: Side.T | Side.R },
    { id: 2, name: "BR Corner", borders: Side.B | Side.R },
    { id: 3, name: "BL Corner", borders: Side.B | Side.L },
    { id: 4, name: "V Tunnel", borders: Side.T | Side.B },
    { id: 5, name: "H Tunnel", borders: Side.L | Side.R },
    { id: 6, name: "Blank", borders: 0 },
];

// 7 values, must sum to 1.0
// Each corner/tunnel contributes 2 wall segments instead of 1, boosting enclosure frequency.
// Blank is the engagement knob: lower blank → denser walls → more frequent (smaller) wins.
// blank=0.56 → ~34% hit rate, ~97% RTP  (with multipliers 2/5/15/60/300)
export const DEFAULT_SYMBOL_WEIGHTS: number[] = [
    0.0734, // 0  TL Corner
    0.0734, // 1  TR Corner
    0.0733, // 2  BR Corner
    0.0733, // 3  BL Corner
    0.0733, // 4  V Tunnel
    0.0733, // 5  H Tunnel
    0.56, // 6  Blank  — 2×0.0734 + 4×0.0733 + 0.56 = 1.00
];

export function weightedRandom(weights: number[]): number {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return i;
    }
    return weights.length - 1;
}
