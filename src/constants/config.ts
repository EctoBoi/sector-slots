import { DEFAULT_DENOMINATION, DENOMINATIONS, PAYOUT_MULTIPLIERS } from "./payouts";
import { DEFAULT_SYMBOL_WEIGHTS } from "./symbols";
import type { PayoutTier } from "./patterns";

export const CONFIG = {
    denomination: DEFAULT_DENOMINATION,
    denominations: DENOMINATIONS,
    startingBalance: 10.0,
    symbolWeights: DEFAULT_SYMBOL_WEIGHTS,
    payoutMultipliers: PAYOUT_MULTIPLIERS as Record<PayoutTier, number>,
    couchSearch: {
        durationMs: 10_000,
        minFind: 1.0,
        maxFind: 5.0,
    },
    animation: {
        spinStaggerPerColumn: 0.08, // seconds
        flipDuration: 0.05,
        winHighlightDuration: 0.3,
    },
};
