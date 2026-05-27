export class BalanceDisplay {
    private balanceEl: HTMLElement;
    private lastWinEl: HTMLElement;
    private spinsEl: HTMLElement;

    constructor(balanceEl: HTMLElement, lastWinEl: HTMLElement, spinsEl: HTMLElement) {
        this.balanceEl = balanceEl;
        this.lastWinEl = lastWinEl;
        this.spinsEl = spinsEl;
    }

    update(balance: number, lastWin: number, totalSpins: number): void {
        this.balanceEl.textContent = `$${balance.toFixed(2)}`;
        this.lastWinEl.textContent = lastWin > 0 ? `+$${lastWin.toFixed(2)}` : "";
        this.spinsEl.textContent = `Spins: ${totalSpins}`;
    }
}
