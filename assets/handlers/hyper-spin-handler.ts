import gc from "@sg/game-client-base";
import inversify from "inversify";
import { cascadingSlotLogger } from "../cascading-slot-logger";

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
    private hyperSpinBatchStartTime: number = 0;
    private hyperSpinBatchEndTime: number = 0;

    // Interruption detection and timeout protection
    private settlementWaitTimeout: number | null = null;
    private readonly SETTLEMENT_WAIT_TIMEOUT_MS = 10000; // 10 second timeout
    private lastSettlementCheckTime: number = 0;
    private isBatchInterrupted = false;
    private isCompletionPending = false;

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
    }

    closeHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;
    }

    changeTotalBet(increase: boolean) {
        this.betControlHandlers.changeTotalBet(increase);
    }

    setTotalBetFromSlider(sliderProgress: number) {
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) return;

        const totalBetUnique = this.betControlStore.totalBetUnique;
        if (!totalBetUnique || totalBetUnique.length === 0) return;

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
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) return;

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
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) return;

        const min = this.hyperSpinStore.minStopOnLoss;
        const max = this.hyperSpinStore.maxStopOnLoss;
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const value = min + (max - min) * clampedProgress;

        this.hyperSpinStore.setStopOnLoss(value);
    }

    toggleStopOnFeature() {
        this.hyperSpinStore.stopOnFeature = !this.hyperSpinStore.stopOnFeature;
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
        const isValidGameState = !this.cascadingUIStore.isPlacingBet &&
            (this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING ||
                this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready");

        return hasEnoughMoney && hasValidRounds && isValidGameState;
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
        this.lastSpinTimestamp = Date.now();

        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            return; // Skip during free spins
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
            this.hyperSpinStore.roundsHyperSpin--;

            if (this.hyperSpinStore.roundsHyperSpin <= 0) {
                // Mark completion as pending until after spin data is recorded
                this.isCompletionPending = true;
            }
        } else {
            this.stopHyperSpin();
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
        this.hyperSpinStore.resumeHyperSpinBatch();
        this.checkHyperSpinNextRound();
    }

    private lastSpinTimestamp: number = 0;

    checkHyperSpinNextRound() {
        if (this.isBatchInterrupted) {
            this.handleBatchInterruption();
            return;
        }

        if (!this.hyperSpinStore.isHyperSpin) return;

        const currentTime = Date.now();

        // Wait for settlement effects unless stopOnFeature is disabled
        if (this.hyperSpinStore.stopOnFeature !== false && !this.cascadingUIStore.isFreeSpinEffectCompleted) {
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
                    this.isBatchInterrupted = true;
                    this.handleBatchInterruption();
                }, this.SETTLEMENT_WAIT_TIMEOUT_MS);
            }

            setTimeout(() => this.checkHyperSpinNextRound(), 0);
            return;
        }

        // Clear timeout if settlement completed
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            this.lastSettlementCheckTime = 0;
        }

        // Handle free spins
        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            return; // Let normal flow handle free spins
        }

        // Check if paused
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused") {
            return;
        }

        // Continue or stop
        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
        } else {
            setTimeout(() => this.placeHyperSpinBet(), 0);
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

    hasInterruptedBatch(): boolean {
        return !!(this.hyperSpinStore.currentBatchData &&
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus === "Interrupted" &&
            this.hyperSpinStore.roundsHyperSpin > 0);
    }

    getInterruptedBatchInfo() {
        if (!this.hasInterruptedBatch()) {
            return null;
        }

        const batchData = this.hyperSpinStore.currentBatchData!;
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
     */
    cancelHyperSpin() {
        // Reset timing if hyper-spin was cancelled
        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
            const batchDuration = this.hyperSpinBatchEndTime - this.hyperSpinBatchStartTime;
            const endTimestamp = new Date(this.hyperSpinBatchEndTime).toISOString();

        }

        // Set hyper-spin inactive using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(false);
        this.updateHyperSpinRounds(0);
        this.isCompletionPending = false; // Reset pending completion

        // Clear batch data
        this.hyperSpinStore.clearBatchData();

        // Reset timing variables for next batch
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

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

        // Warn when freespins play in hyper-spin batch mode
        if (isFreeSpin) {
            console.warn("🎰 FREESPIN BATCH RECORD: Freespin detected and recorded in hyper-spin batch", {
                isFreeSpin,
                freeSpins,
                totalFreeSpins,
                win,
                stake: this.betControlStore.totalBet || 0,
                roundId: finishData.roundId,
                note: "Freespin recorded in batch data without UI effects",
                timestamp: new Date().toISOString()
            });

        }

        // Determine stake amount (use totalBet for hyper-spin)
        const stake = this.betControlStore.totalBet || 0;

        // Calculate multiplier (Gross Win / Stake)
        const multiplier = stake > 0 ? win / stake : 0;

        // Determine win tag
        const winTag = this.hyperSpinStore.determineWinTag(
            win,
            stake,
            bigWin,
            megaWin,
            superWin,
            reachMaxWin
        );

        // Get current balance
        const currentBalance = this.cascadingUIStore.userBalance || 0;

        // Determine spin ID
        let spinId: string | number;
        if (isFreeSpin) {
            // Free spin - get free spin ID and mark with icon indicator
            // The icon will be displayed separately in the UI, here we use a prefix
            const freeSpinId = this.hyperSpinStore.getNextFreeSpinId();
            spinId = `FS${freeSpinId}`; // FS prefix indicates Free Spin (icon will be added in UI)

        } else {
            // Regular hyper-spin round
            spinId = this.hyperSpinStore.getNextHyperSpinId();
        }

        // Create spin data - ALWAYS record freespins in batch mode
        const spinData: HyperSpinSingleSpinData = {
            spinId,
            isFreeSpin,
            spinWinAmount: gc.FormatUtils.numberWithCommas(win, 2, false),
            spinWinAmountRaw: win,
            spinWinMultiplier: gc.FormatUtils.numberWithCommas(multiplier, 2, false),
            spinWinMultiplierRaw: multiplier,
            winTag,
            spinBalance: gc.FormatUtils.numberWithCommas(currentBalance, 2, false),
            spinBalanceRaw: currentBalance,
            stake,
        };

        // Add spin to batch - freespins are always recorded in batch mode
        this.hyperSpinStore.addSpinToBatch(spinData);

        // If completion was pending, complete it now that spin data is recorded
        if (this.isCompletionPending) {
            this.isCompletionPending = false;
            this.completeHyperSpin();
        }

    }
}
