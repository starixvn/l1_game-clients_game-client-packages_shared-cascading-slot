import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { DialogName, SlotNotification } from "../cascading-slot-utils";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { BetControlHandlers } from "./bet-control-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { SlotBetHandler } from "./slot-bet-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinHandler implements gc.Shared.IHandler<number> {
    private hyperSpinBatchStartTime = 0;
    private hyperSpinBatchEndTime = 0;

    private settlementWaitTimeout: number | null = null;
    private readonly SETTLEMENT_WAIT_TIMEOUT_MS = 10000;
    private lastSettlementCheckTime = 0;
    private isBatchInterrupted = false;

    private checkNextRoundTimeout: number | null = null;
    private placeBetTimeout: number | null = null;
    private isCancelled = false;

    get isBatchCancelled(): boolean {
        return this.isCancelled;
    }

    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(CascadingUIStore) protected readonly gameState: CascadingUIStore;
    @inject(BetControlStore) protected readonly betManager: BetControlStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;
    @inject(gc.Bet.BetStore) private readonly betStore: gc.Bet.BetStore;
    @inject(gc.Rounds.RoundStore) private readonly roundStore: gc.Rounds.RoundStore;

    handle() { }

    clickHyperSpin() {
        (this.uiHandler as any).triggerOpenDialog(DialogName.HYPER_SPIN);
        this.showHyperSpinBetControl();

    }

    openHyperSpinPopup() {
        this.hyperSpinStore.isOpenHyperSpinPopup = true;
        this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2];
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

        this.startHyperSpinWithRounds();
    }

    private startHyperSpinWithRounds() {
        this.hyperSpinStore.setHyperSpinActive(true);
    }

    showHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = true;

        if (this.hyperSpinStore.selectedRoundOnPopup === 0) {
            this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2];
        }

        if (this.isCancelled && !this.hyperSpinStore.isActiveHyperSpin) {
            this.isCancelled = false;
        }

        if (this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Cancel") {
            this.hyperSpinStore.clearBatchData();
        }

        if (!this.hyperSpinStore.isActiveHyperSpin) {
            this.hyperSpinStore.setHyperSpinActive(false);
        }
    }

    closeHyperSpinBetControl() {
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

        if (this.hyperSpinStore.isActiveHyperSpin) {
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
        if (this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Playing") {
            return;
        }

        this.hyperSpinStore.isSettingsOpen = !this.hyperSpinStore.isSettingsOpen;
    }

    closeHyperSpinPopup() {
        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();
    }

    onClickPlayButton() {
        const isPaused = this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Paused";

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

    private isValidHyperSpinBet(): boolean {
        const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;
        const hasValidRounds = this.hyperSpinStore.selectedRoundOnPopup > 0;

        const isValidGameState = !this.gameState.isPlacingBet &&
            (this.gameState.cascadingState !== CascadingSlotState.SPINNING ||
                !this.hyperSpinStore.spinBatchData ||
                this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Ready" ||
                this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Cancel");

        const isNotActive = !this.hyperSpinStore.isActiveHyperSpin;

        const isValid = hasEnoughMoney && hasValidRounds && isValidGameState && isNotActive;

        return isValid;
    }

    private handleHyperSpinError() {
        const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;
        if (!hasEnoughMoney) {
            this.showNotEnoughMoneyForHyperSpin();
        }
        (this.uiHandler as any).resetBottomMessageState();
    }

    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betManager.totalBet}, Available: ${this.gameState.userBalance}`;
        this.noticeStore.addWarning(message);
    }

    private startHyperSpinWithCurrentSettings() {
        this.isCancelled = false;

        this.hyperSpinBatchStartTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(true);
        this.hyperSpinStore.startHyperSpinBatch();

        this.hyperSpinStore.startHyperSpinSessionTracking();

        (this.gameState as any).bottomMessageState = "HYPER_SPIN";
        this.placeHyperSpinBet();
    }

    private placeHyperSpinBet() {
        if (this.isCancelled) {
            return;
        }

        if (this.hyperSpinStore.isCascadeTrackingActive() && this.gameState.freeSpinsTotal > 0) {
            return;
        }

        this.lastSpinTimestamp = Date.now();

        if (this.gameState.freeSpinsTotal > 0) {
            if (this.hyperSpinStore.stopOnFeature) {
                this.stopHyperSpin();
                return;
            } else {
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

        if (success) {
        } else {
            const hasEnoughMoney = this.betManager.totalBet <= this.gameState.userBalance;

            if (!hasEnoughMoney) {
                this.stopHyperSpin();
            } else {
                if (!this.isCancelled && this.hyperSpinStore.isActiveHyperSpin) {
                    this.placeHyperSpinBet();
                }
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

        const roundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;
        if (roundsExhausted) {
            return true;
        }

        if (this.hyperSpinStore.stopOnFeature && this.gameState.freeSpinsTotal > 0) {
            return true;
        }

        if (this.hyperSpinStore.stopOnProfit > 0) {
            const profitConditionMet = currentProfit >= this.hyperSpinStore.stopOnProfit;

            if (profitConditionMet) {
                return true;
            }
        }

        if (this.hyperSpinStore.stopOnLoss > 0) {
            const lossConditionMet = currentLoss >= this.hyperSpinStore.stopOnLoss;

            if (lossConditionMet) {
                return true;
            }
        }

        return false;
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

        if (!isRoundsExhausted) {
            const batchAge = Date.now() - this.hyperSpinBatchStartTime;
            if (batchAge < 1000 && this.hyperSpinBatchStartTime > 0) {
                return;
            }
        }

        this.clearAllPendingTimeouts();

        this.hyperSpinBatchEndTime = Date.now();

        this.hyperSpinStore.setHyperSpinActive(false);
        this.hyperSpinStore.stopHyperSpinSessionTracking();
        this.hyperSpinStore.completeHyperSpinBatch();

        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        (this.gameState as any).bottomMessageState = SlotNotification.SETTLED;
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
        (this.gameState as any).bottomMessageState = SlotNotification.SETTLED;
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
            if (!this.isCancelled) {
                this.isBatchInterrupted = true;
                this.handleBatchInterruption();
            }
            return;
        }

        if (!this.isCancelled) {
            this.checkHyperSpinNextRound();
        }
    }

    private clearSettlementTimeoutIfNeeded() {
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            this.lastSettlementCheckTime = 0;
        }
    }

    private shouldSkipDueToFreeSpinsOrPause(): boolean {
        if (this.gameState.freeSpinsTotal > 0) {
            if (this.hyperSpinStore.stopOnFeature) {
                return true;
            } else {
                return false;
            }
        }

        if (this.hyperSpinStore.spinBatchData?.summary.hyperSpinStatus === "Paused") {
            return true;
        }

        return false;
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
            const timeoutId = window.setTimeout(() => {
                this.placeBetTimeout = null;
                if (!this.isCancelled) {
                    this.placeHyperSpinBet();
                }
            }, 0);
            this.placeBetTimeout = timeoutId;
        }
    }

    private handleBatchInterruption() {
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
        }

        this.lastSettlementCheckTime = 0;

        if (this.hyperSpinStore.spinBatchData) {
            this.hyperSpinStore.spinBatchData.summary.hyperSpinStatus = "Interrupted";
        }

        this.showBatchInterruptionMessage();
    }

    private showBatchInterruptionMessage() {
        const message = "Hyper-Spin batch was interrupted. You can resume or restart the batch.";
        if (this.noticeStore) {
            this.noticeStore.addWarning(message);
        }

        if (this.gameState) {
            (this.gameState as any).bottomMessageState = "HYPER_SPIN_INTERRUPTED";
        }
    }

    hasInterruptedBatch() {
        return !!(this.hyperSpinStore.spinBatchData &&
            this.hyperSpinStore.spinBatchData.summary.hyperSpinStatus === "Interrupted" &&
            this.hyperSpinStore.roundsHyperSpin > 0);
    }

    getInterruptedBatchInfo() {
        if (!this.hasInterruptedBatch()) {
            return null;
        }

        const batchData = this.hyperSpinStore.spinBatchData;
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

    cancelHyperSpin() {
        this.isCancelled = true;

        this.clearAllPendingTimeouts();

        if (this.hyperSpinBatchStartTime > 0 && this.hyperSpinBatchEndTime === 0) {
            this.hyperSpinBatchEndTime = Date.now();
        }

        this.hyperSpinStore.setHyperSpinActive(false);

        this.updateHyperSpinRounds(0);

        if (this.hyperSpinStore.spinBatchData) {
            this.hyperSpinStore.spinBatchData.summary.hyperSpinStatus = "Cancel";
        } else {
            this.hyperSpinStore.clearBatchData();
        }

        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;
        this.lastSettlementCheckTime = 0;

        this.isBatchInterrupted = false;
    }

    private clearAllPendingTimeouts() {
        let clearedCount = 0;

        if (this.checkNextRoundTimeout !== null) {
            clearTimeout(this.checkNextRoundTimeout);
            this.checkNextRoundTimeout = null;
            clearedCount++;
        }

        if (this.placeBetTimeout !== null) {
            clearTimeout(this.placeBetTimeout);
            this.placeBetTimeout = null;
            clearedCount++;
        }

        if (this.settlementWaitTimeout !== null) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
            clearedCount++;
        }

    }

    handleRecordSpinData(finishData: any) {
        if (!this.hyperSpinStore.isActiveHyperSpin || !finishData) {
            return; // Not in hyper-spin mode, skip recording
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



        const hasScatterTrigger = freeSpins > 0;
        const hasMultiplier = win > 0 && stake > 0 && (win / stake) > 1;


    }


    checkToStopFlashSpin(isFreeSpin: boolean) {
        const noMoreFreespin = this.hyperSpinStore.isActiveHyperSpin ||
            (this.gameState.freeSpinsTotal === 0 &&
                !this.gameState.isPlacingBet &&
                this.gameState.cascadingState !== CascadingSlotState.SPINNING);

        if (noMoreFreespin) {
            // Complete the cascade and record the accumulated data
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
