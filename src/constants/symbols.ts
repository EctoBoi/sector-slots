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
    { id: 0, name: "Top Line", borders: Side.T },
    { id: 1, name: "Right Line", borders: Side.R },
    { id: 2, name: "Bottom Line", borders: Side.B },
    { id: 3, name: "Left Line", borders: Side.L },
    { id: 4, name: "Blank", borders: 0 },
];

// 5 values, must sum to 1.0
// Blank at 7%: calibrated to ~94-95% RTP via enclosure frequency.
export const DEFAULT_SYMBOL_WEIGHTS: number[] = [
    0.2325, // 0  Top Line
    0.2325, // 1  Right Line
    0.2325, // 2  Bottom Line
    0.2325, // 3  Left Line
    0.07, // 4  Blank  — 4×0.2325 + 0.07 = 1.00
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
