// Sector Slots — Monte Carlo Simulation (Enclosure System)
// Run: node simulate.mjs [spins]

// ─── Symbols ──────────────────────────────────────────────────────────────────
// id: 0=TL Corner, 1=TR Corner, 2=BR Corner, 3=BL Corner,
//     4=V Tunnel, 5=H Tunnel, 6=Blank
// borders bitmask: T=1, R=2, B=4, L=8
const BORDERS = [
    1 | 8, // 0  TL Corner  (T+L)
    1 | 2, // 1  TR Corner  (T+R)
    4 | 2, // 2  BR Corner  (B+R)
    4 | 8, // 3  BL Corner  (B+L)
    1 | 4, // 4  V Tunnel   (T+B)
    8 | 2, // 5  H Tunnel   (L+R)
    0, // 6  Blank
];

const SYMBOL_WEIGHTS = [
    0.079, // 0  TL Corner
    0.079, // 1  TR Corner
    0.078, // 2  BR Corner
    0.078, // 3  BL Corner
    0.078, // 4  V Tunnel
    0.078, // 5  H Tunnel
    0.53, // 6  Blank
];

function weightedRandom(weights) {
    const r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) return i;
    }
    return weights.length - 1;
}

function randomizeGrid() {
    return Array.from({ length: 5 }, () => Array.from({ length: 5 }, () => weightedRandom(SYMBOL_WEIGHTS)));
}

// ─── Payouts ──────────────────────────────────────────────────────────────────
const PAYOUT_MULTIPLIERS = {
    small: 1.5,
    medium: 3,
    large: 15,
    jackpot: 100,
    mega_jackpot: 1000,
};

// [minimumCellCount, tier], checked in descending order
const ENCLOSURE_TIERS = [
    [12, "mega_jackpot"],
    [9, "jackpot"],
    [5, "large"],
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
    const b1 = BORDERS[grid[r1][c1]],
        b2 = BORDERS[grid[r2][c2]];
    if (dr === -1) return !!(b1 & 1) || !!(b2 & 4); // T or neighbor B
    if (dr === 1) return !!(b1 & 4) || !!(b2 & 1); // B or neighbor T
    if (dc === 1) return !!(b1 & 2) || !!(b2 & 8); // R or neighbor L
    if (dc === -1) return !!(b1 & 8) || !!(b2 & 2); // L or neighbor R
    return false;
}

function floodFillReachable(grid) {
    const reached = Array.from({ length: 5 }, () => Array(5).fill(false));
    const queue = [];

    for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
            const b = BORDERS[grid[r][c]];
            const open = (r === 0 && !(b & 1)) || (r === 4 && !(b & 4)) || (c === 0 && !(b & 8)) || (c === 4 && !(b & 2));
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
