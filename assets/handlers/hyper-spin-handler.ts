import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingUIHandler } from "./cascading-ui-handler";
import { DialogName, SlotNotification } from "../cascading-slot-utils";
import { CascadingSlotState } from "../cascading-slot-state";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { BetControlStore } from "../stores/bet-control-store";
import { BetControlHandlers } from "./bet-control-handlers";
import { SlotBetHandler } from "./slot-bet-handler";
import { IUIHandler } from "../interfaces/ui-handler.interface";
import { IBetManager } from "../interfaces/bet-manager.interface";
import { IGameState } from "../interfaces/game-state.interface";

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
    @inject(CascadingUIHandler) protected readonly uiHandler: IUIHandler;
    @inject(CascadingUIStore) protected readonly gameState: IGameState;
    @inject(BetControlStore) protected readonly betManager: IBetManager;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;
    @inject(gc.Bet.BetStore) private readonly betStore: gc.Bet.BetStore;
    @inject(gc.Rounds.RoundStore) private readonly roundStore: gc.Rounds.RoundStore;

    handle() { }

    clickHyperSpin() {
        // Note: triggerOpenDialog is not in IUIHandler interface, keeping direct access for now
        (this.uiHandler as any).triggerOpenDialog(DialogName.HYPER_SPIN);
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
        }

        // ✅ Reset cancellation flag when opening popup
        // This allows user to start new batch after cancellation
        if (this.isCancelled && !this.hyperSpinStore.isHyperSpin) {
            this.isCancelled = false;
        }

        // ✅ NEW: Clear batch data if status is "Cancel" to allow fresh start
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel") {
            this.hyperSpinStore.clearBatchData();
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

        const totalBetUnique = this.betManager.totalBetUnique;
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
        // Note: currentTotalBetIndex is not in IBetManager interface, using direct access
        const betControlStore = this.betManager as any as BetControlStore;
        if (betControlStore.currentTotalBetIndex !== clampedIndex) {
            betControlStore.currentTotalBetIndex = clampedIndex;
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
        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();
    }

    onClickPlayButton() {
        const isPaused = this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused";

        if (this.hyperSpinStore.isHyperSpin) {
            if (isPaused) {
                this.resumeHyperSpinBatch();
            }
            return;
        }

        if (!this.isValidHyperSpinBet()) {
            this.handleHyperSpinError();
            return;
        }

        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.startHyperSpinWithCurrentSettings();
    }

    private isValidHyperSpinBet(): boolean {
        const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;
        const hasValidRounds = this.hyperSpinStore.selectedRoundOnPopup > 0;

        // ✅ FIX: Allow starting when currentBatchData is null (no active batch)
        // OR when game is not spinning
        // OR when batch status is Ready or Cancel
        const isValidGameState = !this.gameState.isPlacingBet &&
            (this.gameState.cascadingState !== CascadingSlotState.SPINNING ||
                !this.hyperSpinStore.currentBatchData || // ✅ Allow when batch data is cleared
                this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready" ||
                this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel");

        // ✅ NEW: Ensure hyper-spin is not active (should be false when starting)
        const isNotActive = !this.hyperSpinStore.isHyperSpin;

        const isValid = hasEnoughMoney && hasValidRounds && isValidGameState && isNotActive;

        return isValid;
    }

    private handleHyperSpinError() {
        const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;
        if (!hasEnoughMoney) {
            this.showNotEnoughMoneyForHyperSpin();
        }
        // Note: resetBottomMessageState is not in IUIHandler interface, keeping direct access
        (this.uiHandler as any).resetBottomMessageState();
    }

    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betManager.totalBet}, Available: ${this.gameState.userBalance}`;
        this.noticeStore.addWarning(message);
    }

    private startHyperSpinWithCurrentSettings() {
        // Reset cancellation flag when starting new batch
        this.isCancelled = false;

        this.hyperSpinBatchStartTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(true);
        this.hyperSpinStore.initializeHyperSpinBatch();
        this.hyperSpinStore.startHyperSpinBatch();

        // Start tracking with fallback support
        try {
            if (typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function') {
                this.hyperSpinStore.startHyperSpinSessionTracking();
            } else if (typeof this.hyperSpinStore.initializeHyperSpinTrackingFallback === 'function') {
                this.hyperSpinStore.initializeHyperSpinTrackingFallback();
            }
        } catch (error) {
            // Continue even if tracking fails
        }

        // Note: bottomMessageState is not in IGameState interface, using direct access
        (this.gameState as any).bottomMessageState = "HYPER_SPIN";
        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        // Check cancellation flag first - prevents execution after cancellation
        if (this.isCancelled) {
            return;
        }

        // Don't place new bets if cascade is still active (free spins in progress)
        if (this.hyperSpinStore.isCascadeTrackingActive() && this.gameState.freeSpinsTotal > 0) {
            return;
        }

        this.lastSpinTimestamp = Date.now();

        // Handle freespins based on stopOnFeature setting
        if (this.gameState.freeSpinsTotal > 0) {
            if (this.hyperSpinStore.stopOnFeature) {
                // stopOnFeature=true: Stop hyper-spin batch and let normal freespins take over
                this.stopHyperSpin();
                return;
            } else {
                // stopOnFeature=false: Continue hyper-spin mode - treat freespins as part of hyper-spin
                // Continue with bet placement - freespins will be handled as hyper-spin spins
            }
        }

        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        const originalTotalBet = this.betManager.totalBet;

        this.uiHandler.handleNewRound();
        const success = this.slotBetHandler.handle();

        // Note: totalBet setter is not in IBetManager interface, using direct access
        (this.betManager as any).totalBet = originalTotalBet;

        if (success) {
            // Note: roundsHyperSpin is now decremented after cascade completes in handleRecordSpinData
            // This ensures completion happens after the final spin is recorded
        } else {
            // ✅ IMPROVED: Don't stop batch immediately on bet failure
            // Only stop if it's a critical error (e.g., insufficient balance)
            // Otherwise, retry after delay
            const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;

            if (!hasEnoughMoney) {
                // Critical error - insufficient balance, stop batch
                this.stopHyperSpin();
            } else {
                // Non-critical error - retry after delay
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

        // Check if rounds are exhausted
        const roundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;
        if (roundsExhausted) {
            return true;
        }

        // Check stop on feature condition - stop batch when freespins triggered and stopOnFeature is true
        if (this.hyperSpinStore.stopOnFeature && this.gameState.freeSpinsTotal > 0) {
            return true; // Stop the batch
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

    public stopHyperSpin() {
        // ✅ MODIFIED: Only prevent premature stop for profit/loss conditions, not rounds exhaustion
        // Don't apply guard when stopping due to rounds being exhausted (roundsHyperSpin <= 0)
        const isRoundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;

        if (!isRoundsExhausted) {
            // Only apply premature stop guard for profit/loss/other conditions
            const batchAge = Date.now() - this.hyperSpinBatchStartTime;
            if (batchAge < 1000 && this.hyperSpinBatchStartTime > 0) {
                return;
            }
        }

        // Clear all pending timeouts when stopping
        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();
        this.isCompletionPending = false; // Reset pending completion

        // Close popup when stopping due to features (allows normal freespin UI to show)
        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        // Note: bottomMessageState is not in IGameState interface, using direct access
        (this.gameState as any).bottomMessageState = SlotNotification.SETTLED;
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
        // Note: bottomMessageState is not in IGameState interface, using direct access
        (this.gameState as any).bottomMessageState = SlotNotification.SETTLED;
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        // Reset completion flag
        this.isCompletionPending = false;

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


        // Check cancellation flag before resuming
        if (this.isCancelled) {
            return;
        }

        this.hyperSpinStore.resumeHyperSpinBatch();
        this.checkHyperSpinNextRound();
    }

    private lastSpinTimestamp = 0;

    checkHyperSpinNextRound(immediate: boolean = false) {
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

        this.handleContinueOrStopHyperSpin(immediate);
    }

    private isHyperSpinValidForNextRound(): boolean {
        // Check cancellation flag first - prevents execution after cancellation
        if (this.isCancelled) {
            return false;
        }

        if (this.isBatchInterrupted) {
            this.handleBatchInterruption();
            return false;
        }

        // NOTE: Since this method is only called from hyper-spin context,
        // the isHyperSpin check is redundant but kept for defensive programming
        if (!this.hyperSpinStore.isHyperSpin) {
            return false;
        }

        return true;
    }

    private shouldWaitForSettlementEffects(): boolean {
        // NOTE: This method is only called from hyper-spin context due to isolation,
        // so the stopOnFeature check below should always be false (we disable it for hyper-spin).
        // However, keeping the check for defensive programming in case routing changes.
        // Note: isFreeSpinEffectCompleted is not in IGameState interface, using direct access
        return this.hyperSpinStore.stopOnFeature !== false && !(this.gameState as any).isFreeSpinEffectCompleted;
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
            this.checkNextRoundTimeout = null;
            if (!this.isCancelled) {
                this.checkHyperSpinNextRound();
            }
        }, 0);
        this.checkNextRoundTimeout = timeoutId;
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
        // Handle free spins based on stopOnFeature setting
        if (this.gameState.freeSpinsTotal > 0) {
            if (this.hyperSpinStore.stopOnFeature) {
                // stopOnFeature=true: Skip and let normal freespins take over
                return true;
            } else {
                // stopOnFeature=false: Continue hyper-spin mode, don't skip
                return false;
            }
        }

        // Check if paused
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused") {
            return true;
        }

        return false;
    }

    private handleContinueOrStopHyperSpin(immediate: boolean = false) {
        // Continue or stop
        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return; // IMPORTANT: Return here to prevent continuing to place another bet
        }

        // Only continue if we haven't stopped
        if (immediate) {
            // FAST-PATH: Call placeHyperSpinBet immediately without setTimeout delay
            if (!this.isCancelled) {
                this.placeHyperSpinBet();
            }
        } else {
            // NORMAL-PATH: Use setTimeout for MobX reactivity propagation
            const timeoutId = window.setTimeout(() => {
                this.placeBetTimeout = null;
                if (!this.isCancelled) {
                    this.placeHyperSpinBet();
                }
            }, 0);
            this.placeBetTimeout = timeoutId;
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
        if (this.gameState) {
            // Note: bottomMessageState is not in IGameState interface, using direct access
            (this.gameState as any).bottomMessageState = "HYPER_SPIN_INTERRUPTED";
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
        // 1. Set cancellation flag immediately to prevent new operations
        this.isCancelled = true;

        // 2. Clear all pending timeouts to stop recursive calls
        this.clearAllPendingTimeouts();

        // 3. Reset timing if hyper-spin was cancelled
        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
        }

        // 4. Set hyper-spin inactive using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(false);

        this.updateHyperSpinRounds(0);
        this.isCompletionPending = false;

        // 5. Mark batch as cancelled instead of clearing it
        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Cancel";
        } else {
            // If no batch data exists, clear it
            this.hyperSpinStore.clearBatchData();
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
            clearTimeout(this.checkNextRoundTimeout);
            this.checkNextRoundTimeout = null;
            clearedCount++;
        }

        // Clear placeHyperSpinBet timeout
        if (this.placeBetTimeout !== null) {
            clearTimeout(this.placeBetTimeout);
            this.placeBetTimeout = null;
            clearedCount++;
        }

        // Clear settlement wait timeout
        if (this.settlementWaitTimeout !== null) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            clearedCount++;
        }

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
        const stake = this.betManager.totalBet || 0;

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
        // In hyper-spin mode, always complete cascade after settlement since each settlement represents a complete round
        const isCascadeComplete = this.hyperSpinStore.isHyperSpin ||
            (this.gameState.freeSpinsTotal === 0 &&
                !this.gameState.isPlacingBet &&
                this.gameState.cascadingState !== CascadingSlotState.SPINNING);

        if (isCascadeComplete) {
            // Complete the cascade and record the accumulated data
            const cascadeSpinData = this.hyperSpinStore.completeCascadeTracking();

            if (cascadeSpinData) {
                // Add the complete cascade as a single spin entry to the batch
                this.hyperSpinStore.addSpinToBatch(cascadeSpinData);

                // Decrement roundsHyperSpin after recording the spin
                // This ensures completion happens after the final spin is recorded
                // Don't decrement rounds for freespins during hyper-spin batch
                if (!this.hyperSpinStore.isCascadeTrackingActive() && !isFreeSpin) {
                    this.hyperSpinStore.roundsHyperSpin--;
                }

                // Check if this was the final spin (rounds are exhausted)
                if (this.hyperSpinStore.roundsHyperSpin < 0) {
                    this.completeHyperSpin();
                }
            }
        }
    }
}
