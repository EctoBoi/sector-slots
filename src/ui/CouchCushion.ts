import { SoundManager } from "../audio/SoundManager";
import { CONFIG } from "../constants/config";

const SEARCH_DURATION_MS = CONFIG.couchSearch.durationMs;
const MIN_FIND = CONFIG.couchSearch.minFind;
const MAX_FIND = CONFIG.couchSearch.maxFind;

// Failure chance by search count (1-based). Searches 1-2 always succeed.
const FAILURE_CHANCE: Record<number, number> = { 3: 0.2, 4: 0.4 };
const FAILURE_CHANCE_MAX = 0.6;

export class CouchCushion {
    private buttonEl: HTMLElement;
    private progressEl: HTMLElement;
    private foundEl: HTMLElement;
    private isSearching: boolean = false;
    private onComplete: (amount: number) => void;
    private onFail: () => void;
    private intervalId: number | null = null;
    private startTime: number = 0;
    private sound: SoundManager;
    private searchCount: number = 0;

    constructor(
        buttonEl: HTMLElement,
        progressEl: HTMLElement,
        foundEl: HTMLElement,
        onComplete: (amount: number) => void,
        onFail: () => void,
        sound: SoundManager,
    ) {
        this.buttonEl = buttonEl;
        this.progressEl = progressEl;
        this.foundEl = foundEl;
        this.onComplete = onComplete;
        this.onFail = onFail;
        this.sound = sound;

        this.buttonEl.addEventListener("click", () => this.startSearch());
    }

    resetSearchCount(): void {
        this.searchCount = 0;
    }

    private getFailureChance(): number {
        if (this.searchCount <= 2) return 0;
        return FAILURE_CHANCE[this.searchCount] ?? FAILURE_CHANCE_MAX;
    }

    private startSearch(): void {
        if (this.isSearching) return;
        this.isSearching = true;
        this.sound.play("couch");
        this.buttonEl.classList.add("hidden");
        this.progressEl.classList.remove("hidden");
        this.foundEl.classList.add("hidden");
        this.startTime = performance.now();

        this.intervalId = window.setInterval(() => this.tick(), 100);
    }

    private tick(): void {
        const elapsed = performance.now() - this.startTime;
        const pct = Math.min(elapsed / SEARCH_DURATION_MS, 1);

        const bar = this.progressEl.querySelector(".couch-bar") as HTMLElement | null;
        if (bar) bar.style.width = `${pct * 100}%`;

        if (pct >= 1) {
            this.finish();
        }
    }

    private finish(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        const bar = this.progressEl.querySelector(".couch-bar") as HTMLElement | null;
        if (bar) bar.style.width = "0%";
        this.progressEl.classList.add("hidden");
        this.isSearching = false;
        this.sound.stop("couch");

        this.searchCount++;
        const failChance = this.getFailureChance();

        if (failChance > 0 && Math.random() < failChance) {
            this.foundEl.textContent = "Found nothing…";
            this.foundEl.classList.remove("hidden");
            setTimeout(() => {
                this.foundEl.classList.add("hidden");
                this.onFail();
            }, 1200);
            return;
        }

        // Round to nearest $0.25
        const raw = MIN_FIND + Math.random() * (MAX_FIND - MIN_FIND);
        const amount = Math.round(raw / 0.25) * 0.25;

        this.foundEl.textContent = `Found $${amount.toFixed(2)}!`;
        this.foundEl.classList.remove("hidden");

        this.sound.play("coin");

        setTimeout(() => {
            this.foundEl.classList.add("hidden");
            this.onComplete(amount);
        }, 1000);
    }

    setVisible(visible: boolean): void {
        if (visible) {
            if (!this.isSearching) {
                this.buttonEl.classList.remove("hidden");
            }
        } else {
            this.buttonEl.classList.add("hidden");
            this.progressEl.classList.add("hidden");
        }
    }
}
