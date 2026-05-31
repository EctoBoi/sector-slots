export type PayoutTier = "small" | "medium" | "large" | "jackpot" | "mega_jackpot";

// Enclosure payout tiers: [minimumCellCount, tier], checked in descending order.
// Any enclosed region of N cells awards the first tier where N >= minimum.
export const ENCLOSURE_TIERS: [number, PayoutTier][] = [
    [12, "mega_jackpot"],
    [9, "jackpot"],
    [5, "large"],
    [3, "medium"],
    [1, "small"],
];

export const DENOMINATIONS: number[] = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2, 3, 4, 6, 8, 10, 12, 14, 16, 18, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900,
    1000, 1500, 2000, 3000, 4000, 6000, 8000, 10000,
];

export const DEFAULT_DENOMINATION = 1.0; // index 4

export const SPIN_COST_MULTIPLIER = 1; // spin costs 1× denomination

export const PAYOUT_MULTIPLIERS: Record<PayoutTier, number> = {
    small: 1.5,
    medium: 3,
    large: 15,
    jackpot: 100,
    mega_jackpot: 1000,
};
