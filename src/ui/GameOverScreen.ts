import type { AllTimeRecords } from "../core/PlayerState";

export type GameOverReason = "ceiling" | "couch";

export interface RunSummary {
    runSpins: number;
    peakBalance: number;
    loansThisRun: number;
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

        document.getElementById("go-flavor")!.textContent = FLAVOR[reason];
        document.getElementById("go-run-spins")!.textContent = String(summary.runSpins);
        document.getElementById("go-run-peak")!.textContent = fmt(summary.peakBalance);
        document.getElementById("go-run-bailouts")!.textContent = String(summary.loansThisRun);

        document.getElementById("go-rec-highest-balance")!.textContent = fmt(records.highestBalance);
        document.getElementById("go-rec-highest-win")!.textContent = fmt(records.highestSingleWin);
        const net = records.highestNetGain;
        document.getElementById("go-rec-highest-net")!.textContent = (net >= 0 ? "+" : "") + fmt(net);
        document.getElementById("go-rec-bailouts")!.textContent = String(records.mostLoans);
        document.getElementById("go-rec-best-run")!.textContent = String(records.bestRunSpins);
        document.getElementById("go-rec-total-spins")!.textContent = String(records.totalSpins);

        this.el.classList.remove("hidden");
    }

    hide(): void {
        this.el.classList.add("hidden");
    }
}
