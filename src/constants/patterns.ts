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
