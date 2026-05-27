import { Howl } from "howler";

type SoundEvent = "spin" | "win_minor" | "win_small" | "win_medium" | "win_large" | "win_jackpot" | "win_mega" | "coin" | "couch";

// Placeholder sound manager — real .ogg/.mp3 assets are out of scope for initial build.
// Methods are no-ops until audio assets are added to public/sounds/.
export class SoundManager {
    private sounds: Partial<Record<SoundEvent, Howl>> = {};
    private enabled: boolean = true;

    constructor() {
        // Uncomment and fill in paths once assets are available:
        // this.sounds.spin = new Howl({ src: ['/sounds/spin.ogg', '/sounds/spin.mp3'], loop: true });
        // this.sounds.coin = new Howl({ src: ['/sounds/coin.ogg', '/sounds/coin.mp3'] });
        // etc.
    }

    play(event: SoundEvent): void {
        if (!this.enabled) return;
        this.sounds[event]?.play();
    }

    stop(event: SoundEvent): void {
        this.sounds[event]?.stop();
    }

    playWinTier(tier: string): void {
        switch (tier) {
            case "mega_jackpot":
                this.play("win_mega");
                break;
            case "jackpot":
                this.play("win_jackpot");
                break;
            case "large":
                this.play("win_large");
                break;
            case "medium":
                this.play("win_medium");
                break;
            case "small":
                this.play("win_small");
                break;
            default:
                this.play("win_minor");
                break;
        }
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
    }
}
