import gsap from "gsap";
import { SoundManager } from "../audio/SoundManager";

export class Lever {
    private leverEl: HTMLElement;
    private knobEl: HTMLElement;
    private trackEl: HTMLElement;
    private isAnimating: boolean = false;
    private onPull: () => void;
    private sound: SoundManager;

    constructor(leverEl: HTMLElement, onPull: () => void, sound: SoundManager) {
        this.leverEl = leverEl;
        this.knobEl = leverEl.querySelector(".lever-knob") as HTMLElement;
        this.trackEl = leverEl.querySelector(".lever-track") as HTMLElement;
        this.onPull = onPull;
        this.sound = sound;

        this.leverEl.addEventListener("click", () => this.handleClick());
    }

    private handleClick(): void {
        if (this.isAnimating) return;
        this.animate();
    }

    private animate(): void {
        this.isAnimating = true;
        this.sound.play("lever");
        const tl = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.onPull();
            },
        });

        // Slide the track down + shrink its height by the same amount so the bottom stays pinned at the base
        tl.to(this.trackEl, { y: 80, height: 0, duration: 0.15, ease: "power2.in" }).to(this.trackEl, {
            y: 0,
            height: 60,
            duration: 0.35,
            ease: "elastic.out(1, 0.4)",
        });
    }

    disable(): void {
        this.leverEl.classList.add("lever--disabled");
    }

    enable(): void {
        this.leverEl.classList.remove("lever--disabled");
    }
}
