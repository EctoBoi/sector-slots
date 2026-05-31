import type { RewardResult } from "../core/RewardCalculator";
import type { PatternMatch } from "../core/PatternDetector";

export class WinDisplay {
    private tierEl: HTMLElement;
    private payoutEl: HTMLElement;
    private gridEl: HTMLElement;

    constructor(tierEl: HTMLElement, payoutEl: HTMLElement, gridEl: HTMLElement) {
        this.tierEl = tierEl;
        this.payoutEl = payoutEl;
        this.gridEl = gridEl;
    }

    show(reward: RewardResult, _denomination: number, matches: PatternMatch[]): void {
        // Update machine header
        this.tierEl.textContent = this.tierLabel(reward.highestTier);
        this.tierEl.dataset.tier = reward.highestTier;
        this.tierEl.dataset.active = "true";
        this.payoutEl.textContent = `+$${reward.totalPayout.toFixed(2)}`;

        // Remove labels from previous spin
        this.clearLabels();

        // Read live CSS grid metrics once — responsive-safe across breakpoints
        const gridStyle = getComputedStyle(this.gridEl);
        const tileSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--tile-size")) || 64;
        const tileGap = parseFloat(gridStyle.gap) || 4;
        const tilePad = parseFloat(gridStyle.paddingLeft) || 8;
        const gridW = this.gridEl.offsetWidth;
        const gridH = this.gridEl.offsetHeight;

        // Create a floating label centered over each enclosure
        matches.forEach((match, i) => {
            const b = reward.breakdown[i];
            if (!b) return;

            const label = document.createElement("div");
            label.className = "win-label";
            label.dataset.tier = match.tier;

            const multEl = document.createElement("div");
            multEl.className = "win-label__multiplier";
            multEl.textContent = `×${b.multiplier}`;

            const payEl = document.createElement("div");
            payEl.className = "win-label__payout";
            payEl.textContent = `$${b.payout.toFixed(2)}`;

            label.appendChild(multEl);
            label.appendChild(payEl);

            const avgRow = match.cells.reduce((s, [r]) => s + r, 0) / match.cells.length;
            const avgCol = match.cells.reduce((s, [, c]) => s + c, 0) / match.cells.length;
            const cx = tilePad + avgCol * (tileSize + tileGap) + tileSize / 2;
            const cy = tilePad + avgRow * (tileSize + tileGap) + tileSize / 2;

            label.style.left = `${cx}px`;
            label.style.top = `${cy}px`;

            this.gridEl.appendChild(label);

            // Shoot beams from every outer perimeter edge of this enclosure
            this.spawnBeams(match, i * 120, tileSize, tileGap, tilePad, gridW, gridH);
        });
    }

    reset(): void {
        this.tierEl.textContent = "NO WIN";
        this.tierEl.dataset.tier = "no_win";
        delete this.tierEl.dataset.active;
        this.payoutEl.textContent = "";
        this.clearLabels();
    }

    hide(): void {
        this.reset();
    }

    // ─── Beam helpers ─────────────────────────────────────────────────────────

    private spawnBeams(match: PatternMatch, delayMs: number, tileSize: number, tileGap: number, tilePad: number, gridW: number, gridH: number): void {
        const cells = new Set(match.cells.map(([r, c]) => `${r},${c}`));

        for (const [r, c] of match.cells) {
            const tileLeft = tilePad + c * (tileSize + tileGap);
            const tileTop = tilePad + r * (tileSize + tileGap);
            const cx = tileLeft + tileSize / 2; // x-centre of tile
            const cy = tileTop + tileSize / 2; // y-centre of tile

            // Top outer edge → two beams race left & right along the TOP border (y = 0)
            if (!cells.has(`${r - 1},${c}`)) {
                if (cx > 0) this.createBeam("h", 0, 0, cx, 2, "right center", delayMs, "right");
                if (cx < gridW) this.createBeam("h", cx, 0, gridW - cx, 2, "left center", delayMs, "left");
            }
            // Bottom outer edge → two beams along the BOTTOM border (y = gridH - 2)
            if (!cells.has(`${r + 1},${c}`)) {
                const by = gridH - 2;
                if (cx > 0) this.createBeam("h", 0, by, cx, 2, "right center", delayMs, "right");
                if (cx < gridW) this.createBeam("h", cx, by, gridW - cx, 2, "left center", delayMs, "left");
            }
            // Left outer edge → two beams race up & down along the LEFT border (x = 0)
            if (!cells.has(`${r},${c - 1}`)) {
                if (cy > 0) this.createBeam("v", 0, 0, 2, cy, "bottom center", delayMs, "bottom");
                if (cy < gridH) this.createBeam("v", 0, cy, 2, gridH - cy, "top center", delayMs, "top");
            }
            // Right outer edge → two beams along the RIGHT border (x = gridW - 2)
            if (!cells.has(`${r},${c + 1}`)) {
                const rx = gridW - 2;
                if (cy > 0) this.createBeam("v", rx, 0, 2, cy, "bottom center", delayMs, "bottom");
                if (cy < gridH) this.createBeam("v", rx, cy, 2, gridH - cy, "top center", delayMs, "top");
            }
        }
    }

    private createBeam(axis: "h" | "v", x: number, y: number, w: number, h: number, origin: string, delayMs: number, gradDir: string): void {
        const el = document.createElement("div");
        el.className = `win-beam win-beam--${axis}`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        el.style.transformOrigin = origin;
        el.style.animationDelay = `${delayMs}ms`;
        // Bright at the tile side, fades to transparent at the grid wall
        el.style.background = `linear-gradient(to ${gradDir}, transparent, var(--accent), #fff)`;
        this.gridEl.appendChild(el);
    }

    private clearLabels(): void {
        this.gridEl.querySelectorAll(".win-label, .win-beam").forEach((el) => el.remove());
    }

    private tierLabel(tier: string): string {
        switch (tier) {
            case "mega_jackpot":
                return "★ MEGA JACKPOT ★";
            case "jackpot":
                return "✩ JACKPOT ✩";
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
