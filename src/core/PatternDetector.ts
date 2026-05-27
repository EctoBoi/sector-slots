import type { GridData } from "./Grid";
import { ENCLOSURE_TIERS } from "../constants/patterns";
import type { PayoutTier } from "../constants/patterns";
import { SYMBOLS, Side } from "../constants/symbols";

export interface PatternMatch {
    cells: [number, number][];
    tier: PayoutTier;
    area: number;
}

const DIRS: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1],
];

/** Returns true if there is a wall on the shared edge between two adjacent cells (OR model). */
function wallBetween(grid: GridData, r1: number, c1: number, r2: number, c2: number): boolean {
    const b1 = SYMBOLS[grid[r1][c1]].borders;
    const b2 = SYMBOLS[grid[r2][c2]].borders;
    const dr = r2 - r1;
    const dc = c2 - c1;
    if (dr === -1) return !!(b1 & Side.T) || !!(b2 & Side.B);
    if (dr === 1) return !!(b1 & Side.B) || !!(b2 & Side.T);
    if (dc === 1) return !!(b1 & Side.R) || !!(b2 & Side.L);
    if (dc === -1) return !!(b1 & Side.L) || !!(b2 & Side.R);
    return false;
}

/**
 * Flood-fill from outside the grid.
 * A grid-edge cell is reachable from outside if it has no wall on its boundary-facing side.
 * Returns a 5x5 boolean grid: true = reachable from outside.
 */
function floodFillReachable(grid: GridData): boolean[][] {
    const reached: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
    const queue: [number, number][] = [];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const b = SYMBOLS[grid[r][c]].borders;
            const openToBoundary = (r === 0 && !(b & Side.T)) || (r === 4 && !(b & Side.B)) || (c === 0 && !(b & Side.L)) || (c === 4 && !(b & Side.R));
            if (openToBoundary && !reached[r][c]) {
                reached[r][c] = true;
                queue.push([r, c]);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const [r, c] = queue[head++];
        for (const [dr, dc] of DIRS) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) continue;
            if (reached[nr][nc]) continue;
            if (!wallBetween(grid, r, c, nr, nc)) {
                reached[nr][nc] = true;
                queue.push([nr, nc]);
            }
        }
    }

    return reached;
}

/** Finds connected regions of enclosed (unreachable) cells. */
function findEnclosedRegions(grid: GridData, reached: boolean[][]): [number, number][][] {
    const visited: boolean[][] = Array.from({ length: 5 }, () => Array(5).fill(false));
    const regions: [number, number][][] = [];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (reached[r][c] || visited[r][c]) continue;

            const region: [number, number][] = [];
            const queue: [number, number][] = [[r, c]];
            visited[r][c] = true;
            let head = 0;

            while (head < queue.length) {
                const [cr, cc] = queue[head++];
                region.push([cr, cc]);
                for (const [dr, dc] of DIRS) {
                    const nr = cr + dr;
                    const nc = cc + dc;
                    if (nr < 0 || nr >= 5 || nc < 0 || nc >= 5) continue;
                    if (reached[nr][nc] || visited[nr][nc]) continue;
                    if (wallBetween(grid, cr, cc, nr, nc)) continue;
                    visited[nr][nc] = true;
                    queue.push([nr, nc]);
                }
            }

            regions.push(region);
        }
    }

    return regions;
}

function tierForArea(area: number): PayoutTier {
    for (const [min, tier] of ENCLOSURE_TIERS) {
        if (area >= min) return tier;
    }
    return "small";
}

/**
 * Main export — detects all enclosed regions in the grid.
 * Each region pays out independently based on its area.
 */
export function detectAllPatterns(grid: GridData): PatternMatch[] {
    const reached = floodFillReachable(grid);
    const regions = findEnclosedRegions(grid, reached);
    return regions.map((cells) => ({
        cells,
        area: cells.length,
        tier: tierForArea(cells.length),
    }));
}
