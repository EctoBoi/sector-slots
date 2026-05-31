import { DEFAULT_DENOMINATION, DENOMINATIONS, PAYOUT_MULTIPLIERS } from "./payouts";
import { DEFAULT_SYMBOL_WEIGHTS } from "./symbols";
import type { PayoutTier } from "./payouts";

export const DEBT_CEILING = 3000;

export const LOAN_TIERS: ReadonlyArray<number> = [200, 400, 600, 800];

export const CONFIG = {
    denomination: DEFAULT_DENOMINATION,
    denominations: DENOMINATIONS,
    startingBalance: 20.0,
    symbolWeights: DEFAULT_SYMBOL_WEIGHTS,
    payoutMultipliers: PAYOUT_MULTIPLIERS as Record<PayoutTier, number>,
    couchSearch: {
        durationMs: 5_000,
        minFind: 4.0,
        maxFind: 20.0,
    },
    animation: {
        spinStaggerPerColumn: 0.08, // seconds
        flipDuration: 0.05,
        winHighlightDuration: 0.3,
    },
};
