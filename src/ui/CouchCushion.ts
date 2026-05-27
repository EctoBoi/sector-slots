import { SoundManager } from "../audio/SoundManager";

const SEARCH_DURATION_MS = 10_000;
const MIN_FIND = 1.0;
const MAX_FIND = 5.0;

export class CouchCushion {
    private buttonEl: HTMLElement;
    private progressEl: HTMLElement;
    private foundEl: HTMLElement;
    private isSearching: boolean = false;
    private onComplete: (amount: number) => void;
    private intervalId: number | null = null;
    private startTime: number = 0;
    private sound: SoundManager;

    constructor(buttonEl: HTMLElement, progressEl: HTMLElement, foundEl: HTMLElement, onComplete: (amount: number) => void, sound: SoundManager) {
        this.buttonEl = buttonEl;
        this.progressEl = progressEl;
        this.foundEl = foundEl;
        this.onComplete = onComplete;
        this.sound = sound;

        this.buttonEl.addEventListener("click", () => this.startSearch());
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
        this.progressEl.classList.add("hidden");
        this.isSearching = false;

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
            this.buttonEl.classList.remove("hidden");
        } else {
            this.buttonEl.classList.add("hidden");
            this.progressEl.classList.add("hidden");
        }
    }
}
