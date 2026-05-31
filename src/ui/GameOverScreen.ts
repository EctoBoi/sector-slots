import type { AllTimeRecords } from "../core/PlayerState";

export type GameOverReason = "ceiling" | "couch";

export interface RunSummary {
    runSpins: number;
    peakBalance: number;
    loansThisRun: number;
    debtClearedThisRun: number;
    highestSingleWin: number;
    runNet: number;
}

const FLAVOR: Record<GameOverReason, string> = {
    ceiling: "The mafia came to collect.",
    couch: "Guess you gotta sell feet pics.",
};

export class GameOverScreen {
    private el: HTMLElement;

    constructor(el: HTMLElement, onPlayAgain: () => void) {
        this.el = el;
        document.getElementById("play-again-btn")!.addEventListener("click", () => {
            this.hide();
            onPlayAgain();
        });
    }

    show(summary: RunSummary, records: AllTimeRecords, reason: GameOverReason): void {
        const fmt = (n: number) => `$${n.toFixed(2)}`;
        const fmtSigned = (n: number) => (n >= 0 ? "+" : "-") + `$${Math.abs(n).toFixed(2)}`;

        document.getElementById("go-flavor")!.textContent = FLAVOR[reason];
        document.getElementById("go-run-spins")!.textContent = String(summary.runSpins);
        document.getElementById("go-run-peak")!.textContent = fmt(summary.peakBalance);
        document.getElementById("go-run-highest-win")!.textContent = fmt(summary.highestSingleWin);
        document.getElementById("go-run-net")!.textContent = fmtSigned(summary.runNet);
        document.getElementById("go-run-bailouts")!.textContent = String(summary.loansThisRun);
        document.getElementById("go-run-debt-clears")!.textContent = String(summary.debtClearedThisRun);

        document.getElementById("go-rec-highest-balance")!.textContent = fmt(records.highestBalance);
        document.getElementById("go-rec-highest-win")!.textContent = fmt(records.highestSingleWin);
        document.getElementById("go-rec-highest-net")!.textContent = fmtSigned(records.highestNetGain);
        document.getElementById("go-rec-bailouts")!.textContent = String(records.mostLoans);
        document.getElementById("go-rec-debt-clears")!.textContent = String(records.mostDebtClears);
        document.getElementById("go-rec-best-run")!.textContent = String(records.bestRunSpins);
        document.getElementById("go-rec-total-spins")!.textContent = String(records.totalSpins);

        this.el.classList.remove("hidden");
    }

    hide(): void {
        this.el.classList.add("hidden");
    }
}
