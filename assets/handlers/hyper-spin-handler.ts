import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingUIHandler } from "./cascading-ui-handler";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { DialogName, SlotNotification } from "../cascading-slot-utils";
import { CascadingSlotState } from "../cascading-slot-state";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { BetControlStore } from "../stores/bet-control-store";
import { BetControlHandlers } from "./bet-control-handlers";
import { SlotBetHandler } from "./slot-bet-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinHandler {
    // Constants
    private static readonly SETTLEMENT_WAIT_TIMEOUT_MS = 3000;
    private static readonly MIN_BATCH_AGE_MS = 1000;
    private static readonly FREE_SPIN_TRIGGER_DELAY_MS = 1000;
    private static readonly DEFAULT_SELECTED_ROUND_INDEX = 2;

    // Timeout Manager - Utility class for managing all timeouts
    private timeoutManager = new class {
        private timeouts: Map<string, number> = new Map();

        setTimeout(key: string, callback: () => void, delay: number = 0): void {
            this.clearTimeout(key);
            const id = window.setTimeout(() => {
                this.timeouts.delete(key);
                callback();
            }, delay);
            this.timeouts.set(key, id);
        }

        clearTimeout(key: string): void {
            const id = this.timeouts.get(key);
            if (id !== undefined) {
                clearTimeout(id);
                this.timeouts.delete(key);
            }
        }

        clearAll(): void {
            this.timeouts.forEach((id) => clearTimeout(id));
            this.timeouts.clear();
        }

        hasTimeout(key: string): boolean {
            return this.timeouts.has(key);
        }
    };

    // State properties
    private hyperSpinBatchStartTime = 0;
    private hyperSpinBatchEndTime = 0;
    private lastSettlementCheckTime = 0;
    private isBatchInterrupted = false;
    private isCancelled = false;

    get isBatchCancelled(): boolean {
        return this.isCancelled;
    }

    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betManager: BetControlStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;

    clickHyperSpin() {
        (this.uiHandler as any).triggerOpenDialog(DialogName.HYPER_SPIN);
        this.showHyperSpinBetControl();

    }

    openHyperSpinPopup() {
        this.hyperSpinStore.isOpenHyperSpinPopup = true;
        this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[HyperSpinHandler.DEFAULT_SELECTED_ROUND_INDEX];
    }

    updateHyperSpinRounds(rounds: number) {
        this.hyperSpinStore.selectedRoundOnPopup = rounds;
    }

    confirmHyperSpinRoundsAndStart() {
        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        this.startHyperSpinWithRounds();
    }

    private startHyperSpinWithRounds() {
        this.hyperSpinStore.setHyperSpinActive(true);
    }

    showHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = true;

        if (this.hyperSpinStore.selectedRoundOnPopup === 0) {
            this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[HyperSpinHandler.DEFAULT_SELECTED_ROUND_INDEX];
        }

        if (this.isCancelled && !this.hyperSpinStore.isActiveHyperSpin) {
            this.isCancelled = false;
        }

        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel") {
            this.hyperSpinStore.clearBatchData();
        }

        if (!this.hyperSpinStore.isActiveHyperSpin) {
            this.hyperSpinStore.setHyperSpinActive(false);
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
        if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Playing") {
            return;
        }

        this.hyperSpinStore.isSettingsOpen = !this.hyperSpinStore.isSettingsOpen;
    }

    closeHyperSpinPopup() {
        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();
    }

    autoClosePopupByTurnOnFeature() {
        this.closeHyperSpinPopup();
    }

    public checkAndTriggerFreeSpinAfterFeature() {
        // If hyper spin was closed due to feature and we have free spins, trigger a spin
        if (this.hyperSpinStore.autoClosePopupByTurnOnFeature &&
            this.cascadingUIStore.freeSpinsTotal > 0) {

            // Trigger free spin with delay to ensure settlement is complete and UI is ready
            this.timeoutManager.setTimeout('freeSpinTrigger', () => {
                // Double-check conditions before triggering
                if (this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING &&
                    !this.cascadingUIStore.isPlacingBet &&
                    this.slotBetHandler && typeof this.slotBetHandler.handle === 'function') {
                    this.slotBetHandler.handle();
                }
            }, HyperSpinHandler.FREE_SPIN_TRIGGER_DELAY_MS); // Longer delay to ensure settlement is fully complete
        }
    }

    onClickPlayButton() {
        const isPaused = this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused";

        if (this.hyperSpinStore.isActiveHyperSpin) {
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

    // Validation Methods
    private isValidHyperSpinBet(): boolean {
        return this.hasSufficientBalance() &&
            this.hasValidRoundSelection() &&
            this.isNotCurrentlyPlacingBet() &&
            this.isInValidSpinState() &&
            !this.hyperSpinStore.isActiveHyperSpin;
    }

    private hasSufficientBalance(): boolean {
        return this.betManager.totalBet <= this.cascadingUIStore.userBalance;
    }

    private hasValidRoundSelection(): boolean {
        return this.hyperSpinStore.selectedRoundOnPopup > 0;
    }

    private isNotCurrentlyPlacingBet(): boolean {
        return !this.cascadingUIStore.isPlacingBet;
    }

    private isInValidSpinState(): boolean {
        return this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING ||
            !this.hyperSpinStore.currentBatchData ||
            this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready" ||
            this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Cancel";
    }

    private handleHyperSpinError() {
        const hasEnoughMoney = this.betManager.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            this.showNotEnoughMoneyForHyperSpin();
        }
        (this.uiHandler as any).resetBottomMessageState();
    }

    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betManager.totalBet}, Available: ${this.cascadingUIStore.userBalance}`;
        this.noticeStore.addWarning(message);
    }

    private startHyperSpinWithCurrentSettings() {
        this.isCancelled = false;

        this.hyperSpinBatchStartTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(true);
        this.hyperSpinStore.initializeHyperSpinBatch();
        this.hyperSpinStore.startHyperSpinBatch();

        if (typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function') {
            this.hyperSpinStore.startHyperSpinSessionTracking();
        } else if (typeof this.hyperSpinStore.initializeHyperSpinTrackingFallback === 'function') {
            this.hyperSpinStore.initializeHyperSpinTrackingFallback();
        }

        (this.cascadingUIStore as any).bottomMessageState = "HYPER_SPIN";
        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        if (this.isCancelled) {
            return;
        }

        if (this.hyperSpinStore.isCascadeTrackingActive() && this.cascadingUIStore.freeSpinsTotal > 0) {
            return;
        }

        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            if (this.hyperSpinStore.stopOnFeature) {
                this.stopHyperSpin();
                return;
            }
        }

        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        const originalTotalBet = this.betManager.totalBet;

        this.uiHandler.handleNewRound();
        const success = this.slotBetHandler.handle();

        (this.betManager as any).totalBet = originalTotalBet;

        if (!success) {
            const hasEnoughMoney = this.betManager.totalBet <= this.cascadingUIStore.userBalance;

            if (!hasEnoughMoney) {
                this.stopHyperSpin();
            } else {
                if (!this.isCancelled && this.hyperSpinStore.isActiveHyperSpin) {
                    this.placeHyperSpinBet();
                }
            }
        }
    }

    private shouldStopHyperSpin(): boolean {
        return this.isRoundsExhausted() ||
            this.shouldStopOnFeatureTrigger() ||
            this.shouldStopOnProfitTarget() ||
            this.shouldStopOnLossLimit();
    }

    private isRoundsExhausted(): boolean {
        return this.hyperSpinStore.roundsHyperSpin <= 0;
    }

    private shouldStopOnFeatureTrigger(): boolean {
        return this.hyperSpinStore.stopOnFeature && this.cascadingUIStore.freeSpinsTotal > 0;
    }

    private shouldStopOnProfitTarget(): boolean {
        if (this.hyperSpinStore.stopOnProfit <= 0) {
            return false;
        }
        const currentProfit = this.calculateCurrentProfit();
        return currentProfit >= this.hyperSpinStore.stopOnProfit;
    }

    private shouldStopOnLossLimit(): boolean {
        if (this.hyperSpinStore.stopOnLoss <= 0) {
            return false;
        }
        const currentLoss = this.calculateCurrentLoss();
        return currentLoss >= this.hyperSpinStore.stopOnLoss;
    }

    private calculateCurrentProfit(): number {
        this.hyperSpinStore.updateHyperSpinProfitLoss();
        return this.hyperSpinStore.getCurrentHyperSpinProfit();
    }

    private calculateCurrentLoss(): number {
        this.hyperSpinStore.updateHyperSpinProfitLoss();
        return this.hyperSpinStore.getCurrentHyperSpinLoss();
    }

    public stopHyperSpin() {
        const isRoundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;

        // Allow stopping immediately if called due to feature trigger (free spins)
        if (!isRoundsExhausted) {
            const batchAge = Date.now() - this.hyperSpinBatchStartTime;
            if (batchAge < HyperSpinHandler.MIN_BATCH_AGE_MS && this.hyperSpinBatchStartTime > 0) {
                return;
            }
        }

        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();

        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        (this.cascadingUIStore as any).bottomMessageState = SlotNotification.SETTLED;
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        this.showHyperSpinStoppedMessage();
    }

    private completeHyperSpin() {
        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();

        this.hyperSpinStore.roundsHyperSpin = 0;
        (this.cascadingUIStore as any).bottomMessageState = SlotNotification.SETTLED;
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
        if (this.isCancelled) {
            return;
        }

        this.hyperSpinStore.resumeHyperSpinBatch();
        this.checkHyperSpinNextRound();
    }

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
        if (this.isCancelled) {
            return false;
        }

        if (this.isBatchInterrupted) {
            this.handleBatchInterruption();
            return false;
        }

        if (!this.hyperSpinStore.isActiveHyperSpin) {
            return false;
        }

        return true;
    }

    private shouldWaitForSettlementEffects(): boolean {
        // Only wait for settlement effects if free spins are actually active
        // The original logic incorrectly waited even when no free spins were triggered
        return this.cascadingUIStore.freeSpinsTotal > 0 && !(this.cascadingUIStore as any).isFreeSpinEffectCompleted;
    }

    private scheduleSettlementWaitTimeout() {
        const currentTime = Date.now();

        if (this.lastSettlementCheckTime === 0) {
            this.lastSettlementCheckTime = currentTime;
        }

        const timeWaiting = currentTime - this.lastSettlementCheckTime;
        if (timeWaiting >= HyperSpinHandler.SETTLEMENT_WAIT_TIMEOUT_MS) {
            this.isBatchInterrupted = true;
            this.handleBatchInterruption();
            return;
        }

        if (!this.timeoutManager.hasTimeout('settlement')) {
            if (!this.isCancelled) {
                this.handleBatchInterruption();
            }
            return;
        }

        if (!this.isCancelled) {
            this.checkHyperSpinNextRound();
        }
    }

    private clearSettlementTimeoutIfNeeded() {
        this.timeoutManager.clearTimeout('settlement');
        this.lastSettlementCheckTime = 0;
    }

    private shouldSkipDueToFreeSpinsOrPause(): boolean {
        return (this.cascadingUIStore.freeSpinsTotal > 0 && this.hyperSpinStore.stopOnFeature) ||
            (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused");
    }

    private handleContinueOrStopHyperSpin(immediate: boolean = false) {
        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        if (immediate) {
            if (!this.isCancelled) {
                this.placeHyperSpinBet();
            }
        } else {
            this.timeoutManager.setTimeout('placeBet', () => {
                if (!this.isCancelled) {
                    this.placeHyperSpinBet();
                }
            }, 0);
        }
    }

    private handleBatchInterruption() {
        this.timeoutManager.clearTimeout('settlement');
        this.lastSettlementCheckTime = 0;

        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Interrupted";
        }

        this.showBatchInterruptionMessage();
    }

    private showBatchInterruptionMessage() {
        const message = "Hyper-Spin batch was interrupted. You can resume or restart the batch.";
        if (this.noticeStore) {
            this.noticeStore.addWarning(message);
        }

        if (this.cascadingUIStore) {
            (this.cascadingUIStore as any).bottomMessageState = "HYPER_SPIN_INTERRUPTED";
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
        const totalRounds = this.hyperSpinStore.selectedRoundOnPopup;
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

    cancelHyperSpin() {
        this.isCancelled = true;

        this.clearAllPendingTimeouts();

        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
        }

        this.hyperSpinStore.setHyperSpinActive(false);

        this.updateHyperSpinRounds(0);

        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Cancel";
        } else {
            this.hyperSpinStore.clearBatchData();
        }

        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;
        this.lastSettlementCheckTime = 0;

        this.isBatchInterrupted = false;
    }

    private clearAllPendingTimeouts() {
        this.timeoutManager.clearAll();
    }

    handleRecordSpinData(finishData: any) {
        return this.recordSpinData(finishData);
    }

    recordSpinData(finishData: any) {
        if (!this.hyperSpinStore.isActiveHyperSpin) {
            return;
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

        const stake = this.betManager.totalBet || 0;

        if (!this.hyperSpinStore.isCascadeTrackingActive()) {
            let spinId: string | number;
            if (isFreeSpin) {
                const freeSpinId = this.hyperSpinStore.getNextFreeSpinId();
                spinId = `FS${freeSpinId}`;
            } else {
                spinId = this.hyperSpinStore.getNextHyperSpinId();
            }

            this.hyperSpinStore.startCascadeTracking(spinId, isFreeSpin, stake);
        }

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

        const isIdleState = this.cascadingUIStore.freeSpinsTotal === 0 &&
            !this.cascadingUIStore.isPlacingBet &&
            this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING;

        const isCascadeComplete = this.hyperSpinStore.isActiveHyperSpin || isIdleState;

        if (isCascadeComplete) {
            const cascadeSpinData = this.hyperSpinStore.completeCascadeTracking();

            if (cascadeSpinData) {
                this.hyperSpinStore.addSpinToBatch(cascadeSpinData);

                if (!this.hyperSpinStore.isCascadeTrackingActive() && !isFreeSpin) {
                    this.hyperSpinStore.roundsHyperSpin--;
                }

                if (this.hyperSpinStore.roundsHyperSpin < 0) {
                    this.completeHyperSpin();
                }
            }
        }
    }
}
