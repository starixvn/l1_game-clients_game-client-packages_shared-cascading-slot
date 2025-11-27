import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingUIHandler } from "./cascading-ui-handler";
import { DialogName, SlotNotification } from "../cascading-slot-utils";
import { CascadingSlotState } from "../cascading-slot-state";
import { HyperSpinStore, HyperSpinSingleSpinData } from "../stores/hyper-spin-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { BetControlStore } from "../stores/bet-control-store";
import { BetControlHandlers } from "./bet-control-handlers";
import { SlotBetHandler } from "./slot-bet-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinHandler implements gc.Shared.IHandler<number> {
    // Timing tracking for hyper-spin batch
    private hyperSpinBatchStartTime = 0;
    private hyperSpinBatchEndTime = 0;

    // Interruption detection and timeout protection
    private settlementWaitTimeout: number | null = null;
    private readonly SETTLEMENT_WAIT_TIMEOUT_MS = 10000; // 10 second timeout
    private lastSettlementCheckTime = 0;
    private isBatchInterrupted = false;
    private isCompletionPending = false;

    // Timeout tracking for cancellation cleanup
    private checkNextRoundTimeout: number | null = null;
    private placeBetTimeout: number | null = null;
    private isCancelled = false; // Cancellation flag to prevent operations after cancel

    /**
     * Public getter to check if hyper-spin batch is cancelled
     * Used by reactive handlers to prevent race conditions
     */
    get isBatchCancelled(): boolean {
        return this.isCancelled;
    }

    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;
    @inject(gc.Bet.BetStore) private readonly betStore: gc.Bet.BetStore;
    @inject(gc.Rounds.RoundStore) private readonly roundStore: gc.Rounds.RoundStore;

    handle() { }

    clickHyperSpin() {

        this.cascadingUIHandler.triggerOpenDialog(DialogName.HYPER_SPIN);
        this.showHyperSpinBetControl();

    }

    openHyperSpinPopup() {
        this.hyperSpinStore.isOpenHyperSpinPopup = true;
        this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2]; // Default to 100
    }

    updateHyperSpinRounds(rounds: number) {
        this.hyperSpinStore.selectedRoundOnPopup = rounds;
    }

    changeHyperSpinRounds(increase: boolean) {
        const currentRounds = this.hyperSpinStore.selectedRoundOnPopup;
        const roundsList = this.hyperSpinStore.roundsList;
        const currentIndex = roundsList.indexOf(currentRounds);

        if (increase && currentIndex < roundsList.length - 1) {
            this.updateHyperSpinRounds(roundsList[currentIndex + 1]);
        } else if (!increase && currentIndex > 0) {
            this.updateHyperSpinRounds(roundsList[currentIndex - 1]);
        }
    }

    confirmHyperSpinRoundsAndStart() {
        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        setTimeout(() => {
            this.startHyperSpinWithRounds();
        }, 500);
    }

    private startHyperSpinWithRounds() {
        this.hyperSpinStore.setHyperSpinActive(true);
    }

    showHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = true;

        // ✅ Reset selectedRoundOnPopup if it's 0 (was reset during cancellation)
        if (this.hyperSpinStore.selectedRoundOnPopup === 0) {
            this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2]; // Default to 100
            console.warn("🔄 [HYPER_SPIN] Reset selectedRoundOnPopup to default", {
                selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
                timestamp: new Date().toISOString()
            });
        }

        // ✅ Reset cancellation flag when opening popup
        // This allows user to start new batch after cancellation
        if (this.isCancelled && !this.hyperSpinStore.isHyperSpin) {
            this.isCancelled = false;
            console.warn("🔄 [HYPER_SPIN] Cancellation flag reset - popup opened", {
                timestamp: new Date().toISOString()
            });
        }

        // ✅ NEW: Clear batch data if status is "Cancel" to allow fresh start
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel") {
            this.hyperSpinStore.clearBatchData();
            console.warn("🔄 [HYPER_SPIN] Cleared cancelled batch data on popup open", {
                timestamp: new Date().toISOString()
            });
        }

        // ✅ NEW: Ensure isHyperSpin is false when popup opens (if not active)
        if (!this.hyperSpinStore.isHyperSpin) {
            this.hyperSpinStore.setHyperSpinActive(false);
        }
    }

    closeHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

        // ✅ Cancel batch if hyper-spin is active
        if (this.hyperSpinStore.isHyperSpin) {
            this.cancelHyperSpin();
        }
    }

    changeTotalBet(increase: boolean) {
        this.betControlHandlers.changeTotalBet(increase);
    }

    setTotalBetFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const totalBetUnique = this.betControlStore.totalBetUnique;
        if (!totalBetUnique || totalBetUnique.length === 0) {
            return;
        }

        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const betValues = totalBetUnique.map(item => +Object.keys(item)[0]);
        const minBet = Math.min(...betValues);
        const maxBet = Math.max(...betValues);

        const targetBetValue = minBet + (maxBet - minBet) * clampedProgress;

        let closestIndex = 0;
        let minDiff = Math.abs(betValues[0] - targetBetValue);

        for (let i = 1; i < betValues.length; i++) {
            const diff = Math.abs(betValues[i] - targetBetValue);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        const clampedIndex = Math.max(0, Math.min(totalBetUnique.length - 1, closestIndex));
        if (this.betControlStore.currentTotalBetIndex !== clampedIndex) {
            this.betControlStore.currentTotalBetIndex = clampedIndex;
        }
    }

    changeStopOnProfit(increase: boolean) {
        this.hyperSpinStore.changeStopOnProfit(increase);
    }

    setStopOnProfitFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.hyperSpinStore.minStopOnProfit;
        const max = this.hyperSpinStore.maxStopOnProfit;
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const value = min + (max - min) * clampedProgress;

        this.hyperSpinStore.setStopOnProfit(value);
    }

    changeStopOnLoss(increase: boolean) {
        this.hyperSpinStore.changeStopOnLoss(increase);
    }

    setStopOnLossFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.hyperSpinStore.minStopOnLoss;
        const max = this.hyperSpinStore.maxStopOnLoss;
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const value = min + (max - min) * clampedProgress;

        this.hyperSpinStore.setStopOnLoss(value);
    }

    toggleStopOnFeature() {
        this.hyperSpinStore.stopOnFeature = !this.hyperSpinStore.stopOnFeature;
    }

    toggleSettings() {
        // Prevent settings toggle when hyper-spin is actively playing
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Playing") {
            return;
        }

        this.hyperSpinStore.isSettingsOpen = !this.hyperSpinStore.isSettingsOpen;
    }

    closeHyperSpinPopup() {
        console.warn("🛑 [HYPER_SPIN] closeHyperSpinPopup() called", {
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            hasPendingTimeouts: !!(this.checkNextRoundTimeout || this.placeBetTimeout || this.settlementWaitTimeout),
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();
    }

    onClickPlayButton() {
        console.warn("🎮 [HYPER_SPIN] onClickPlayButton() called", {
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            isCancelled: this.isCancelled,
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            userBalance: this.cascadingUIStore.userBalance,
            batchStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
            timestamp: new Date().toISOString()
        });

        const isPaused = this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused";

        if (this.hyperSpinStore.isHyperSpin) {
            console.warn("🔄 [HYPER_SPIN] onClickPlayButton() - Hyper-spin already active", {
                isPaused,
                batchStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
                timestamp: new Date().toISOString()
            });
            if (isPaused) {
                console.warn("▶️ [HYPER_SPIN] onClickPlayButton() - Resuming paused batch", {
                    timestamp: new Date().toISOString()
                });
                this.resumeHyperSpinBatch();
            }
            return;
        }

        console.warn("✅ [HYPER_SPIN] onClickPlayButton() - Validating bet", {
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            totalBet: this.betControlStore.totalBet,
            userBalance: this.cascadingUIStore.userBalance,
            timestamp: new Date().toISOString()
        });

        if (!this.isValidHyperSpinBet()) {
            console.warn("❌ [HYPER_SPIN] onClickPlayButton() - Bet validation failed", {
                selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
                totalBet: this.betControlStore.totalBet,
                userBalance: this.cascadingUIStore.userBalance,
                timestamp: new Date().toISOString()
            });
            this.handleHyperSpinError();
            return;
        }

        console.warn("✅ [HYPER_SPIN] onClickPlayButton() - Bet validation passed, starting hyper-spin", {
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            totalBet: this.betControlStore.totalBet,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.startHyperSpinWithCurrentSettings();
    }

    private isValidHyperSpinBet(): boolean {
        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        const hasValidRounds = this.hyperSpinStore.selectedRoundOnPopup > 0;

        // ✅ FIX: Allow starting when currentBatchData is null (no active batch)
        // OR when game is not spinning
        // OR when batch status is Ready or Cancel
        const isValidGameState = !this.cascadingUIStore.isPlacingBet &&
            (this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING ||
                !this.hyperSpinStore.currentBatchData || // ✅ Allow when batch data is cleared
                this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready" ||
                this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel");

        // ✅ NEW: Ensure hyper-spin is not active (should be false when starting)
        const isNotActive = !this.hyperSpinStore.isHyperSpin;

        const isValid = hasEnoughMoney && hasValidRounds && isValidGameState && isNotActive;

        console.warn("🔍 [HYPER_SPIN] isValidHyperSpinBet() validation", {
            hasEnoughMoney,
            hasValidRounds,
            isValidGameState,
            isNotActive,
            isPlacingBet: this.cascadingUIStore.isPlacingBet,
            cascadingState: this.cascadingUIStore.cascadingState,
            batchDataExists: !!this.hyperSpinStore.currentBatchData,
            batchStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            totalBet: this.betControlStore.totalBet,
            userBalance: this.cascadingUIStore.userBalance,
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            isValid,
            timestamp: new Date().toISOString()
        });

        return isValid;
    }

    private handleHyperSpinError() {
        console.warn("⚠️ [HYPER_SPIN] handleHyperSpinError() called", {
            totalBet: this.betControlStore.totalBet,
            userBalance: this.cascadingUIStore.userBalance,
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });

        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            console.warn("💰 [HYPER_SPIN] handleHyperSpinError() - Insufficient balance", {
                required: this.betControlStore.totalBet,
                available: this.cascadingUIStore.userBalance,
                shortfall: this.betControlStore.totalBet - this.cascadingUIStore.userBalance,
                timestamp: new Date().toISOString()
            });
            this.showNotEnoughMoneyForHyperSpin();
        }
        this.cascadingUIHandler.resetBottomMessageState();
    }

    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betControlStore.totalBet}, Available: ${this.cascadingUIStore.userBalance}`;
        this.noticeStore.addWarning(message);
    }

    private startHyperSpinWithCurrentSettings() {
        console.warn("🚀 [HYPER_SPIN] startHyperSpinWithCurrentSettings() called", {
            roundsHyperSpin: this.hyperSpinStore.roundsHyperSpin,
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            totalBet: this.betControlStore.totalBet,
            stopOnProfit: this.hyperSpinStore.stopOnProfit,
            stopOnLoss: this.hyperSpinStore.stopOnLoss,
            stopOnFeature: this.hyperSpinStore.stopOnFeature,
            timestamp: new Date().toISOString()
        });

        // Reset cancellation flag when starting new batch
        this.isCancelled = false;
        console.warn("▶️ [HYPER_SPIN] Starting new batch - cancellation flag reset", {
            timestamp: new Date().toISOString()
        });

        this.hyperSpinBatchStartTime = Date.now();

        console.warn("⚙️ [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Initializing batch", {
            batchStartTime: this.hyperSpinBatchStartTime,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.setHyperSpinActive(true);
        this.hyperSpinStore.initializeHyperSpinBatch();
        this.hyperSpinStore.startHyperSpinBatch();

        console.warn("✅ [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Batch initialized", {
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Start tracking with fallback support
        try {
            if (typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function') {
                console.warn("📊 [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Starting session tracking", {
                    timestamp: new Date().toISOString()
                });
                this.hyperSpinStore.startHyperSpinSessionTracking();
            } else if (typeof this.hyperSpinStore.initializeHyperSpinTrackingFallback === 'function') {
                console.warn("📊 [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Using fallback tracking", {
                    timestamp: new Date().toISOString()
                });
                this.hyperSpinStore.initializeHyperSpinTrackingFallback();
            }
        } catch (error) {
            console.warn("⚠️ [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Tracking failed", {
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date().toISOString()
            });
            // Continue even if tracking fails
        }

        this.cascadingUIStore.bottomMessageState = "HYPER_SPIN";
        console.warn("🎯 [HYPER_SPIN] startHyperSpinWithCurrentSettings() - Placing first bet", {
            timestamp: new Date().toISOString()
        });
        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        console.warn("🎰 [HYPER_SPIN] placeHyperSpinBet() called", {
            isCancelled: this.isCancelled,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            hasActiveCascade: this.hyperSpinStore.isCascadeTrackingActive(),
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n'),
            timestamp: new Date().toISOString()
        });

        // Check cancellation flag first - prevents execution after cancellation
        if (this.isCancelled) {
            console.warn("🛑 [HYPER_SPIN] placeHyperSpinBet() BLOCKED by cancellation flag");
            return;
        }

        // Don't place new bets if cascade is still active (free spins in progress)
        if (this.hyperSpinStore.isCascadeTrackingActive() && this.cascadingUIStore.freeSpinsTotal > 0) {
            console.warn("⏳ [HYPER_SPIN] placeHyperSpinBet() BLOCKED - cascade still active with free spins", {
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                accumulatedWin: this.hyperSpinStore.getCurrentCascadeData()?.accumulatedWin || 0,
                timestamp: new Date().toISOString()
            });
            return;
        }

        console.warn("✅ [HYPER_SPIN] placeHyperSpinBet() PROCEEDING", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        this.lastSpinTimestamp = Date.now();

        if (this.cascadingUIStore.freeSpinsTotal > 0 && !this.hyperSpinStore.isCascadeTrackingActive()) {
            console.warn("⏳ [HYPER_SPIN] Skipping bet placement - free spins active but no cascade tracking", {
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });
            return; // Skip during free spins that aren't part of current cascade
        }

        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        const originalTotalBet = this.betControlStore.totalBet;

        this.cascadingUIHandler.handleNewRound();
        const success = this.slotBetHandler.handle();

        this.betControlStore.totalBet = originalTotalBet;

        if (success) {
            // Only decrement rounds if this is a new hyper-spin round (not a free spin continuation)
            if (!this.hyperSpinStore.isCascadeTrackingActive()) {
                this.hyperSpinStore.roundsHyperSpin--;

                if (this.hyperSpinStore.roundsHyperSpin <= 0) {
                    // Mark completion as pending until after cascade data is recorded
                    this.isCompletionPending = true;
                }
            }

            console.warn("🎯 [HYPER_SPIN] Bet placed successfully", {
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                isNewRound: !this.hyperSpinStore.isCascadeTrackingActive(),
                timestamp: new Date().toISOString()
            });
        } else {
            // ✅ IMPROVED: Don't stop batch immediately on bet failure
            // Only stop if it's a critical error (e.g., insufficient balance)
            // Otherwise, retry after delay
            const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;

            if (!hasEnoughMoney) {
                // Critical error - insufficient balance, stop batch
                console.warn("🛑 [HYPER_SPIN] Bet failed - insufficient balance, stopping batch", {
                    totalBet: this.betControlStore.totalBet,
                    userBalance: this.cascadingUIStore.userBalance,
                    timestamp: new Date().toISOString()
                });
                this.stopHyperSpin();
            } else {
                // Non-critical error - retry after delay
                console.warn("⚠️ [HYPER_SPIN] Bet failed, retrying after delay", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    timestamp: new Date().toISOString()
                });
                setTimeout(() => {
                    if (!this.isCancelled && this.hyperSpinStore.isHyperSpin) {
                        this.placeHyperSpinBet();
                    }
                }, 1000);
            }
        }
    }

    private getStopReason(): string {
        const reasons = [];

        if (this.hyperSpinStore.stopOnProfit > 0) {
            const currentProfit = this.calculateCurrentProfit();
            if (currentProfit >= this.hyperSpinStore.stopOnProfit) {
                reasons.push(`Profit reached: ${currentProfit} >= ${this.hyperSpinStore.stopOnProfit}`);
            }
        }

        if (this.hyperSpinStore.stopOnLoss > 0) {
            const currentLoss = this.calculateCurrentLoss();
            if (currentLoss >= this.hyperSpinStore.stopOnLoss) {
                reasons.push(`Loss reached: ${currentLoss} >= ${this.hyperSpinStore.stopOnLoss}`);
            }
        }

        if (this.hyperSpinStore.roundsHyperSpin <= 0) {
            reasons.push("All rounds completed");
        }

        return reasons.length > 0 ? reasons.join(", ") : "Unknown";
    }

    private shouldStopHyperSpin(): boolean {
        const currentProfit = this.calculateCurrentProfit();
        const currentLoss = this.calculateCurrentLoss();

        // Check if rounds are exhausted first - always stop if no rounds left
        const roundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;
        if (roundsExhausted) {
            return true;
        }

        // Don't stop if completion is pending (but allow stopping if rounds exhausted)
        if (this.isCompletionPending) {
            return false;
        }

        if (this.hyperSpinStore.stopOnFeature && this.cascadingUIStore.freeSpinsTotal > 0) {
            return false;
        }

        // Check profit stop condition
        if (this.hyperSpinStore.stopOnProfit > 0) {
            const profitConditionMet = currentProfit >= this.hyperSpinStore.stopOnProfit;

            if (profitConditionMet) {
                return true;
            }
        }

        // Check loss stop condition
        if (this.hyperSpinStore.stopOnLoss > 0) {
            const lossConditionMet = currentLoss >= this.hyperSpinStore.stopOnLoss;

            if (lossConditionMet) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculate current profit during hyper-spin session
     */
    private calculateCurrentProfit(): number {
        // Update tracking before returning value
        this.hyperSpinStore.updateHyperSpinProfitLoss();
        return this.hyperSpinStore.getCurrentHyperSpinProfit();
    }

    private calculateCurrentLoss(): number {
        // Update tracking before returning value
        this.hyperSpinStore.updateHyperSpinProfitLoss();
        return this.hyperSpinStore.getCurrentHyperSpinLoss();
    }

    private stopHyperSpin() {
        // ✅ NEW: Guard - Don't stop if batch just started (within 1 second)
        const batchAge = Date.now() - this.hyperSpinBatchStartTime;
        if (batchAge < 1000 && this.hyperSpinBatchStartTime > 0) {
            console.warn("⚠️ [HYPER_SPIN] Preventing premature stop - batch just started", {
                batchAge,
                batchStartTime: this.hyperSpinBatchStartTime,
                timestamp: new Date().toISOString()
            });
            return;
        }

        // ✅ NEW: Comprehensive logging to track when and why stopHyperSpin() is called
        console.warn("🛑 [HYPER_SPIN] stopHyperSpin() called", {
            isCancelled: this.isCancelled,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            batchStartTime: this.hyperSpinBatchStartTime,
            batchAge: this.hyperSpinBatchStartTime > 0 ? Date.now() - this.hyperSpinBatchStartTime : 0,
            stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n'),
            timestamp: new Date().toISOString()
        });

        // Clear all pending timeouts when stopping
        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();
        this.isCompletionPending = false; // Reset pending completion

        this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        this.showHyperSpinStoppedMessage();
    }

    private completeHyperSpin() {
        // Clear all pending timeouts when completing
        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();

        this.hyperSpinStore.roundsHyperSpin = 0;
        this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        this.showHyperSpinCompletedMessage();
    }

    private showHyperSpinStoppedMessage() {
        this.noticeStore.addWarning("Hyper-Spin stopped due to stop conditions.");
    }

    private showHyperSpinCompletedMessage() {
        this.noticeStore.addWarning("Hyper-Spin completed successfully!");
    }

    pauseHyperSpinBatch() {
        this.hyperSpinStore.pauseHyperSpinBatch();
    }

    resumeHyperSpinBatch() {
        console.warn("▶️ [HYPER_SPIN] resumeHyperSpinBatch() called", {
            isCancelled: this.isCancelled,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Check cancellation flag before resuming
        if (this.isCancelled) {
            console.warn("🛑 [HYPER_SPIN] resumeHyperSpinBatch() BLOCKED by cancellation flag");
            return;
        }

        this.hyperSpinStore.resumeHyperSpinBatch();
        this.checkHyperSpinNextRound();
    }

    private lastSpinTimestamp = 0;

    checkHyperSpinNextRound() {
        console.warn("🔄 [HYPER_SPIN] checkHyperSpinNextRound() called", {
            isCancelled: this.isCancelled,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            isBatchInterrupted: this.isBatchInterrupted,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n'),
            timestamp: new Date().toISOString()
        });

        if (!this.isHyperSpinValidForNextRound()) {
            return;
        }

        if (this.shouldWaitForSettlementEffects()) {
            this.scheduleSettlementWaitTimeout();
            return;
        }

        this.clearSettlementTimeoutIfNeeded();

        if (this.shouldSkipDueToFreeSpinsOrPause()) {
            return;
        }

        this.handleContinueOrStopHyperSpin();
    }

    private isHyperSpinValidForNextRound(): boolean {
        // Check cancellation flag first - prevents execution after cancellation
        if (this.isCancelled) {
            console.warn("🛑 [HYPER_SPIN] checkHyperSpinNextRound() BLOCKED by cancellation flag");
            return false;
        }

        if (this.isBatchInterrupted) {
            console.warn("🛑 [HYPER_SPIN] checkHyperSpinNextRound() BLOCKED by interruption");
            this.handleBatchInterruption();
            return false;
        }

        if (!this.hyperSpinStore.isHyperSpin) {
            console.warn("🛑 [HYPER_SPIN] checkHyperSpinNextRound() BLOCKED - isHyperSpin is false");
            return false;
        }

        console.warn("✅ [HYPER_SPIN] checkHyperSpinNextRound() PROCEEDING", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        return true;
    }

    private shouldWaitForSettlementEffects(): boolean {
        return this.hyperSpinStore.stopOnFeature !== false && !this.cascadingUIStore.isFreeSpinEffectCompleted;
    }

    private scheduleSettlementWaitTimeout() {
        const currentTime = Date.now();

        if (this.lastSettlementCheckTime === 0) {
            this.lastSettlementCheckTime = currentTime;
        }

        const timeWaiting = currentTime - this.lastSettlementCheckTime;
        if (timeWaiting >= this.SETTLEMENT_WAIT_TIMEOUT_MS) {
            this.isBatchInterrupted = true;
            this.handleBatchInterruption();
            return;
        }

        if (!this.settlementWaitTimeout) {
            this.settlementWaitTimeout = window.setTimeout(() => {
                if (!this.isCancelled) {
                    this.isBatchInterrupted = true;
                    this.handleBatchInterruption();
                }
            }, this.SETTLEMENT_WAIT_TIMEOUT_MS);
        }

        // Store timeout ID for cleanup
        const timeoutId = window.setTimeout(() => {
            console.warn("⏰ [HYPER_SPIN] checkNextRoundTimeout executed", {
                isCancelled: this.isCancelled,
                isHyperSpin: this.hyperSpinStore.isHyperSpin,
                timestamp: new Date().toISOString()
            });
            this.checkNextRoundTimeout = null;
            if (!this.isCancelled) {
                this.checkHyperSpinNextRound();
            } else {
                console.warn("🛑 [HYPER_SPIN] checkNextRoundTimeout BLOCKED by cancellation flag");
            }
        }, 0);
        this.checkNextRoundTimeout = timeoutId;
        console.warn("⏰ [HYPER_SPIN] Scheduled checkNextRoundTimeout", {
            timeoutId,
            timestamp: new Date().toISOString()
        });
    }

    private clearSettlementTimeoutIfNeeded() {
        // Clear timeout if settlement completed
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            this.lastSettlementCheckTime = 0;
        }
    }

    private shouldSkipDueToFreeSpinsOrPause(): boolean {
        // Handle free spins
        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            return true; // Let normal flow handle free spins
        }

        // Check if paused
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused") {
            return true;
        }

        return false;
    }

    private handleContinueOrStopHyperSpin() {
        // Continue or stop
        if (this.shouldStopHyperSpin()) {
            console.warn("🛑 [HYPER_SPIN] shouldStopHyperSpin() returned true - stopping");
            this.stopHyperSpin();
        } else {
            // Store timeout ID for cleanup
            const timeoutId = window.setTimeout(() => {
                console.warn("⏰ [HYPER_SPIN] placeBetTimeout executed", {
                    isCancelled: this.isCancelled,
                    isHyperSpin: this.hyperSpinStore.isHyperSpin,
                    timestamp: new Date().toISOString()
                });
                this.placeBetTimeout = null;
                if (!this.isCancelled) {
                    this.placeHyperSpinBet();
                } else {
                    console.warn("🛑 [HYPER_SPIN] placeBetTimeout BLOCKED by cancellation flag");
                }
            }, 0);
            this.placeBetTimeout = timeoutId;
            console.warn("⏰ [HYPER_SPIN] Scheduled placeBetTimeout", {
                timeoutId,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Handle batch interruption with proper cleanup and user feedback
     */
    private handleBatchInterruption() {

        // Clear any pending timeouts
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
        }

        // Reset interruption state
        this.lastSettlementCheckTime = 0;

        // Mark batch as interrupted in store for potential recovery
        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Interrupted";
        }

        // Show user feedback
        this.showBatchInterruptionMessage();

        // Don't automatically stop the batch - let user decide
        // The batch remains in "Interrupted" state for potential recovery
    }

    /**
     * Show user feedback when batch is interrupted
     */
    private showBatchInterruptionMessage() {
        const message = "Hyper-Spin batch was interrupted. You can resume or restart the batch.";
        if (this.noticeStore) {
            this.noticeStore.addWarning(message);
        }

        // Update UI to show interruption state
        if (this.cascadingUIStore) {
            this.cascadingUIStore.bottomMessageState = "HYPER_SPIN_INTERRUPTED";
        }
    }

    hasInterruptedBatch() {
        return !!(this.hyperSpinStore.currentBatchData &&
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus === "Interrupted" &&
            this.hyperSpinStore.roundsHyperSpin > 0);
    }

    getInterruptedBatchInfo() {
        if (!this.hasInterruptedBatch()) {
            return null;
        }

        const batchData = this.hyperSpinStore.currentBatchData;
        const totalRounds = this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup;
        const completedRounds = totalRounds - this.hyperSpinStore.roundsHyperSpin;

        return {
            totalRounds,
            completedRounds,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            totalBet: batchData.summary.totalBet,
            totalWin: batchData.summary.totalWin,
            currentProfit: this.calculateCurrentProfit(),
            currentLoss: this.calculateCurrentLoss()
        };
    }

    /**
     * Cancel HyperSpin
     * Stops the batch immediately and cleans up all pending operations.
     */
    cancelHyperSpin() {
        console.warn("🛑 [HYPER_SPIN] cancelHyperSpin() called", {
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            checkNextRoundTimeout: this.checkNextRoundTimeout,
            placeBetTimeout: this.placeBetTimeout,
            settlementWaitTimeout: this.settlementWaitTimeout,
            isCancelled: this.isCancelled,
            timestamp: new Date().toISOString()
        });

        // 1. Set cancellation flag immediately to prevent new operations
        this.isCancelled = true;
        console.warn("🛑 [HYPER_SPIN] Cancellation flag set to true");

        // 2. Clear all pending timeouts to stop recursive calls
        this.clearAllPendingTimeouts();

        // 3. Reset timing if hyper-spin was cancelled
        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
        }

        // 4. Set hyper-spin inactive using HyperSpinStore method
        console.warn("🛑 [HYPER_SPIN] Setting isHyperSpin to false", {
            before: this.hyperSpinStore.isHyperSpin,
            timestamp: new Date().toISOString()
        });
        this.hyperSpinStore.setHyperSpinActive(false);
        console.warn("🛑 [HYPER_SPIN] isHyperSpin set to false", {
            after: this.hyperSpinStore.isHyperSpin,
            cascadingUIStoreIsHyperSpinActive: this.cascadingUIStore.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        this.updateHyperSpinRounds(0);
        this.isCompletionPending = false;

        // 5. Mark batch as cancelled instead of clearing it
        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Cancel";
            console.warn("🛑 [HYPER_SPIN] Batch status set to Cancel", {
                timestamp: new Date().toISOString()
            });
        } else {
            // If no batch data exists, clear it
            this.hyperSpinStore.clearBatchData();
            console.warn("🛑 [HYPER_SPIN] Batch data cleared (no batch data existed)", {
                timestamp: new Date().toISOString()
            });
        }

        // 6. Reset all timing variables
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;
        this.lastSettlementCheckTime = 0;

        // 7. Reset interruption flags
        this.isBatchInterrupted = false;

        // 8. Don't reset cancellation flag automatically
        // Flag will be reset when starting a new batch in startHyperSpinWithCurrentSettings()
    }

    /**
     * Clears all pending timeouts to prevent batch from continuing after cancellation.
     */
    private clearAllPendingTimeouts() {
        let clearedCount = 0;

        // Clear recursive checkHyperSpinNextRound timeout
        if (this.checkNextRoundTimeout !== null) {
            console.warn("🛑 [HYPER_SPIN] Clearing checkNextRoundTimeout", {
                timeoutId: this.checkNextRoundTimeout,
                timestamp: new Date().toISOString()
            });
            clearTimeout(this.checkNextRoundTimeout);
            this.checkNextRoundTimeout = null;
            clearedCount++;
        }

        // Clear placeHyperSpinBet timeout
        if (this.placeBetTimeout !== null) {
            console.warn("🛑 [HYPER_SPIN] Clearing placeBetTimeout", {
                timeoutId: this.placeBetTimeout,
                timestamp: new Date().toISOString()
            });
            clearTimeout(this.placeBetTimeout);
            this.placeBetTimeout = null;
            clearedCount++;
        }

        // Clear settlement wait timeout
        if (this.settlementWaitTimeout !== null) {
            console.warn("🛑 [HYPER_SPIN] Clearing settlementWaitTimeout", {
                timeoutId: this.settlementWaitTimeout,
                timestamp: new Date().toISOString()
            });
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            clearedCount++;
        }

        console.warn("🛑 [HYPER_SPIN] clearAllPendingTimeouts() completed", {
            clearedCount,
            timestamp: new Date().toISOString()
        });
    }

    handleRecordSpinData(finishData: any) {
        return this.recordSpinData(finishData);
    }

    recordSpinData(finishData: any) {
        if (!this.hyperSpinStore.isHyperSpin) {
            return; // Not in hyper-spin mode, skip recording
        }

        if (!finishData) {
            return;
        }

        const {
            win = 0,
            bigWin = false,
            megaWin = false,
            superWin = false,
            reachMaxWin = false,
            isFreeSpin = false,
            freeSpins = 0,
            totalFreeSpins = 0,
        } = finishData;

        // Determine stake amount (use totalBet for hyper-spin)
        const stake = this.betControlStore.totalBet || 0;

        // Check if this is the start of a new cascade (no active cascade tracking)
        if (!this.hyperSpinStore.isCascadeTrackingActive()) {
            // Start tracking a new cascade
            let spinId: string | number;
            if (isFreeSpin) {
                const freeSpinId = this.hyperSpinStore.getNextFreeSpinId();
                spinId = `FS${freeSpinId}`;
            } else {
                spinId = this.hyperSpinStore.getNextHyperSpinId();
            }

            this.hyperSpinStore.startCascadeTracking(spinId, isFreeSpin, stake);

            console.warn("🎯 [HYPER_SPIN] Started new cascade tracking for spin", {
                spinId,
                isFreeSpin,
                stake,
                win,
                timestamp: new Date().toISOString()
            });
        }

        // Accumulate win data for this cascade step
        // For now, we'll infer scatter/multiplier info from available data
        // This can be enhanced with more specific game state information
        const hasScatterTrigger = freeSpins > 0;
        const hasMultiplier = win > 0 && stake > 0 && (win / stake) > 1;

        this.hyperSpinStore.accumulateCascadeWin(
            win,
            bigWin,
            megaWin,
            superWin,
            reachMaxWin,
            freeSpins,
            totalFreeSpins,
            hasScatterTrigger,
            hasMultiplier
        );

        // Check if cascade is complete (no more free spins pending and not in middle of settlement)
        const isCascadeComplete = this.cascadingUIStore.freeSpinsTotal === 0 &&
            !this.cascadingUIStore.isPlacingBet &&
            this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING;

        if (isCascadeComplete) {
            // Complete the cascade and record the accumulated data
            const cascadeSpinData = this.hyperSpinStore.completeCascadeTracking();

            if (cascadeSpinData) {
                // Add the complete cascade as a single spin entry to the batch
                this.hyperSpinStore.addSpinToBatch(cascadeSpinData);

                console.warn("✅ [HYPER_SPIN] Recorded complete cascade as single spin", {
                    spinId: cascadeSpinData.spinId,
                    totalWin: cascadeSpinData.spinWinAmountRaw,
                    multiplier: cascadeSpinData.spinWinMultiplierRaw,
                    winTag: cascadeSpinData.winTag,
                    timestamp: new Date().toISOString()
                });

                // If completion was pending, complete it now that cascade data is recorded
                if (this.isCompletionPending) {
                    this.isCompletionPending = false;
                    this.completeHyperSpin();
                }
            }
        } else {
            console.warn("⏳ [HYPER_SPIN] Cascade still in progress, continuing accumulation", {
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                isPlacingBet: this.cascadingUIStore.isPlacingBet,
                cascadingState: this.cascadingUIStore.cascadingState,
                accumulatedWin: this.hyperSpinStore.getCurrentCascadeData()?.accumulatedWin || 0,
                timestamp: new Date().toISOString()
            });
        }
    }
}
