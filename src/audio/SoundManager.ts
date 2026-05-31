import { Howl, Howler } from "howler";
import type { PatternMatch } from "../core/PatternDetector";

type SoundEvent = "spin" | "win_small" | "win_medium" | "win_large" | "win_jackpot" | "win_mega" | "coin" | "couch" | "lever";

export class SoundManager {
    private sounds: Partial<Record<SoundEvent, Howl>> = {};
    private enabled: boolean = true;

    constructor() {
        Howler.volume(0.5);
        this.sounds.spin = new Howl({ src: ["/sounds/spin.ogg", "/sounds/spin.mp3"] });
        this.sounds.win_small = new Howl({ src: ["/sounds/win_small.ogg", "/sounds/win_small.mp3"], volume: 0.7 });
        this.sounds.win_medium = new Howl({ src: ["/sounds/win_medium.ogg", "/sounds/win_medium.mp3"] });
        this.sounds.win_large = new Howl({ src: ["/sounds/win_large.ogg", "/sounds/win_large.mp3"], volume: 1.3 });
        this.sounds.win_jackpot = new Howl({ src: ["/sounds/win_jackpot.ogg", "/sounds/win_jackpot.mp3"], volume: 1.3 });
        this.sounds.win_mega = new Howl({ src: ["/sounds/win_mega.ogg", "/sounds/win_mega.mp3"], volume: 1.3 });
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

    /** Play a sound for each small/medium/large match in order, spaced by per-tier delays.
     *  If any match is jackpot or mega_jackpot, fall back to a single sound for the highest tier. */
    playWinSequence(matches: PatternMatch[]): void {
        const TIER_ORDER: Record<string, number> = { small: 0, medium: 1, large: 2, jackpot: 3, mega_jackpot: 4 };
        const DELAY_MS: Partial<Record<SoundEvent, number>> = {
            win_small: 170,
            win_medium: 144,
            win_large: 144,
        };

        const hasJackpot = matches.some((m) => m.tier === "jackpot" || m.tier === "mega_jackpot");
        if (hasJackpot) {
            const highest = matches.reduce((best, m) => (TIER_ORDER[m.tier] > TIER_ORDER[best.tier] ? m : best));
            this.playWinTier(highest.tier);
            return;
        }

        let cumulativeDelay = 0;
        for (const match of matches) {
            const event = `win_${match.tier}` as SoundEvent;
            const delay = cumulativeDelay;
            setTimeout(() => this.play(event), delay);
            cumulativeDelay += DELAY_MS[event] ?? 0;
        }
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
    }

    setVolume(vol: number): void {
        Howler.volume(Math.max(0, Math.min(1, vol)));
    }
}
