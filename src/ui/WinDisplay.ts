import type { RewardResult } from "../core/RewardCalculator";

export class WinDisplay {
    private containerEl: HTMLElement;
    private winTextEl: HTMLElement;

    constructor(containerEl: HTMLElement, winTextEl: HTMLElement) {
        this.containerEl = containerEl;
        this.winTextEl = winTextEl;
    }

    show(reward: RewardResult, _denomination: number): void {
        if (reward.totalPayout === 0) {
            this.hide();
            return;
        }

        const lines = reward.breakdown.map((b) => `${b.name}: ×${b.multiplier} = $${b.payout.toFixed(2)}`);

        const tierLabel = this.tierEmoji(reward.highestTier);
        this.winTextEl.innerHTML = `
      <div class="win-tier">${tierLabel}</div>
      <div class="win-total">+$${reward.totalPayout.toFixed(2)}</div>
      <div class="win-breakdown">${lines.join("<br>")}</div>
    `;
        this.containerEl.classList.remove("hidden");
    }

    hide(): void {
        this.containerEl.classList.add("hidden");
        this.winTextEl.innerHTML = "";
    }

    private tierEmoji(tier: string): string {
        switch (tier) {
            case "mega_jackpot":
                return "★ MEGA JACKPOT ★";
            case "jackpot":
                return "✦ JACKPOT ✦";
            case "large":
                return "◆ BIG WIN ◆";
            case "medium":
                return "◇ WIN ◇";
            case "small":
                return "· WIN ·";
            default:
                return "· WIN ·";
        }
    }
}
