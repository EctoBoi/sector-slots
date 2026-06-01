import { DEBT_CEILING, LOAN_TIERS } from "../constants/config";
import type { PlayerState, DebtRecord } from "./PlayerState";

export function getLoanTier(loanNumber: number, debtCleared = 0): { amount: number; rate: number } {
    const idx = loanNumber - 1;
    const amount = idx < LOAN_TIERS.length ? LOAN_TIERS[idx] : LOAN_TIERS[LOAN_TIERS.length - 1];
    const baseRate = loanNumber * 0.005;
    const discount = debtCleared * 0.004;
    const rate = Math.max(0.005, baseRate - discount);
    return { amount, rate };
}

export function canTakeLoan(state: PlayerState): boolean {
    const next = getLoanTier(state.nextLoanIndex, state.debtCleared);
    return getTotalDebt(state) + next.amount <= DEBT_CEILING;
}

export function takeLoan(state: PlayerState): void {
    const tier = getLoanTier(state.nextLoanIndex, state.debtCleared);
    const debt: DebtRecord = {
        id: state.nextLoanIndex,
        originalAmount: tier.amount,
        currentBalance: tier.amount,
        rate: tier.rate,
    };
    state.debts.push(debt);
    state.balance = Math.round((state.balance + tier.amount) * 100) / 100;
    state.nextLoanIndex++;
    state.loansThisRun++;
}

export function tickInterest(state: PlayerState): void {
    for (const debt of state.debts) {
        debt.currentBalance = Math.round(debt.currentBalance * (1 + debt.rate) * 100) / 100;
    }
}

export function getTotalDebt(state: PlayerState): number {
    return Math.round(state.debts.reduce((sum, d) => sum + d.currentBalance, 0) * 100) / 100;
}

export function repayDebt(state: PlayerState, debtId: number, amount: number): void {
    const debt = state.debts.find((d) => d.id === debtId);
    if (!debt) return;
    const payment = Math.min(Math.max(amount, 0), debt.currentBalance, state.balance);
    debt.currentBalance = Math.round((debt.currentBalance - payment) * 100) / 100;
    state.balance = Math.round((state.balance - payment) * 100) / 100;
    if (debt.currentBalance <= 0) {
        state.debts = state.debts.filter((d) => d.id !== debtId);
    }
}

export function isDebtCeilingHit(state: PlayerState): boolean {
    return getTotalDebt(state) >= DEBT_CEILING;
}
