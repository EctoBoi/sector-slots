import { weightedRandom } from "../constants/symbols";

export type GridData = number[][]; // 5×5, each cell is a symbol id (0–6)

export function createEmptyGrid(): GridData {
    return Array.from({ length: 5 }, () => Array(5).fill(6)); // 6 = Blank
}

export function randomizeGrid(weights: number[]): GridData {
    return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => weightedRandom(weights)));
}
