export type PayoutTier = "small" | "medium" | "large" | "jackpot" | "mega_jackpot";

// Enclosure payout tiers: [minimumCellCount, tier], checked in descending order.
// Any enclosed region of N cells awards the first tier where N >= minimum.
export const ENCLOSURE_TIERS: [number, PayoutTier][] = [
    [14, "mega_jackpot"],
    [10, "jackpot"],
    [7, "large"],
    [3, "medium"],
    [1, "small"],
];

export const DENOMINATIONS: number[] = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 200, 400, 600, 800, 1000,
    2000, 4000, 6000, 8000, 10000,
];

export const DEFAULT_DENOMINATION = 1.0; // index 4

export const SPIN_COST_MULTIPLIER = 1; // spin costs 1× denomination

export const PAYOUT_MULTIPLIERS: Record<PayoutTier, number> = {
    small: 2,
    medium: 5,
    large: 20,
    jackpot: 100,
    mega_jackpot: 1000,
};
