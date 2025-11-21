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

    /**
     * Open HyperSpin popup and set default rounds selection
     */
    openHyperSpinPopup() {

        this.hyperSpinStore.isOpenHyperSpinPopup = true;
        this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2]; // Default to 100 (index 2)

    }

    /**
     * Update the selected number of HyperSpin rounds
     * @param rounds - The number of rounds to set
     */
    updateHyperSpinRounds(rounds: number) {

        this.hyperSpinStore.selectedRoundOnPopup = rounds;

    }

    /**
     * Change HyperSpin rounds by step (increase or decrease)
     * Uses the predefined rounds list: [10, 50, 100, 500, 1000]
     * @param increase - true to increase, false to decrease
     */
    changeHyperSpinRounds(increase: boolean) {
        const currentRounds = this.hyperSpinStore.selectedRoundOnPopup;
        const roundsList = this.hyperSpinStore.roundsList;
        const currentIndex = roundsList.indexOf(currentRounds);

        if (increase) {
            if (currentIndex < roundsList.length - 1) {
                this.updateHyperSpinRounds(roundsList[currentIndex + 1]);
            }
        } else {
            if (currentIndex > 0) {
                this.updateHyperSpinRounds(roundsList[currentIndex - 1]);
            }
        }

    }

    /**
     * Confirm selected rounds and prepare to start HyperSpin
     */
    confirmHyperSpinRoundsAndStart() {
        const DELAY_HYPER_SPIN = 500;

        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        // Start HyperSpin after a delay
        setTimeout(() => {
            this.startHyperSpinWithRounds();
        }, DELAY_HYPER_SPIN);

    }

    /**
     * Start HyperSpin with the confirmed rounds
     */
    private startHyperSpinWithRounds() {

        // Set hyper-spin active using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(true);
        // TODO: Implement the actual HyperSpin logic here
        // This would typically trigger the HyperSpin game mode

    }

    /**
     * Show hyper spin bet control popup
     */
    showHyperSpinBetControl() {

        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = true;

    }

    /**
     * Close hyper spin bet control popup
     */
    closeHyperSpinBetControl() {

        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

    }

    /**
     * Change total bet using BetControlHandlers
     * @param increase - true to increase, false to decrease
     */
    changeTotalBet(increase: boolean) {
        this.betControlHandlers.changeTotalBet(increase);
    }

    /**
     * Set total bet from slider value
     * The slider value is normalized (0-1), so we need to convert it to total bet value based on min/max
     * @param sliderProgress - The slider progress value (0-1)
     */
    setTotalBetFromSlider(sliderProgress: number) {
        // Validate sliderProgress to prevent NaN
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const totalBetUnique = this.betControlStore.totalBetUnique;
        if (!totalBetUnique || totalBetUnique.length === 0) {
            return;
        }

        // Clamp sliderProgress to valid range (0-1)
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));

        // Extract min and max bet values from totalBetUnique array
        const betValues = totalBetUnique.map(item => +Object.keys(item)[0]);
        const minBet = Math.min(...betValues);
        const maxBet = Math.max(...betValues);

        // Convert slider progress (0-1) to actual bet value based on min/max
        const targetBetValue = minBet + (maxBet - minBet) * clampedProgress;

        // Find the closest index in totalBetUnique that matches or is closest to this bet value
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

        // Set the total bet index, which will automatically update the total bet value
        const oldIndex = this.betControlStore.currentTotalBetIndex;
        if (oldIndex !== clampedIndex) {
            const oldBetValue = oldIndex >= 0 && oldIndex < betValues.length ? betValues[oldIndex] : null;
            this.betControlStore.currentTotalBetIndex = clampedIndex;
        }
    }

    /**
     * Change stop on profit by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnProfit(increase: boolean) {
        this.hyperSpinStore.changeStopOnProfit(increase);
    }

    /**
     * Set stop on profit from slider value
     * The slider value is normalized (0-1), so we need to convert it to actual value
     * @param sliderProgress - The slider progress value (0-1)
     */
    setStopOnProfitFromSlider(sliderProgress: number) {
        // Validate sliderProgress to prevent NaN
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.hyperSpinStore.minStopOnProfit;
        const max = this.hyperSpinStore.maxStopOnProfit;
        // Clamp sliderProgress to valid range (0-1)
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        // Convert slider progress (0-1) to actual value
        const value = min + (max - min) * clampedProgress;
        // Log the calculated slider percentage and converted value
        const sliderPercentage = (clampedProgress * 100).toFixed(2);
        this.hyperSpinStore.setStopOnProfit(value);
    }

    /**
     * Change stop on loss by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnLoss(increase: boolean) {
        this.hyperSpinStore.changeStopOnLoss(increase);
    }

    /**
     * Set stop on loss from slider value
     * The slider value is normalized (0-1), so we need to convert it to actual value
     * @param sliderProgress - The slider progress value (0-1)
     */
    setStopOnLossFromSlider(sliderProgress: number) {
        // Validate sliderProgress to prevent NaN
        if (typeof sliderProgress !== "number" || isNaN(sliderProgress)) {
            return;
        }

        const min = this.hyperSpinStore.minStopOnLoss;
        const max = this.hyperSpinStore.maxStopOnLoss;
        // Clamp sliderProgress to valid range (0-1)
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        // Convert slider progress (0-1) to actual value
        const value = min + (max - min) * clampedProgress;
        // Log the calculated slider percentage and converted value
        const sliderPercentage = (clampedProgress * 100).toFixed(2);
        this.hyperSpinStore.setStopOnLoss(value);
    }

    /**
     * Toggle stop on feature state
     */
    toggleStopOnFeature() {

        this.hyperSpinStore.stopOnFeature = !this.hyperSpinStore.stopOnFeature;

    }

    /**
     * Close HyperSpin popup and cancel any pending HyperSpin
     */
    closeHyperSpinPopup() {

        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();

    }

    /**
     * Handle play button click - start hyper-spin with current settings
     */
    onClickPlayButton() {
        const isPaused = this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused";

        // Debug: Check hyperSpinStore injection

        // Determine action based on current state
        if (this.hyperSpinStore.isHyperSpin) {
            if (isPaused) {
                // Hyper-spin is running but paused - resume it
                this.resumeHyperSpinBatch();
                return;
            } else {
                // Hyper-spin is running and active - ignore click
                return;
            }
        }

        // Validate bet conditions using data from hyper-spin popup
        if (!this.isValidHyperSpinBet()) {
            this.handleHyperSpinError();
            return;
        }

        // Hyper-spin is not running - start a new batch

        // Set roundsHyperSpin from selectedRoundOnPopup before starting
        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;

        // Keep bet control popup open during hyper-spin execution for progress monitoring
        // this.closeHyperSpinBetControl(); // Commented out to keep popup open
        this.startHyperSpinWithCurrentSettings();

    }

    /**
     * Validate if hyper-spin can be started with current settings
     * Uses data directly from hyper-spin popup (selectedRoundOnPopup) instead of roundsHyperSpin
     */
    private isValidHyperSpinBet(): boolean {
        // Check if player has enough balance for at least one round
        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            return false;
        }

        // Check if rounds are set using selectedRoundOnPopup from the hyper-spin popup
        const hasValidRounds = this.hyperSpinStore.selectedRoundOnPopup > 0;
        if (!hasValidRounds) {
            return false;
        }

        // Check if game is in valid state to start hyper-spin
        // Allow hyper-spin start even during spinning if a batch has just completed
        const isValidGameState = !this.cascadingUIStore.isPlacingBet &&
            (this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING ||
                (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready"));
        if (!isValidGameState) {
            return false;
        }

        return true;
    }

    /**
     * Handle hyper-spin validation errors
     */
    private handleHyperSpinError() {

        // Show appropriate error message based on the validation failure
        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            // Show not enough money message
            this.showNotEnoughMoneyForHyperSpin();
        }

        // You could add more specific error handling here
        this.cascadingUIHandler.resetBottomMessageState();
    }

    /**
     * Show not enough money message for hyper-spin
     */
    private showNotEnoughMoneyForHyperSpin() {
        const message = `Not enough balance for Hyper-Spin. Required: ${this.betControlStore.totalBet}, Available: ${this.cascadingUIStore.userBalance}`;
        this.noticeStore.addWarning(message);
    }

    /**
     * Start hyper-spin with current settings from bet control popup
     */
    private startHyperSpinWithCurrentSettings() {
        // Record batch start time
        this.hyperSpinBatchStartTime = Date.now();
        const startTimestamp = new Date(this.hyperSpinBatchStartTime).toISOString();

        // Debug: Check if hyperSpinStore has the method

        // Set hyper-spin active using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(true);

        // Initialize batch data tracking
        this.hyperSpinStore.initializeHyperSpinBatch();
        this.hyperSpinStore.startHyperSpinBatch();

        // Start tracking profit/loss for this session
        try {
            if (typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function') {
                this.hyperSpinStore.startHyperSpinSessionTracking();
            } else if (typeof this.hyperSpinStore.initializeHyperSpinTrackingFallback === 'function') {
                this.hyperSpinStore.initializeHyperSpinTrackingFallback();
            } else {
                // Continue execution even if tracking fails
            }
        } catch (error) {
            // Continue execution even if tracking fails
        }

        // Update UI state to show hyper-spin is active
        this.cascadingUIStore.bottomMessageState = "HYPER_SPIN";

        // Place first bet to start the hyper-spin process
        this.placeHyperSpinBet();

    }

    /**
     * Place a bet during hyper-spin session
     */
    private placeHyperSpinBet() {
        const spinStartTime = Date.now();
        this.lastSpinTimestamp = spinStartTime;

        // Safety check: Don't place bet or decrement rounds if free spins are active
        // Free spin rounds should NOT count toward hyper-spin round count
        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            return; // Don't place bet or decrement rounds during free spins
        }

        // Check stop conditions before placing bet
        if (this.shouldStopHyperSpin()) {
            this.stopHyperSpin();
            return;
        }

        // Use the current total bet amount for this spin
        const originalTotalBet = this.betControlStore.totalBet;

        // Place the bet using the slot bet handler
        this.cascadingUIHandler.handleNewRound();
        const success = this.slotBetHandler.handle();

        // Restore original bet amount
        this.betControlStore.totalBet = originalTotalBet;

        const betPlacementEndTime = Date.now();

        if (success) {
            // Decrement remaining rounds ONLY for paid spins (not free spins)
            // Free spin rounds are handled separately and do NOT count toward hyper-spin rounds
            const previousRounds = this.hyperSpinStore.roundsHyperSpin;
            this.hyperSpinStore.roundsHyperSpin--;

            const betPlacementDuration = betPlacementEndTime - spinStartTime;

            // Check if hyper-spin should continue after this bet
            if (this.hyperSpinStore.roundsHyperSpin <= 0) {
                this.completeHyperSpin();
            } else {
                // Continue with next round after settlement completes
                // Instead of using timeout, rely on the game's settlement completion mechanism
                // The game's checkNextRound will be triggered when isFreeSpinEffectCompleted becomes true
                // This ensures proper timing and prevents UI state conflicts
            }
        } else {
            const roundsCompleted = Math.max(0, (this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup) - this.hyperSpinStore.roundsHyperSpin);
            this.stopHyperSpin();
        }
    }

    /**
     * Get the reason why hyper spin should stop (for debugging)
     */
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

    /**
     * Check if hyper-spin should stop based on stop conditions
     */
    private shouldStopHyperSpin(): boolean {
        const currentProfit = this.calculateCurrentProfit();
        const currentLoss = this.calculateCurrentLoss();

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

    /**
     * Calculate current loss during hyper-spin session
     */
    private calculateCurrentLoss(): number {
        // Update tracking before returning value
        this.hyperSpinStore.updateHyperSpinProfitLoss();
        return this.hyperSpinStore.getCurrentHyperSpinLoss();
    }

    /**
     * Stop hyper-spin due to stop conditions or error
     */
    private stopHyperSpin() {
        // Record batch end time and calculate duration
        this.hyperSpinBatchEndTime = Date.now();
        const batchDuration = this.hyperSpinBatchStartTime > 0 ? this.hyperSpinBatchEndTime - this.hyperSpinBatchStartTime : 0;
        const endTimestamp = new Date(this.hyperSpinBatchEndTime).toISOString();

        const finalProfit = this.calculateCurrentProfit();
        const finalLoss = this.calculateCurrentLoss();
        const stopReason = this.getStopReason();

        // Determine completion type based on stop reason
        let completionType = "STOPPED";
        if (stopReason.includes("All rounds completed")) {
            completionType = "COMPLETED";
        } else if (stopReason.includes("Profit reached")) {
            completionType = "PROFIT_TARGET";
        } else if (stopReason.includes("Loss reached")) {
            completionType = "LOSS_LIMIT";
        } else if (stopReason.includes("Bet placement failed")) {
            completionType = "ERROR";
        }

        // Set hyper-spin inactive using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(false);

        // Stop profit/loss tracking
        this.hyperSpinStore.stopHyperSpinSessionTracking();

        // Complete batch tracking
        this.hyperSpinStore.completeHyperSpinBatch();

        this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;

        // Reset timing variables for next batch
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        // Show completion message
        this.showHyperSpinStoppedMessage();
    }

    /**
     * Complete hyper-spin when all rounds are finished
     */
    private completeHyperSpin() {
        // Record batch end time and calculate duration
        this.hyperSpinBatchEndTime = Date.now();
        const batchDuration = this.hyperSpinBatchStartTime > 0 ? this.hyperSpinBatchEndTime - this.hyperSpinBatchStartTime : 0;
        const endTimestamp = new Date(this.hyperSpinBatchEndTime).toISOString();

        const finalProfit = this.calculateCurrentProfit();
        const finalLoss = this.calculateCurrentLoss();
        const totalRoundsCompleted = this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup;
        const initialBalance = this.hyperSpinStore.hyperSpinInitialBalance;
        const finalBalance = this.cascadingUIStore.userBalance;
        const netResult = finalBalance - initialBalance;

        // Set hyper-spin inactive using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(false);

        // Stop profit/loss tracking
        this.hyperSpinStore.stopHyperSpinSessionTracking();

        // Complete batch tracking
        this.hyperSpinStore.completeHyperSpinBatch();

        this.hyperSpinStore.roundsHyperSpin = 0;
        this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;

        // Reset timing variables for next batch
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        // Show completion message
        this.showHyperSpinCompletedMessage();
    }

    /**
     * Show message when hyper-spin is stopped
     */
    private showHyperSpinStoppedMessage() {
        const message = "Hyper-Spin stopped due to stop conditions.";
        this.noticeStore.addWarning(message);
    }

    /**
     * Show message when hyper-spin is completed
     */
    private showHyperSpinCompletedMessage() {
        const message = "Hyper-Spin completed successfully!";
        this.noticeStore.addWarning(message);
    }

    /**
     * Pause hyper-spin batch
     */
    pauseHyperSpinBatch() {

        // Pause the batch by setting status to Paused
        this.hyperSpinStore.pauseHyperSpinBatch();

    }

    /**
     * Resume hyper-spin batch from paused state
     */
    resumeHyperSpinBatch() {

        // Resume the batch by setting status to Playing
        this.hyperSpinStore.resumeHyperSpinBatch();

        // Continue with the next round immediately
        this.checkHyperSpinNextRound();

    }

    /**
     * Handle next round in hyper-spin (called after bet settlement)
     */
    private lastSpinTimestamp: number = 0;

    checkHyperSpinNextRound() {
        const currentTime = Date.now();
        const timeSinceLastSpin = this.lastSpinTimestamp > 0 ? currentTime - this.lastSpinTimestamp : 0;

        // Check for batch interruption first
        if (this.isBatchInterrupted) {
            this.handleBatchInterruption();
            return;
        }

        if (this.hyperSpinStore.isHyperSpin) {

            // Wait for settlement effects to complete before continuing
            // Skip this check when stopOnFeature is false (hyper-spin mode optimization)
            if (this.hyperSpinStore.stopOnFeature !== false && !this.cascadingUIStore.isFreeSpinEffectCompleted) {
                // Check for timeout protection
                if (this.lastSettlementCheckTime === 0) {
                    this.lastSettlementCheckTime = currentTime;
                }

                const timeWaiting = currentTime - this.lastSettlementCheckTime;
                if (timeWaiting >= this.SETTLEMENT_WAIT_TIMEOUT_MS) {

                    this.isBatchInterrupted = true;
                    this.handleBatchInterruption();
                    return;
                }

                // Set up timeout protection
                if (!this.settlementWaitTimeout) {
                    this.settlementWaitTimeout = window.setTimeout(() => {
                        this.isBatchInterrupted = true;
                        this.handleBatchInterruption();
                    }, this.SETTLEMENT_WAIT_TIMEOUT_MS);
                }

                // Retry immediately for maximum hyper-spin speed
                setTimeout(() => {
                    this.checkHyperSpinNextRound();
                }, 0);
                return;
            }

            // Clear timeout if settlement is completed
            if (this.settlementWaitTimeout) {
                clearTimeout(this.settlementWaitTimeout);
                this.settlementWaitTimeout = null;
                this.lastSettlementCheckTime = 0;
            }

            // If free spins are active, let the normal free spin flow handle bet placement
            // Don't place bet here to avoid conflicts with checkSpinNextRound()
            // IMPORTANT: Free spin rounds do NOT count toward hyper-spin round count
            // Always check for free spins regardless of stopOnFeature setting
            if (this.cascadingUIStore.freeSpinsTotal > 0) {

                // In hyper-spin mode, free spins should auto-progress without UI effects
                // If effects are not completed, wait for them, otherwise continue free spins
                if (!this.cascadingUIStore.isFreeSpinEffectCompleted) {
                    // Wait for effects to complete
                    return;
                } else {
                    // Effects completed, continue with next free spin round
                    // The checkSpinNextRound will handle placing the next free spin bet
                    return;
                }
            }

            // Check if hyper-spin is paused - do this early to prevent any further processing
            if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused") {
                return; // Don't continue while paused
            }

            // Check if we should continue or stop (only when free spins are not active)
            if (this.shouldStopHyperSpin()) {
                this.stopHyperSpin();
            } else {
                // Continue with next bet after ensuring settlement is complete
                setTimeout(() => {
                    this.placeHyperSpinBet();
                }, 0); // Hyper-spin maximum speed - no delay
            }
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

    /**
     * Attempt to recover interrupted batch
     */
    recoverInterruptedBatch(): boolean {
        if (!this.hyperSpinStore.currentBatchData ||
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus !== "Interrupted") {
            return false;
        }

        // Reset interruption state
        this.isBatchInterrupted = false;

        // Resume the batch
        if (this.hyperSpinStore.currentBatchData) {
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Playing";
        }

        // Clear any pending timeouts
        if (this.settlementWaitTimeout) {
            clearTimeout(this.settlementWaitTimeout);
            this.settlementWaitTimeout = null;
        }

        // Continue with next round
        this.checkHyperSpinNextRound();

        return true;
    }

    /**
     * Public method to check if there's an interrupted batch available for recovery
     */
    hasInterruptedBatch(): boolean {
        return !!(this.hyperSpinStore.currentBatchData &&
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus === "Interrupted" &&
            this.hyperSpinStore.roundsHyperSpin > 0);
    }

    /**
     * Get interrupted batch information for display
     */
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

        // Clear batch data
        this.hyperSpinStore.clearBatchData();

        // Reset timing variables for next batch
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

    }

    /**
     * Record spin data for hyper-spin batch
     * Called from settlement handler when a spin completes
     * This method can be called via @handle decorator
     * @param finishData - Settlement data from the game
     */
    handleRecordSpinData(finishData: any) {
        return this.recordSpinData(finishData);
    }

    /**
     * Record spin data for hyper-spin batch
     * Called from settlement handler when a spin completes
     * @param finishData - Settlement data from the game
     */
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

    }
}
