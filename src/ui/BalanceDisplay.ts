export class BalanceDisplay {
    private balanceEl: HTMLElement;
    private lastWinEl: HTMLElement;
    private spinsEl: HTMLElement;
    private highestBalanceEl: HTMLElement;

    constructor(balanceEl: HTMLElement, lastWinEl: HTMLElement, spinsEl: HTMLElement, highestBalanceEl: HTMLElement) {
        this.balanceEl = balanceEl;
        this.lastWinEl = lastWinEl;
        this.spinsEl = spinsEl;
        this.highestBalanceEl = highestBalanceEl;
    }

    update(balance: number, lastWin: number, totalSpins: number, highestBalance: number): void {
        this.balanceEl.textContent = `$${balance.toFixed(2)}`;
        this.lastWinEl.textContent = lastWin > 0 ? `+$${lastWin.toFixed(2)}` : "";
        this.spinsEl.textContent = `Spins: ${totalSpins}`;
        this.highestBalanceEl.textContent = `Highest: $${highestBalance.toFixed(2)}`;
    }
}
