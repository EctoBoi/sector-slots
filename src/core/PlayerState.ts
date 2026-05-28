const STORAGE_KEY = "sectorSlots_playerState";

export interface PlayerState {
    balance: number;
    totalSpins: number;
    lastWin: number;
    denomination: number;
    highestBalance: number;
    totalAmountWon: number;
    totalAmountLost: number;
}

export function loadState(startingBalance: number, defaultDenomination: number): PlayerState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<PlayerState>;
            return {
                balance: typeof parsed.balance === "number" ? parsed.balance : startingBalance,
                totalSpins: typeof parsed.totalSpins === "number" ? parsed.totalSpins : 0,
                lastWin: typeof parsed.lastWin === "number" ? parsed.lastWin : 0,
                denomination: typeof parsed.denomination === "number" ? parsed.denomination : defaultDenomination,
                highestBalance: typeof parsed.highestBalance === "number" ? parsed.highestBalance : startingBalance,
                totalAmountWon: typeof parsed.totalAmountWon === "number" ? parsed.totalAmountWon : 0,
                totalAmountLost: typeof parsed.totalAmountLost === "number" ? parsed.totalAmountLost : 0,
            };
        }
    } catch {
        // corrupt storage — fall through to default
    }
    return {
        balance: startingBalance,
        totalSpins: 0,
        lastWin: 0,
        denomination: defaultDenomination,
        highestBalance: startingBalance,
        totalAmountWon: 0,
        totalAmountLost: 0,
    };
}

export function saveState(state: PlayerState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
