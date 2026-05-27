import { Howl } from "howler";

type SoundEvent = "spin" | "win_small" | "win_medium" | "win_large" | "win_jackpot" | "win_mega" | "coin" | "couch" | "lever";

export class SoundManager {
    private sounds: Partial<Record<SoundEvent, Howl>> = {};
    private enabled: boolean = true;

    constructor() {
        this.sounds.spin = new Howl({ src: ["/sounds/spin.ogg", "/sounds/spin.mp3"] });
        this.sounds.win_small = new Howl({ src: ["/sounds/win_small.ogg", "/sounds/win_small.mp3"], volume: 0.5 });
        this.sounds.win_medium = new Howl({ src: ["/sounds/win_medium.ogg", "/sounds/win_medium.mp3"] });
        this.sounds.win_large = new Howl({ src: ["/sounds/win_large.ogg", "/sounds/win_large.mp3"] });
        this.sounds.win_jackpot = new Howl({ src: ["/sounds/win_jackpot.ogg", "/sounds/win_jackpot.mp3"] });
        this.sounds.win_mega = new Howl({ src: ["/sounds/win_mega.ogg", "/sounds/win_mega.mp3"] });
        this.sounds.coin = new Howl({ src: ["/sounds/coin.ogg", "/sounds/coin.mp3"] });
        this.sounds.couch = new Howl({ src: ["/sounds/couch.ogg", "/sounds/couch.mp3"] });
        this.sounds.lever = new Howl({ src: ["/sounds/lever.ogg", "/sounds/lever.mp3"] });
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
                this.play("win_small");
                break;
        }
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
    }
}
