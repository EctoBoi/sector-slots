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
const highestBalanceEl = document.getElementById("highest-balance-value")!;
const winContainerEl = document.getElementById("win-display")!;
const winTextEl = document.getElementById("win-text")!;
const couchBtnEl = document.getElementById("couch-btn")!;
const couchProgressEl = document.getElementById("couch-progress")!;
const couchFoundEl = document.getElementById("couch-found")!;
const denomValueEl = document.getElementById("denom-value")!;
const denomDecBtn = document.getElementById("denom-dec") as HTMLButtonElement;
const denomIncBtn = document.getElementById("denom-inc") as HTMLButtonElement;
const brokeMsg = document.getElementById("broke-msg")!;
const rulesBtn = document.getElementById("rules-btn")!;
const rulesModal = document.getElementById("rules-modal")!;
const rulesClose = document.getElementById("rules-close")!;
const rulesOverlay = rulesModal.querySelector(".rules-overlay")!;
const statsWonEl = document.getElementById("stats-won")!;
const statsLostEl = document.getElementById("stats-lost")!;
const statsNetEl = document.getElementById("stats-net")!;

// ─── Rules modal ──────────────────────────────────────────────────────────────
rulesBtn.addEventListener("click", () => rulesModal.classList.remove("hidden"));
rulesClose.addEventListener("click", () => rulesModal.classList.add("hidden"));
rulesOverlay.addEventListener("click", () => rulesModal.classList.add("hidden"));
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") rulesModal.classList.add("hidden");
});

// ─── Denomination stepper ─────────────────────────────────────────────────────
let denomIndex = Math.max(0, DENOMINATIONS.indexOf(state.denomination));

function updateDenomUI(): void {
    denomValueEl.textContent = `$${DENOMINATIONS[denomIndex].toFixed(2)}`;
    denomDecBtn.disabled = denomIndex === 0;
    denomIncBtn.disabled = denomIndex === DENOMINATIONS.length - 1;
}

denomDecBtn.addEventListener("click", () => {
    if (denomIndex > 0) {
        denomIndex--;
        state.denomination = DENOMINATIONS[denomIndex];
        saveState(state);
        updateDenomUI();
        updateUI();
    }
});

denomIncBtn.addEventListener("click", () => {
    if (denomIndex < DENOMINATIONS.length - 1) {
        denomIndex++;
        state.denomination = DENOMINATIONS[denomIndex];
        saveState(state);
        updateDenomUI();
        updateUI();
    }
});

updateDenomUI();

// ─── Subsystems ───────────────────────────────────────────────────────────────
const sound = new SoundManager();
const gridRenderer = new GridRenderer(gridContainer);
const balanceDisp = new BalanceDisplay(balanceEl, lastWinEl, spinsEl, highestBalanceEl);
const winDisp = new WinDisplay(winContainerEl, winTextEl);
const couch = new CouchCushion(couchBtnEl, couchProgressEl, couchFoundEl, onCouchComplete, sound);
const lever = new Lever(leverEl, onLeverPull, sound);

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
    gridRenderer.clearHighlights();

    state.balance = Math.round((state.balance - cost) * 100) / 100;
    state.totalSpins += 1;
    state.totalAmountLost = Math.round((state.totalAmountLost + cost) * 100) / 100;
    saveState(state);
    updateUI();

    isSpinning = true;
    lever.disable();
    sound.play("spin");

    const newGrid = randomizeGrid(CONFIG.symbolWeights);

    gridRenderer.animateSpin(newGrid, () => {
        sound.stop("spin");
        isSpinning = false;
        setTimeout(() => {}, 300);

        const matches = detectAllPatterns(newGrid);
        const reward = calculatePayout(matches, state.denomination);

        if (reward.totalPayout > 0) {
            state.balance += reward.totalPayout;
            state.lastWin = reward.totalPayout;
            state.totalAmountWon = Math.round((state.totalAmountWon + reward.totalPayout) * 100) / 100;
            sound.playWinTier(reward.highestTier);
            gridRenderer.highlightMatches(matches);
            winDisp.show(reward, state.denomination);
            setTimeout(() => {
                lever.enable();
            }, 350);
        } else {
            winDisp.hide();
            lever.enable();
        }

        saveState(state);
        updateUI();
    });
}

function onCouchComplete(amount: number): void {
    state.balance += amount;
    state.lastWin = amount;
    saveState(state);
    updateUI();
}

function updateUI(): void {
    if (state.balance > state.highestBalance) {
        state.highestBalance = state.balance;
        saveState(state);
    }
    balanceDisp.update(state.balance, state.lastWin, state.totalSpins, state.highestBalance);
    const net = Math.round((state.totalAmountWon - state.totalAmountLost) * 100) / 100;
    statsWonEl.textContent = `$${state.totalAmountWon.toFixed(2)}`;
    statsLostEl.textContent = `$${state.totalAmountLost.toFixed(2)}`;
    statsNetEl.textContent = (net >= 0 ? "+" : "") + `$${net.toFixed(2)}`;
    statsNetEl.className = "stats-value" + (net > 0 ? " stats-positive" : net < 0 ? " stats-negative" : "");
    const spinCost = state.denomination;
    const roundedBalance = Math.round(state.balance * 100) / 100;
    couch.setVisible(roundedBalance < 0.2);
    brokeMsg.classList.toggle("hidden", roundedBalance >= spinCost);
}
