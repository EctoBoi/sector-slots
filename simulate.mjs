// Sector Slots — Monte Carlo Simulation (Enclosure System)
// Run: node simulate.mjs [spins]

// ─── Symbols ──────────────────────────────────────────────────────────────────
const TOP = 0,
    RIGHT = 1,
    BOTTOM = 2,
    LEFT = 3; // BLANK = 4 (no walls)

const SYMBOL_WEIGHTS = [
    0.2325, // 0  Top Line
    0.2325, // 1  Right Line
    0.2325, // 2  Bottom Line
    0.2325, // 3  Left Line
    0.07, // 4  Blank  — 4×0.2325 + 0.07 = 1.00
];

function weightedRandom(weights) {
    let r = Math.random();
    for (let i = 0; i < weights.length; i++) {
        r -= weights[i];
        if (r <= 0) return i;
    }
    return weights.length - 1;
}

function randomizeGrid() {
    return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => weightedRandom(SYMBOL_WEIGHTS)));
}

// ─── Payouts ──────────────────────────────────────────────────────────────────
const PAYOUT_MULTIPLIERS = {
    small: 5,
    medium: 15,
    large: 50,
    jackpot: 200,
    mega_jackpot: 1000,
};

// [minimumCellCount, tier], checked in descending order
const ENCLOSURE_TIERS = [
    [19, "mega_jackpot"],
    [13, "jackpot"],
    [7, "large"],
    [3, "medium"],
    [1, "small"],
];

// ─── Enclosure Detection ──────────────────────────────────────────────────────
const DIRS = [
    [-1, 0],
    [1, 0],
    [0, 1],
    [0, -1],
];

function wallBetween(grid, r1, c1, r2, c2) {
    const dr = r2 - r1,
        dc = c2 - c1;
    if (dr === -1) return grid[r1][c1] === TOP || grid[r2][c2] === BOTTOM;
    if (dr === 1) return grid[r1][c1] === BOTTOM || grid[r2][c2] === TOP;
    if (dc === 1) return grid[r1][c1] === RIGHT || grid[r2][c2] === LEFT;
    if (dc === -1) return grid[r1][c1] === LEFT || grid[r2][c2] === RIGHT;
    return false;
}

function floodFillReachable(grid) {
    const reached = Array.from({ length: 5 }, () => Array(5).fill(false));
    const queue = [];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const open =
                (r === 0 && grid[r][c] !== TOP) || (r === 4 && grid[r][c] !== BOTTOM) || (c === 0 && grid[r][c] !== LEFT) || (c === 4 && grid[r][c] !== RIGHT);
            if (open && !reached[r][c]) {
                reached[r][c] = true;
                queue.push([r, c]);
            }
        }
    }

    let head = 0;
    while (head < queue.length) {
        const [r, c] = queue[head++];
        for (const [dr, dc] of DIRS) {
            const nr = r + dr,
                nc = c + dc;
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

function findEnclosedRegions(grid, reached) {
    const visited = Array.from({ length: 5 }, () => Array(5).fill(false));
    const regions = [];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            if (reached[r][c] || visited[r][c]) continue;
            const region = [];
            const queue = [[r, c]];
            visited[r][c] = true;
            let head = 0;
            while (head < queue.length) {
                const [cr, cc] = queue[head++];
                region.push([cr, cc]);
                for (const [dr, dc] of DIRS) {
                    const nr = cr + dr,
                        nc = cc + dc;
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

function tierForArea(area) {
    for (const [min, tier] of ENCLOSURE_TIERS) {
        if (area >= min) return tier;
    }
    return "small";
}

function detectEnclosures(grid) {
    const reached = floodFillReachable(grid);
    const regions = findEnclosedRegions(grid, reached);
    return regions.map((cells) => ({ area: cells.length, tier: tierForArea(cells.length) }));
}

// ─── Simulation ───────────────────────────────────────────────────────────────
const DENOMINATION = 1.0;
const SPINS = parseInt(process.argv[2] ?? "1000000", 10);

console.log(`\nRunning ${SPINS.toLocaleString()} spins at denomination $${DENOMINATION}...\n`);

let totalWagered = 0,
    totalPayout = 0,
    spinsWith = 0;
const tierHits = Object.fromEntries(Object.keys(PAYOUT_MULTIPLIERS).map((k) => [k, 0]));
const areaHistogram = {};

for (let i = 0; i < SPINS; i++) {
    const grid = randomizeGrid();
    const enclosures = detectEnclosures(grid);
    let spinPayout = 0;
    for (const enc of enclosures) {
        const mult = PAYOUT_MULTIPLIERS[enc.tier];
        spinPayout += mult * DENOMINATION;
        tierHits[enc.tier]++;
        areaHistogram[enc.area] = (areaHistogram[enc.area] ?? 0) + 1;
    }
    totalWagered += DENOMINATION;
    totalPayout += spinPayout;
    if (spinPayout > 0) spinsWith++;
}

const rtp = (totalPayout / totalWagered) * 100;
const houseEdge = 100 - rtp;
const hitRate = (spinsWith / SPINS) * 100;

// ─── Report ───────────────────────────────────────────────────────────────────
const line = "─".repeat(60);
console.log(line);
console.log("  SECTOR SLOTS — ENCLOSURE SIMULATION RESULTS");
console.log(line);
console.log(`  Spins simulated : ${SPINS.toLocaleString()}`);
console.log(`  Total wagered   : $${totalWagered.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
console.log(`  Total paid out  : $${totalPayout.toFixed(2)}`);
console.log(`  RTP (return)    : ${rtp.toFixed(3)}%`);
console.log(`  House edge      : ${houseEdge.toFixed(3)}%`);
console.log(`  Hit rate        : ${hitRate.toFixed(2)}% of spins pay something`);
console.log(line);

console.log("\n  WINS BY TIER\n");
const tierOrder = ["small", "medium", "large", "jackpot", "mega_jackpot"];
for (const tier of tierOrder) {
    const hits = tierHits[tier];
    const freq = ((hits / SPINS) * 100).toFixed(4);
    const avg = hits > 0 ? `1 in ${(SPINS / hits).toFixed(0)}` : "never";
    const contrib = (((hits * PAYOUT_MULTIPLIERS[tier] * DENOMINATION) / totalWagered) * 100).toFixed(3);
    console.log(
        `  ${tier.padEnd(14)} x${String(PAYOUT_MULTIPLIERS[tier]).padStart(4)}  |  hits: ${String(hits).padStart(7)}  freq: ${freq}%  odds: ${avg.padStart(12)}  RTP contrib: ${contrib}%`,
    );
}

console.log("\n  ENCLOSURE SIZE HISTOGRAM\n");
const sortedAreas = Object.keys(areaHistogram)
    .map(Number)
    .sort((a, b) => a - b);
for (const area of sortedAreas) {
    const count = areaHistogram[area];
    const freq = ((count / SPINS) * 100).toFixed(4);
    const tier = tierForArea(area);
    console.log(`  area ${String(area).padStart(2)} (${tier.padEnd(12)}) | ${String(count).padStart(8)} hits  ${freq}%`);
}

console.log(`\n${line}\n`);
