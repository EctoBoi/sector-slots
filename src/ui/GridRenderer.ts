import gsap from "gsap";
import type { GridData } from "../core/Grid";
import type { PatternMatch } from "../core/PatternDetector";
import { createTileElement, updateTileSymbol, setTileHighlight } from "./TileRenderer";
import { CONFIG } from "../constants/config";

export class GridRenderer {
    private container: HTMLElement;
    private tileEls: HTMLElement[][];

    constructor(container: HTMLElement) {
        this.container = container;
        this.tileEls = [];
        this.buildGrid();
    }

    private buildGrid(): void {
        this.container.innerHTML = "";
        this.tileEls = [];

        for (let row = 0; row < 5; row++) {
            const rowEls: HTMLElement[] = [];
            for (let col = 0; col < 5; col++) {
                const el = createTileElement();
                this.container.appendChild(el);
                rowEls.push(el);
            }
            this.tileEls.push(rowEls);
        }
    }

    renderGrid(grid: GridData): void {
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                updateTileSymbol(this.tileEls[row][col], grid[row][col]);
                setTileHighlight(this.tileEls[row][col], false);
            }
        }
    }

    animateSpin(newGrid: GridData, onComplete: () => void): void {
        const tl = gsap.timeline({ onComplete });
        const { spinStaggerPerColumn, flipDuration } = CONFIG.animation;

        for (let col = 0; col < 5; col++) {
            for (let row = 0; row < 5; row++) {
                const el = this.tileEls[row][col];
                const capturedRow = row;
                const capturedCol = col;
                const staggerTime = col * spinStaggerPerColumn;

                tl.to(
                    el,
                    {
                        scaleY: 0,
                        duration: flipDuration,
                        onComplete: () => {
                            updateTileSymbol(el, newGrid[capturedRow][capturedCol]);
                        },
                    },
                    staggerTime,
                ).to(
                    el,
                    {
                        scaleY: 1,
                        duration: flipDuration,
                    },
                    staggerTime + flipDuration,
                );
            }
        }
    }

    highlightMatches(matches: PatternMatch[]): void {
        // Clear all highlights first
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                setTileHighlight(this.tileEls[row][col], false);
            }
        }

        const highlightedCells = new Set<string>();
        for (const match of matches) {
            for (const [r, c] of match.cells) {
                highlightedCells.add(`${r},${c}`);
            }
        }

        for (const key of highlightedCells) {
            const [r, c] = key.split(",").map(Number);
            setTileHighlight(this.tileEls[r][c], true);
        }
    }

    clearHighlights(): void {
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                setTileHighlight(this.tileEls[row][col], false);
            }
        }
    }
}
