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

        return isValid;
    }

    private handleHyperSpinError() {
        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            this.showNotEnoughMoneyForHyperSpin();
        }
        this.cascadingUIHandler.resetBottomMessageState();
    }

    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betControlStore.totalBet}, Available: ${this.cascadingUIStore.userBalance}`;
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

        this.cascadingUIStore.bottomMessageState = "HYPER_SPIN";
        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        // Check cancellation flag first - prevents execution after cancellation
        if (this.isCancelled) {
            return;
        }

        // Don't place new bets if cascade is still active (free spins in progress)
        if (this.hyperSpinStore.isCascadeTrackingActive() && this.cascadingUIStore.freeSpinsTotal > 0) {
            return;
        }

        this.lastSpinTimestamp = Date.now();

        if (this.cascadingUIStore.freeSpinsTotal > 0 && !this.hyperSpinStore.isCascadeTrackingActive()) {
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

        } else {
            // ✅ IMPROVED: Don't stop batch immediately on bet failure
            // Only stop if it's a critical error (e.g., insufficient balance)
            // Otherwise, retry after delay
            const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;

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

        // Don't stop if completion is pending (final round being processed)
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

        // Check if rounds are exhausted
        const roundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;

        if (roundsExhausted) {
            return true;
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
            return;
        }

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
        // Check cancellation flag before resuming
        if (this.isCancelled) {
            return;
        }

        this.hyperSpinStore.resumeHyperSpinBatch();
        this.checkHyperSpinNextRound();
    }

    private lastSpinTimestamp = 0;

    checkHyperSpinNextRound() {
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
            return false;
        }

        if (this.isBatchInterrupted) {
            this.handleBatchInterruption();
            return false;
        }

        if (!this.hyperSpinStore.isHyperSpin) {
            return false;
        }

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
            this.stopHyperSpin();
        } else {
            // Store timeout ID for cleanup
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
        // Clear recursive checkHyperSpinNextRound timeout
        if (this.checkNextRoundTimeout !== null) {
            clearTimeout(this.checkNextRoundTimeout);
            this.checkNextRoundTimeout = null;
        }

        // Clear placeHyperSpinBet timeout
        if (this.placeBetTimeout !== null) {
            clearTimeout(this.placeBetTimeout);
            this.placeBetTimeout = null;
        }

        // Clear settlement wait timeout
        if (this.settlementWaitTimeout !== null) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
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

                // If completion was pending, complete it now that cascade data is recorded
                if (this.isCompletionPending) {
                    this.isCompletionPending = false;
                    this.completeHyperSpin();
                }
            }
        }
    }
}
