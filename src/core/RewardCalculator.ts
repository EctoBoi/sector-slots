import { PAYOUT_MULTIPLIERS } from "../constants/payouts";
import type { PatternMatch } from "./PatternDetector";

export interface RewardResult {
    totalPayout: number;
    breakdown: { name: string; multiplier: number; payout: number }[];
    highestTier: string;
}

export function calculatePayout(matches: PatternMatch[], denomination: number): RewardResult {
    let totalPayout = 0;
    const breakdown: RewardResult["breakdown"] = [];
    let highestMultiplier = 0;
    let highestTier = "";

    for (const match of matches) {
        const multiplier = PAYOUT_MULTIPLIERS[match.tier];
        const payout = multiplier * denomination;
        totalPayout += payout;
        breakdown.push({ name: `${match.area}-cell enclosure`, multiplier, payout });
        if (multiplier > highestMultiplier) {
            highestMultiplier = multiplier;
            highestTier = match.tier;
        }
    }

    return { totalPayout, breakdown, highestTier };
}
