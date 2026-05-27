import gsap from "gsap";

export class Lever {
    private leverEl: HTMLElement;
    private knobEl: HTMLElement;
    private isAnimating: boolean = false;
    private onPull: () => void;

    constructor(leverEl: HTMLElement, onPull: () => void) {
        this.leverEl = leverEl;
        this.knobEl = leverEl.querySelector(".lever-knob") as HTMLElement;
        this.onPull = onPull;

        this.leverEl.addEventListener("click", () => this.handleClick());
    }

    private handleClick(): void {
        if (this.isAnimating) return;
        this.animate();
    }

    private animate(): void {
        this.isAnimating = true;
        const tl = gsap.timeline({
            onComplete: () => {
                this.isAnimating = false;
                this.onPull();
            },
        });

        // Pull down then spring back
        tl.to(this.knobEl, { y: 60, duration: 0.15, ease: "power2.in" }).to(this.knobEl, { y: 0, duration: 0.35, ease: "elastic.out(1, 0.4)" });
    }

    disable(): void {
        this.leverEl.classList.add("lever--disabled");
    }

    enable(): void {
        this.leverEl.classList.remove("lever--disabled");
    }
}
