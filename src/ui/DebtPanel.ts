import type { PlayerState, DebtRecord } from "../core/PlayerState";
import { canTakeLoan, getTotalDebt, getLoanTier, repayDebt, takeLoan } from "../core/DebtManager";
import { saveState } from "../core/PlayerState";
import { DEBT_CEILING } from "../constants/config";

export class DebtPanel {
    private panelEl: HTMLElement;
    private backdropEl: HTMLElement;
    private listEl: HTMLElement;
    private totalEl: HTMLElement;
    private loanBtn: HTMLButtonElement;
    private state: PlayerState;
    private onStateChange: () => void;
    private onBailout: () => void;

    constructor(panelEl: HTMLElement, backdropEl: HTMLElement, state: PlayerState, onStateChange: () => void, onBailout: () => void) {
        this.panelEl = panelEl;
        this.backdropEl = backdropEl;
        this.state = state;
        this.onStateChange = onStateChange;
        this.onBailout = onBailout;

        this.listEl = panelEl.querySelector("#debt-list")!;
        this.totalEl = panelEl.querySelector("#debt-total")!;
        this.loanBtn = panelEl.querySelector("#loan-btn")!;

        document.getElementById("debt-panel-close")!.addEventListener("click", () => this.close());
        this.backdropEl.addEventListener("click", () => this.close());

        this.loanBtn.addEventListener("click", () => {
            if (!canTakeLoan(this.state)) return;
            takeLoan(this.state);
            saveState(this.state);
            this.onBailout();
            this.onStateChange();
            this.render();
        });
    }

    open(): void {
        this.render();
        this.panelEl.classList.remove("hidden");
        this.panelEl.classList.add("open");
        this.backdropEl.classList.remove("hidden");
    }

    close(): void {
        this.panelEl.classList.remove("open");
        this.backdropEl.classList.add("hidden");
        // Re-add hidden after transition so CSS rule keeps it off-screen
        setTimeout(() => {
            if (!this.panelEl.classList.contains("open")) {
                this.panelEl.classList.add("hidden");
            }
        }, 320);
    }

    render(): void {
        this.listEl.innerHTML = "";

        if (this.state.debts.length === 0) {
            const empty = document.createElement("p");
            empty.className = "debt-empty";
            empty.textContent = "No outstanding debts.";
            this.listEl.appendChild(empty);
        } else {
            for (const debt of this.state.debts) {
                this.listEl.appendChild(this.buildDebtRow(debt));
            }
        }

        const total = getTotalDebt(this.state);
        this.totalEl.textContent = `Total: $${total.toFixed(2)} / $${DEBT_CEILING.toFixed(2)}`;

        const fraction = total / DEBT_CEILING;
        this.totalEl.classList.remove("debt-total--warn", "debt-total--danger");
        if (fraction > 0.66) this.totalEl.classList.add("debt-total--danger");
        else if (fraction > 0.33) this.totalEl.classList.add("debt-total--warn");

        const loanOk = canTakeLoan(this.state);
        this.loanBtn.disabled = !loanOk;
        this.loanBtn.classList.toggle("loan-btn--blocked", !loanOk);
        if (loanOk) {
            const next = getLoanTier(this.state.nextLoanIndex);
            this.loanBtn.textContent = `Request Loan — $${next.amount} @ ${(next.rate * 100).toFixed(1)}%/spin`;
        } else {
            this.loanBtn.textContent = "Debt Too High To Request Loan";
        }
    }

    private buildDebtRow(debt: DebtRecord): HTMLElement {
        const row = document.createElement("div");
        row.className = "debt-row";

        const fraction = debt.currentBalance / DEBT_CEILING;
        const balClass = fraction > 0.33 ? "debt-balance--danger" : fraction > 0.15 ? "debt-balance--warn" : "debt-balance--ok";

        row.innerHTML = `
            <div class="debt-row-header">
                <span class="debt-badge">Loan #${debt.id}</span>
                <span class="debt-rate">${(debt.rate * 100).toFixed(1)}%<span class="debt-rate-unit">/spin</span></span>
            </div>
            <div class="debt-row-balance ${balClass}">$${debt.currentBalance.toFixed(2)}</div>
            <div class="debt-repay-row">
                <input type="text" inputmode="decimal" class="debt-repay-input" placeholder="$0.00" />
                <button class="debt-repay-max-btn">Max</button>
                <button class="debt-repay-btn">Pay</button>
            </div>
        `;

        const input = row.querySelector(".debt-repay-input") as HTMLInputElement;
        const maxBtn = row.querySelector(".debt-repay-max-btn") as HTMLButtonElement;
        const btn = row.querySelector(".debt-repay-btn") as HTMLButtonElement;

        maxBtn.addEventListener("click", () => {
            const cap = Math.round(Math.min(debt.currentBalance, this.state.balance) * 100) / 100;
            input.value = cap.toFixed(2);
        });

        input.addEventListener("input", () => {
            const val = parseFloat(input.value);
            if (!isNaN(val)) {
                const cap = Math.round(Math.min(debt.currentBalance, this.state.balance) * 100) / 100;
                if (val > cap) input.value = cap.toFixed(2);
            }
        });

        btn.addEventListener("click", () => {
            const amount = parseFloat(input.value);
            if (isNaN(amount) || amount <= 0) return;
            repayDebt(this.state, debt.id, amount);
            saveState(this.state);
            this.render();
            this.onStateChange();
        });

        return row;
    }
}
