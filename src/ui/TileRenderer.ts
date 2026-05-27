import { SYMBOLS } from "../constants/symbols";

const TILE_BORDER_WIDTH = "3px";
const TILE_BORDER_STYLE = "solid";

export function applyBorders(el: HTMLElement, borders: number): void {
    const T = 1,
        R = 2,
        B = 4,
        L = 8;
    const color = "var(--tile-border-color)";
    el.style.borderTop = borders & T ? `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} ${color}` : `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} transparent`;
    el.style.borderRight = borders & R ? `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} ${color}` : `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} transparent`;
    el.style.borderBottom = borders & B ? `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} ${color}` : `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} transparent`;
    el.style.borderLeft = borders & L ? `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} ${color}` : `${TILE_BORDER_WIDTH} ${TILE_BORDER_STYLE} transparent`;
}

export function createTileElement(): HTMLElement {
    const el = document.createElement("div");
    el.className = "tile";
    return el;
}

export function updateTileSymbol(el: HTMLElement, symbolId: number): void {
    const symbol = SYMBOLS[symbolId];
    if (!symbol) return;
    applyBorders(el, symbol.borders);
    el.dataset.symbolId = String(symbolId);
}

export function setTileHighlight(el: HTMLElement, highlighted: boolean): void {
    if (highlighted) {
        el.classList.add("tile--highlight");
    } else {
        el.classList.remove("tile--highlight");
    }
}
