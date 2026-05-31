const STORAGE_KEY = "sectorSlots_playerState";

export interface DebtRecord {
    id: number;
    originalAmount: number;
    currentBalance: number;
    rate: number;
}

export interface AllTimeRecords {
    highestBalance: number;
    highestSingleWin: number;
    highestNetGain: number;
    mostLoans: number;
    bestRunSpins: number;
    totalSpins: number;
}

export interface PlayerState {
    balance: number;
    totalSpins: number;
    lastWin: number;
    denomination: number;
    highestBalance: number;
    totalAmountWon: number;
    totalAmountLost: number;
    debts: DebtRecord[];
    nextLoanIndex: number;
    loansThisRun: number;
    highestSingleWin: number;
    records: AllTimeRecords;
}

function defaultRecords(): AllTimeRecords {
    return { highestBalance: 0, highestSingleWin: 0, highestNetGain: 0, mostLoans: 0, bestRunSpins: 0, totalSpins: 0 };
}

function parseDebt(d: unknown): DebtRecord | null {
    if (!d || typeof d !== "object") return null;
    const o = d as Record<string, unknown>;
    if (typeof o.id !== "number" || typeof o.originalAmount !== "number" || typeof o.currentBalance !== "number" || typeof o.rate !== "number") return null;
    return o as unknown as DebtRecord;
}

function parseRecords(r: unknown): AllTimeRecords {
    if (!r || typeof r !== "object") return defaultRecords();
    const o = r as Record<string, unknown>;
    return {
        highestBalance: typeof o.highestBalance === "number" ? o.highestBalance : 0,
        highestSingleWin: typeof o.highestSingleWin === "number" ? o.highestSingleWin : 0,
        highestNetGain: typeof o.highestNetGain === "number" ? o.highestNetGain : 0,
        mostLoans: typeof o.mostLoans === "number" ? o.mostLoans : 0,
        bestRunSpins: typeof o.bestRunSpins === "number" ? o.bestRunSpins : 0,
        totalSpins: typeof o.totalSpins === "number" ? o.totalSpins : 0,
    };
}

export function loadState(startingBalance: number, defaultDenomination: number): PlayerState {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<PlayerState>;
            const rawDebts = Array.isArray(parsed.debts) ? parsed.debts : [];
            return {
                balance: typeof parsed.balance === "number" ? parsed.balance : startingBalance,
                totalSpins: typeof parsed.totalSpins === "number" ? parsed.totalSpins : 0,
                lastWin: typeof parsed.lastWin === "number" ? parsed.lastWin : 0,
                denomination: typeof parsed.denomination === "number" ? parsed.denomination : defaultDenomination,
                highestBalance: typeof parsed.highestBalance === "number" ? parsed.highestBalance : startingBalance,
                totalAmountWon: typeof parsed.totalAmountWon === "number" ? parsed.totalAmountWon : 0,
                totalAmountLost: typeof parsed.totalAmountLost === "number" ? parsed.totalAmountLost : 0,
                debts: rawDebts.map(parseDebt).filter((d): d is DebtRecord => d !== null),
                nextLoanIndex: typeof parsed.nextLoanIndex === "number" ? parsed.nextLoanIndex : 1,
                loansThisRun: typeof parsed.loansThisRun === "number" ? parsed.loansThisRun : 0,
                highestSingleWin: typeof parsed.highestSingleWin === "number" ? parsed.highestSingleWin : 0,
                records: parseRecords(parsed.records),
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
        debts: [],
        nextLoanIndex: 1,
        loansThisRun: 0,
        highestSingleWin: 0,
        records: defaultRecords(),
    };
}

export function saveState(state: PlayerState): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
