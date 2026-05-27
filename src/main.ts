import "./style.css";
import { CONFIG } from "./constants/config";
import { createEmptyGrid, randomizeGrid } from "./core/Grid";
import { detectAllPatterns } from "./core/PatternDetector";
import { calculatePayout } from "./core/RewardCalculator";
import { loadState, saveState } from "./core/PlayerState";
import { GridRenderer } from "./ui/GridRenderer";
import { Lever } from "./ui/Lever";
import { WinDisplay } from "./ui/WinDisplay";
import { BalanceDisplay } from "./ui/BalanceDisplay";
import { CouchCushion } from "./ui/CouchCushion";
import { SoundManager } from "./audio/SoundManager";
import { DENOMINATIONS } from "./constants/payouts";

// ─── State ────────────────────────────────────────────────────────────────────
const state = loadState(CONFIG.startingBalance, CONFIG.denomination);
let isSpinning = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const gridContainer = document.getElementById("grid-container")!;
const leverEl = document.getElementById("lever")!;
const balanceEl = document.getElementById("balance-value")!;
const lastWinEl = document.getElementById("last-win-value")!;
const spinsEl = document.getElementById("spins-value")!;
const winContainerEl = document.getElementById("win-display")!;
const winTextEl = document.getElementById("win-text")!;
const couchBtnEl = document.getElementById("couch-btn")!;
const couchProgressEl = document.getElementById("couch-progress")!;
const couchFoundEl = document.getElementById("couch-found")!;
const denomSelect = document.getElementById("denomination-select") as HTMLSelectElement;
const brokeMsg = document.getElementById("broke-msg")!;

// ─── Populate denomination selector ──────────────────────────────────────────
DENOMINATIONS.forEach((d) => {
    const opt = document.createElement("option");
    opt.value = String(d);
    opt.textContent = `$${d.toFixed(2)}`;
    if (d === state.denomination) opt.selected = true;
    denomSelect.appendChild(opt);
});

denomSelect.addEventListener("change", () => {
    state.denomination = parseFloat(denomSelect.value);
    saveState(state);
    updateUI();
});

// ─── Subsystems ───────────────────────────────────────────────────────────────
const sound = new SoundManager();
const gridRenderer = new GridRenderer(gridContainer);
const balanceDisp = new BalanceDisplay(balanceEl, lastWinEl, spinsEl);
const winDisp = new WinDisplay(winContainerEl, winTextEl);
const couch = new CouchCushion(couchBtnEl, couchProgressEl, couchFoundEl, onCouchComplete);
const lever = new Lever(leverEl, onLeverPull);

// ─── Initial render ───────────────────────────────────────────────────────────
gridRenderer.renderGrid(createEmptyGrid());
updateUI();

// ─── Spin logic ───────────────────────────────────────────────────────────────
function onLeverPull(): void {
    if (isSpinning) return;

    const cost = state.denomination;
    const balance = Math.round(state.balance * 100) / 100;

    if (balance < cost) {
        brokeMsg.classList.remove("hidden");
        return;
    }

    brokeMsg.classList.add("hidden");
    winDisp.hide();
    gridRenderer.clearHighlights();

    state.balance = Math.round((state.balance - cost) * 100) / 100;
    state.totalSpins += 1;
    saveState(state);
    updateUI();

    isSpinning = true;
    lever.disable();
    sound.play("spin");

    const newGrid = randomizeGrid(CONFIG.symbolWeights);

    gridRenderer.animateSpin(newGrid, () => {
        sound.stop("spin");
        isSpinning = false;
        lever.enable();

        const matches = detectAllPatterns(newGrid);
        const reward = calculatePayout(matches, state.denomination);

        if (reward.totalPayout > 0) {
            state.balance += reward.totalPayout;
            state.lastWin = reward.totalPayout;
            sound.playWinTier(reward.highestTier);
            gridRenderer.highlightMatches(matches);
            winDisp.show(reward, state.denomination);
        } else {
            state.lastWin = 0;
        }

        saveState(state);
        updateUI();
    });
}

function onCouchComplete(amount: number): void {
    state.balance += amount;
    state.lastWin = amount;
    sound.play("coin");
    saveState(state);
    updateUI();
}

function updateUI(): void {
    balanceDisp.update(state.balance, state.lastWin, state.totalSpins);
    const spinCost = state.denomination;
    const roundedBalance = Math.round(state.balance * 100) / 100;
    couch.setVisible(roundedBalance < spinCost);
    brokeMsg.classList.toggle("hidden", roundedBalance >= spinCost);
}
