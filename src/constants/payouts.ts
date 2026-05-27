import type { PayoutTier } from "./patterns";

export const DENOMINATIONS: number[] = [
    0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.4, 1.6, 1.8, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 18, 20, 25, 30, 40, 50, 60, 70, 80, 90, 100,
];

export const DEFAULT_DENOMINATION = 1.0; // index 4

export const SPIN_COST_MULTIPLIER = 1; // spin costs 1× denomination

export const PAYOUT_MULTIPLIERS: Record<PayoutTier, number> = {
    small: 5,
    medium: 15,
    large: 50,
    jackpot: 200,
    mega_jackpot: 1000,
};
