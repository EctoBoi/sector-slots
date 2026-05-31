import "./style.css";
import { CONFIG, DEBT_CEILING } from "./constants/config";
import { createEmptyGrid, randomizeGrid } from "./core/Grid";
import { detectAllPatterns } from "./core/PatternDetector";
import { calculatePayout } from "./core/RewardCalculator";
import { loadState, saveState } from "./core/PlayerState";
import * as DebtManager from "./core/DebtManager";
import { GridRenderer } from "./ui/GridRenderer";
import { Lever } from "./ui/Lever";
import { WinDisplay } from "./ui/WinDisplay";
import { BalanceDisplay } from "./ui/BalanceDisplay";
import { CouchCushion } from "./ui/CouchCushion";
import { DebtPanel } from "./ui/DebtPanel";
import { GameOverScreen, type GameOverReason } from "./ui/GameOverScreen";
import { SoundManager } from "./audio/SoundManager";
import { DENOMINATIONS } from "./constants/payouts";

// ─── State ────────────────────────────────────────────────────────────────────
const state = loadState(CONFIG.startingBalance, CONFIG.denomination);
let isSpinning = false;
let isGameOver = false;
let isOverDebtLimit = DebtManager.isDebtCeilingHit(state);
let isAwaitingKnock = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const gridContainer = document.getElementById("grid-container")!;
const leverEl = document.getElementById("lever")!;
const balanceEl = document.getElementById("balance-value")!;
const lastWinEl = document.getElementById("last-win-value")!;
const spinsEl = document.getElementById("spins-value")!;
const highestBalanceEl = document.getElementById("highest-balance-value")!;
const machineWinTierEl = document.getElementById("machine-win-tier")!;
const machineWinPayoutEl = document.getElementById("machine-win-payout")!;
const couchBtnEl = document.getElementById("couch-btn")!;
const knockBtnEl = document.getElementById("knock-btn") as HTMLButtonElement;
const couchProgressEl = document.getElementById("couch-progress")!;
const couchFoundEl = document.getElementById("couch-found")!;
const denomWrapperEl = document.getElementById("denom-wrapper")!;
const denomValueEl = document.getElementById("denom-value")!;
const denomDecBtn = document.getElementById("denom-dec") as HTMLButtonElement;
const denomIncBtn = document.getElementById("denom-inc") as HTMLButtonElement;
const brokeMsg = document.getElementById("broke-msg")!;
const rulesBtn = document.getElementById("rules-btn")!;
const rulesModal = document.getElementById("rules-modal")!;
const rulesClose = document.getElementById("rules-close")!;
const rulesOverlay = rulesModal.querySelector(".rules-overlay")!;
const settingsBtn = document.getElementById("settings-btn")!;
const settingsModal = document.getElementById("settings-modal")!;
const settingsClose = document.getElementById("settings-close")!;
const settingsOverlay = settingsModal.querySelector(".settings-overlay")!;
const soundToggle = document.getElementById("sound-toggle") as HTMLInputElement;
const volumeSlider = document.getElementById("volume-slider") as HTMLInputElement;
const statsWonEl = document.getElementById("stats-won")!;
const statsLostEl = document.getElementById("stats-lost")!;
const statsNetEl = document.getElementById("stats-net")!;
const debtBtnEl = document.getElementById("debt-btn")!;
const debtPanelEl = document.getElementById("debt-panel")!;
const debtBackdropEl = document.getElementById("debt-backdrop")!;
const gameOverEl = document.getElementById("game-over-screen")!;
const denomSliderEl = document.getElementById("denom-slider") as HTMLInputElement;
const playerRecHighestBalanceEl = document.getElementById("player-rec-highest-balance")!;
const playerRecHighestWinEl = document.getElementById("player-rec-highest-win")!;
const playerRecHighestNetEl = document.getElementById("player-rec-highest-net")!;
const playerRecBailoutsEl = document.getElementById("player-rec-bailouts")!;
const playerRecBestRunEl = document.getElementById("player-rec-best-run")!;
const playerRecTotalSpinsEl = document.getElementById("player-rec-total-spins")!;
const forceResetBtn = document.getElementById("force-reset-btn") as HTMLButtonElement;
const newRunBtn = document.getElementById("new-run-btn") as HTMLButtonElement;

// ─── Rules modal ──────────────────────────────────────────────────────────────
rulesBtn.addEventListener("click", () => rulesModal.classList.remove("hidden"));
rulesClose.addEventListener("click", () => rulesModal.classList.add("hidden"));
rulesOverlay.addEventListener("click", () => rulesModal.classList.add("hidden"));
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        rulesModal.classList.add("hidden");
        settingsModal.classList.add("hidden");
    }
});

// ─── Settings (Player) modal ──────────────────────────────────────────────────
settingsBtn.addEventListener("click", () => {
    updatePlayerModal();
    settingsModal.classList.remove("hidden");
});
settingsClose.addEventListener("click", () => settingsModal.classList.add("hidden"));
settingsOverlay.addEventListener("click", () => settingsModal.classList.add("hidden"));

// Load persisted sound settings
const savedSoundEnabled = localStorage.getItem("sectorSlots_soundEnabled");
const savedVolume = localStorage.getItem("sectorSlots_volume");
if (savedSoundEnabled !== null) {
    const enabled = savedSoundEnabled !== "false";
    soundToggle.checked = enabled;
    volumeSlider.disabled = !enabled;
}
if (savedVolume !== null) {
    volumeSlider.value = savedVolume;
}

soundToggle.addEventListener("change", () => {
    const enabled = soundToggle.checked;
    sound.setEnabled(enabled);
    volumeSlider.disabled = !enabled;
    localStorage.setItem("sectorSlots_soundEnabled", String(enabled));
});

volumeSlider.addEventListener("input", () => {
    sound.setVolume(parseFloat(volumeSlider.value));
    localStorage.setItem("sectorSlots_volume", volumeSlider.value);
});

// ─── Start new run ──────────────────────────────────────────────────────────
newRunBtn.addEventListener("click", () => {
    if (isAwaitingKnock) {
        settingsModal.classList.add("hidden");
        return;
    }
    isGameOver = false;
    commitRecords();
    state.denomination = CONFIG.denomination;
    denomIndex = Math.max(0, DENOMINATIONS.indexOf(CONFIG.denomination));
    resetRunState();
    settingsModal.classList.add("hidden");
});

// ─── Force reset ─────────────────────────────────────────────────────────────
let resetConfirmPending = false;
let resetConfirmTimer: ReturnType<typeof setTimeout> | null = null;

forceResetBtn.addEventListener("click", () => {
    if (!resetConfirmPending) {
        resetConfirmPending = true;
        forceResetBtn.textContent = "Confirm? (Click again)";
        forceResetBtn.classList.add("force-reset-btn--confirm");
        resetConfirmTimer = setTimeout(() => {
            resetConfirmPending = false;
            forceResetBtn.textContent = "Reset All Data";
            forceResetBtn.classList.remove("force-reset-btn--confirm");
        }, 3000);
    } else {
        if (resetConfirmTimer) clearTimeout(resetConfirmTimer);
        resetConfirmPending = false;
        forceResetBtn.textContent = "Reset All Data";
        forceResetBtn.classList.remove("force-reset-btn--confirm");

        isGameOver = false;
        state.records = { highestBalance: 0, highestSingleWin: 0, highestNetGain: 0, mostLoans: 0, bestRunSpins: 0, totalSpins: 0 };
        state.denomination = CONFIG.denomination;
        denomIndex = Math.max(0, DENOMINATIONS.indexOf(CONFIG.denomination));
        resetRunState();
        settingsModal.classList.add("hidden");
    }
});

// ─── Denomination stepper ─────────────────────────────────────────────────────
let denomIndex = Math.max(0, DENOMINATIONS.indexOf(state.denomination));

function updateDenomUI(): void {
    denomValueEl.textContent = `$${DENOMINATIONS[denomIndex].toFixed(2)}`;
    denomDecBtn.disabled = denomIndex === 0;
    denomIncBtn.disabled = denomIndex === DENOMINATIONS.length - 1;
    denomSliderEl.value = String(denomIndex);
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

denomSliderEl.addEventListener("input", () => {
    denomIndex = parseInt(denomSliderEl.value);
    state.denomination = DENOMINATIONS[denomIndex];
    saveState(state);
    updateDenomUI();
    updateUI();
});

updateDenomUI();

// ─── Subsystems ───────────────────────────────────────────────────────────────
const sound = new SoundManager();
// Apply persisted settings to the sound engine now that it's initialised
if (savedVolume !== null) sound.setVolume(parseFloat(savedVolume));
if (savedSoundEnabled !== null) sound.setEnabled(savedSoundEnabled !== "false");
const gridRenderer = new GridRenderer(gridContainer);
const balanceDisp = new BalanceDisplay(balanceEl, lastWinEl, spinsEl, highestBalanceEl);
const winDisp = new WinDisplay(machineWinTierEl, machineWinPayoutEl, gridContainer);
// couch and debtPanel reference each other via closures — both safe since
// closures are called only after construction completes.
const couch = new CouchCushion(
    couchBtnEl,
    couchProgressEl,
    couchFoundEl,
    onCouchComplete,
    () => {
        if (DebtManager.canTakeLoan(state)) {
            debtPanel.open();
        } else {
            triggerGameOver("couch");
        }
    },
    sound,
);
const lever = new Lever(leverEl, onLeverPull, sound);
const debtPanel = new DebtPanel(
    debtPanelEl,
    debtBackdropEl,
    state,
    () => updateUI(),
    () => couch.resetSearchCount(),
);
const gameOverScreen = new GameOverScreen(gameOverEl, () => {
    isGameOver = false;
    isOverDebtLimit = false;
    state.denomination = CONFIG.denomination;
    denomIndex = Math.max(0, DENOMINATIONS.indexOf(CONFIG.denomination));
    winDisp.hide();
    updateDenomUI();
    updateUI();
    lever.enable();
    gridRenderer.renderGrid(createEmptyGrid());
});
debtBtnEl.addEventListener("click", () => debtPanel.open());
knockBtnEl.addEventListener("click", () => {
    isAwaitingKnock = false;
    knockBtnEl.classList.add("hidden");
    triggerGameOver("ceiling");
});

// ─── Initial render ───────────────────────────────────────────────────────────
gridRenderer.renderGrid(createEmptyGrid());
updateUI();

// Reload-proof: if over debt limit with insufficient balance to cover excess, game over
if (isOverDebtLimit) {
    const totalDebt = DebtManager.getTotalDebt(state);
    const excess = Math.round((totalDebt - DEBT_CEILING) * 100) / 100;
    if (state.balance < excess) {
        triggerGameOver("ceiling");
    }
}

// ─── Spin logic ───────────────────────────────────────────────────────────────
function onLeverPull(): void {
    if (isSpinning || isGameOver || isOverDebtLimit) return;

    const cost = state.denomination;
    const balance = Math.round(state.balance * 100) / 100;

    if (balance < cost) {
        brokeMsg.classList.remove("hidden");
        return;
    }

    brokeMsg.classList.add("hidden");
    gridRenderer.clearHighlights();
    winDisp.reset();

    state.balance = Math.round((state.balance - cost) * 100) / 100;
    state.totalSpins += 1;
    state.totalAmountLost = Math.round((state.totalAmountLost + cost) * 100) / 100;

    isSpinning = true;
    lever.disable();
    saveState(state);
    updateUI();

    sound.play("spin");

    const newGrid = randomizeGrid(CONFIG.symbolWeights);

    gridRenderer.animateSpin(newGrid, () => {
        sound.stop("spin");
        isSpinning = false;

        const matches = detectAllPatterns(newGrid);
        const reward = calculatePayout(matches, state.denomination);

        if (reward.totalPayout > 0) {
            state.balance += reward.totalPayout;
            state.lastWin = reward.totalPayout;
            state.totalAmountWon = Math.round((state.totalAmountWon + reward.totalPayout) * 100) / 100;
            if (reward.totalPayout > state.records.highestSingleWin) {
                state.records.highestSingleWin = reward.totalPayout;
            }
            if (reward.totalPayout > state.highestSingleWin) {
                state.highestSingleWin = reward.totalPayout;
            }
            sound.playWinTier(reward.highestTier);
            gridRenderer.highlightMatches(matches);
            winDisp.show(reward, state.denomination, matches);
        } else {
            winDisp.hide();
        }

        // Tick interest on all active debts, track playthrough
        DebtManager.tickInterest(state);

        // Flash debt button if any debts exist
        if (state.debts.length > 0) {
            debtBtnEl.classList.add("debt-btn--pulse");
            setTimeout(() => debtBtnEl.classList.remove("debt-btn--pulse"), 900);
        }

        saveState(state);
        updateUI();

        if (DebtManager.isDebtCeilingHit(state)) {
            const totalDebt = DebtManager.getTotalDebt(state);
            const excess = Math.round((totalDebt - DEBT_CEILING) * 100) / 100;
            if (state.balance >= excess) {
                // Player can pay down, giving them a grace period
                isOverDebtLimit = true;
                updateUI();
            } else {
                // Not enough balance to cover debt — show message and knock button
                isAwaitingKnock = true;
                updateUI();
            }
            return;
        }

        if (reward.totalPayout > 0) {
            setTimeout(() => lever.enable(), 350);
        } else {
            lever.enable();
        }
    });
}

function onCouchComplete(amount: number): void {
    state.balance += amount;
    state.lastWin = amount;
    saveState(state);
    updateUI();
}

// ─── Shared run-state reset ─────────────────────────────────────────────────────────
function resetRunState(): void {
    isSpinning = false;
    isOverDebtLimit = false;
    isAwaitingKnock = false;
    knockBtnEl.classList.add("hidden");

    state.balance = CONFIG.startingBalance;
    state.totalSpins = 0;
    state.lastWin = 0;
    state.highestBalance = CONFIG.startingBalance;
    state.totalAmountWon = 0;
    state.totalAmountLost = 0;
    state.debts = [];
    state.nextLoanIndex = 1;
    state.loansThisRun = 0;
    state.highestSingleWin = 0;

    saveState(state);
    winDisp.hide();
    debtPanel.close();
    lever.enable();
    gridRenderer.renderGrid(createEmptyGrid());
    updateDenomUI();
    updateUI();
}

function commitRecords(): void {
    if (state.highestBalance > state.records.highestBalance) {
        state.records.highestBalance = state.highestBalance;
    }
    const runNet = Math.round((state.totalAmountWon - state.totalAmountLost) * 100) / 100;
    if (runNet > state.records.highestNetGain) {
        state.records.highestNetGain = runNet;
    }
    if (state.totalSpins > state.records.bestRunSpins) {
        state.records.bestRunSpins = state.totalSpins;
    }
    if (state.loansThisRun > state.records.mostLoans) {
        state.records.mostLoans = state.loansThisRun;
    }
    state.records.totalSpins += state.totalSpins;
}

function triggerGameOver(reason: GameOverReason): void {
    if (isGameOver) return;
    isGameOver = true;

    const summary = {
        runSpins: state.totalSpins,
        peakBalance: state.highestBalance,
        loansThisRun: state.loansThisRun,
        highestSingleWin: state.highestSingleWin,
        runNet: Math.round((state.totalAmountWon - state.totalAmountLost) * 100) / 100,
    };

    // Update all-time records before resetting run state
    commitRecords();

    resetRunState();
    gameOverScreen.show(summary, state.records, reason);
}

function updatePlayerModal(): void {
    const net = Math.round((state.totalAmountWon - state.totalAmountLost) * 100) / 100;
    statsWonEl.textContent = `$${state.totalAmountWon.toFixed(2)}`;
    statsLostEl.textContent = `$${state.totalAmountLost.toFixed(2)}`;
    statsNetEl.textContent = (net >= 0 ? "+" : "") + `$${net.toFixed(2)}`;
    statsNetEl.className = "stats-value" + (net > 0 ? " stats-positive" : net < 0 ? " stats-negative" : "");

    const rec = state.records;
    playerRecHighestBalanceEl.textContent = `$${rec.highestBalance.toFixed(2)}`;
    playerRecHighestWinEl.textContent = `$${rec.highestSingleWin.toFixed(2)}`;
    // Show the best of the committed record or the current run live
    const liveNet = Math.round((state.totalAmountWon - state.totalAmountLost) * 100) / 100;
    const bestNet = Math.max(rec.highestNetGain, liveNet);
    playerRecHighestNetEl.textContent = (bestNet >= 0 ? "+" : "") + `$${bestNet.toFixed(2)}`;
    playerRecHighestNetEl.className = "stats-value";
    playerRecBailoutsEl.textContent = String(Math.max(rec.mostLoans, state.loansThisRun));
    playerRecBestRunEl.textContent = String(Math.max(rec.bestRunSpins, state.totalSpins));
    playerRecTotalSpinsEl.textContent = String(rec.totalSpins + state.totalSpins);
}

function updateUI(): void {
    if (state.balance > state.highestBalance) {
        state.highestBalance = state.balance;
        saveState(state);
    }
    if (state.highestBalance > state.records.highestBalance) {
        state.records.highestBalance = state.highestBalance;
    }
    balanceDisp.update(state.balance, state.lastWin, state.totalSpins, state.highestBalance);

    // Debt button — always visible; shows debt total when in debt, BAILOUT when clean
    const totalDebt = DebtManager.getTotalDebt(state);
    if (isAwaitingKnock) {
        debtBtnEl.classList.add("hidden");
        denomWrapperEl.classList.add("hidden");
    } else {
        debtBtnEl.classList.remove("hidden");
        denomWrapperEl.classList.remove("hidden");
    }
    if (totalDebt > 0) {
        debtBtnEl.textContent = `DEBT $${totalDebt.toFixed(2)}`;
    } else {
        debtBtnEl.textContent = "LOAN";
    }

    const spinCost = state.denomination;
    const roundedBalance = Math.round(state.balance * 100) / 100;

    // Clear over-limit state once player has paid debt back under ceiling
    if (isOverDebtLimit && !DebtManager.isDebtCeilingHit(state)) {
        isOverDebtLimit = false;
    }

    if (isAwaitingKnock) {
        brokeMsg.textContent = "Not enough to pay off the debt...";
        brokeMsg.classList.remove("hidden");
        couch.setVisible(false);
        knockBtnEl.classList.remove("hidden");
        lever.disable();
        denomDecBtn.disabled = true;
        denomIncBtn.disabled = true;
        denomSliderEl.disabled = true;
        return;
    } else {
        denomDecBtn.disabled = denomIndex === 0;
        denomIncBtn.disabled = denomIndex === DENOMINATIONS.length - 1;
        denomSliderEl.disabled = false;
    }

    if (isOverDebtLimit) {
        brokeMsg.textContent = "Pay down debt to continue spinning!";
        brokeMsg.classList.remove("hidden");
        couch.setVisible(false);
        knockBtnEl.classList.add("hidden");
    } else {
        brokeMsg.textContent = "Not enough balance to spin!";
        couch.setVisible(!isSpinning && roundedBalance < 0.2);
        brokeMsg.classList.toggle("hidden", isSpinning || roundedBalance >= spinCost);
    }

    // Manage lever state (only outside of spin / game over)
    if (!isSpinning && !isGameOver) {
        if (isOverDebtLimit || roundedBalance < spinCost) {
            lever.disable();
        } else {
            lever.enable();
        }
    }

    // Keep player modal live while it's open
    if (!settingsModal.classList.contains("hidden")) {
        updatePlayerModal();
    }
}
