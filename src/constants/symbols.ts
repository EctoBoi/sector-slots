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
export const DEFAULT_SYMBOL_WEIGHTS: number[] = [
    0.079, // 0  TL Corner
    0.079, // 1  TR Corner
    0.078, // 2  BR Corner
    0.078, // 3  BL Corner
    0.078, // 4  V Tunnel
    0.078, // 5  H Tunnel
    0.53, // 6  Blank
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
