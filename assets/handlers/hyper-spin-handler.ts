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
        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] clickHyperSpin called", {
            dialogName: DialogName.HYPER_SPIN,
            timestamp: new Date().toISOString()
        });

        this.cascadingUIHandler.triggerOpenDialog(DialogName.HYPER_SPIN);
        this.showHyperSpinBetControl();

        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] clickHyperSpin completed - dialog triggered and bet control shown", {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Open HyperSpin popup and set default rounds selection
     */
    openHyperSpinPopup() {
        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] openHyperSpinPopup called", {
            previousState: this.hyperSpinStore.isOpenHyperSpinPopup,
            roundsList: this.hyperSpinStore.roundsList,
            defaultSelectionIndex: 2,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.isOpenHyperSpinPopup = true;
        this.hyperSpinStore.selectedRoundOnPopup = this.hyperSpinStore.roundsList[2]; // Default to 100 (index 2)

        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] openHyperSpinPopup completed", {
            isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
            selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update the selected number of HyperSpin rounds
     * @param rounds - The number of rounds to set
     */
    updateHyperSpinRounds(rounds: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] updateHyperSpinRounds called", {
            previousRounds: this.hyperSpinStore.selectedRoundOnPopup,
            newRounds: rounds,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.selectedRoundOnPopup = rounds;

        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] updateHyperSpinRounds completed", {
            selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });
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

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.changeHyperSpinRounds() - Changing rounds", {
            increase,
            currentRounds,
            currentIndex,
            roundsList,
            timestamp: new Date().toISOString()
        });

        if (increase) {
            if (currentIndex < roundsList.length - 1) {
                this.updateHyperSpinRounds(roundsList[currentIndex + 1]);
            }
        } else {
            if (currentIndex > 0) {
                this.updateHyperSpinRounds(roundsList[currentIndex - 1]);
            }
        }

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.changeHyperSpinRounds() - Rounds changed successfully", {
            newRounds: this.hyperSpinStore.selectedRoundOnPopup
        });
    }

    /**
     * Confirm selected rounds and prepare to start HyperSpin
     */
    confirmHyperSpinRoundsAndStart() {
        const DELAY_HYPER_SPIN = 500;

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.confirmHyperSpinRoundsAndStart() - Confirming rounds and starting", {
            selectedRounds: this.hyperSpinStore.selectedRoundOnPopup,
            delay: DELAY_HYPER_SPIN,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;

        // Start HyperSpin after a delay
        setTimeout(() => {
            this.startHyperSpinWithRounds();
        }, DELAY_HYPER_SPIN);

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.confirmHyperSpinRoundsAndStart() - Confirmation completed", {
            roundsHyperSpin: this.hyperSpinStore.roundsHyperSpin,
            isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup
        });
    }

    /**
     * Start HyperSpin with the confirmed rounds
     */
    private startHyperSpinWithRounds() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.startHyperSpinWithRounds() - Starting HyperSpin", {
            rounds: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Set hyper-spin active using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(true);
        // TODO: Implement the actual HyperSpin logic here
        // This would typically trigger the HyperSpin game mode

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.startHyperSpinWithRounds() - HyperSpin started successfully");
    }

    /**
     * Show hyper spin bet control popup
     */
    showHyperSpinBetControl() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.showHyperSpinBetControl() - Showing hyper spin bet control popup", {
            previousState: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = true;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.showHyperSpinBetControl() - Hyper spin bet control popup state set to true", {
            isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup
        });
    }

    /**
     * Close hyper spin bet control popup
     */
    closeHyperSpinBetControl() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.closeHyperSpinBetControl() - Closing hyper spin bet control popup", {
            previousState: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.closeHyperSpinBetControl() - Hyper spin bet control popup closed successfully");
    }

    /**
     * Change total bet using BetControlHandlers
     * @param increase - true to increase, false to decrease
     */
    changeTotalBet(increase: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.changeTotalBet() - Using BetControlHandlers", { increase });
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
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setTotalBetFromSlider called with invalid progress", { sliderProgress });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setTotalBetFromSlider called", { sliderProgress });

        const totalBetUnique = this.betControlStore.totalBetUnique;
        if (!totalBetUnique || totalBetUnique.length === 0) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setTotalBetFromSlider - totalBetUnique is empty");
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

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler calculated index from bet value", {
            sliderProgress,
            clampedProgress,
            sliderPercentage: `${(clampedProgress * 100).toFixed(2)}%`,
            minBet,
            maxBet,
            targetBetValue,
            closestIndex,
            clampedIndex,
            closestBetValue: betValues[clampedIndex],
            currentIndex: this.betControlStore.currentTotalBetIndex,
            currentBetValue: this.betControlStore.totalBet
        });

        // Set the total bet index, which will automatically update the total bet value
        const oldIndex = this.betControlStore.currentTotalBetIndex;
        if (oldIndex !== clampedIndex) {
            const oldBetValue = oldIndex >= 0 && oldIndex < betValues.length ? betValues[oldIndex] : null;
            this.betControlStore.currentTotalBetIndex = clampedIndex;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler total bet index updated", {
                from: oldIndex,
                to: clampedIndex,
                fromBetValue: oldBetValue,
                toBetValue: betValues[clampedIndex],
                newTotalBet: this.betControlStore.totalBet
            });
        }
    }


    /**
     * Change stop on profit by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnProfit(increase: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.changeStopOnProfit called", { increase });
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
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setStopOnProfitFromSlider called with invalid progress", { sliderProgress });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setStopOnProfitFromSlider called", { sliderProgress });
        const min = this.hyperSpinStore.minStopOnProfit;
        const max = this.hyperSpinStore.maxStopOnProfit;
        // Clamp sliderProgress to valid range (0-1)
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        // Convert slider progress (0-1) to actual value
        const value = min + (max - min) * clampedProgress;
        // Log the calculated slider percentage and converted value
        const sliderPercentage = (clampedProgress * 100).toFixed(2);
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler calculated value", {
            min,
            max,
            sliderProgress,
            clampedProgress,
            sliderPercentage: `${sliderPercentage}%`,
            calculatedValue: value,
            roundedValue: Math.round(value * 100) / 100
        });
        this.hyperSpinStore.setStopOnProfit(value);
    }

    /**
     * Change stop on loss by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnLoss(increase: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.changeStopOnLoss called", { increase });
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
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setStopOnLossFromSlider called with invalid progress", { sliderProgress });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler.setStopOnLossFromSlider called", { sliderProgress });
        const min = this.hyperSpinStore.minStopOnLoss;
        const max = this.hyperSpinStore.maxStopOnLoss;
        // Clamp sliderProgress to valid range (0-1)
        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        // Convert slider progress (0-1) to actual value
        const value = min + (max - min) * clampedProgress;
        // Log the calculated slider percentage and converted value
        const sliderPercentage = (clampedProgress * 100).toFixed(2);
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] HyperSpinHandler calculated value", {
            min,
            max,
            sliderProgress,
            clampedProgress,
            sliderPercentage: `${sliderPercentage}%`,
            calculatedValue: value,
            roundedValue: Math.round(value * 100) / 100
        });
        this.hyperSpinStore.setStopOnLoss(value);
    }

    /**
     * Toggle stop on feature state
     */
    toggleStopOnFeature() {
        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] toggleStopOnFeature called", {
            previousState: this.hyperSpinStore.stopOnFeature,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.stopOnFeature = !this.hyperSpinStore.stopOnFeature;

        cascadingSlotLogger.info("[HYPER_SPIN_HANDLER] toggleStopOnFeature completed", {
            newState: this.hyperSpinStore.stopOnFeature,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Close HyperSpin popup and cancel any pending HyperSpin
     */
    closeHyperSpinPopup() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.closeHyperSpinPopup() - Closing popup", {
            previousState: this.hyperSpinStore.isOpenHyperSpinPopup,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.cancelHyperSpin();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.closeHyperSpinPopup() - Popup closed successfully");
    }

    /**
     * Handle play button click - start hyper-spin with current settings
     */
    onClickPlayButton() {
        const isPaused = this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused";

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Play/Resume button clicked", {
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            isPaused,
            batchStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
            selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
            roundsHyperSpin: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            stopOnProfit: this.hyperSpinStore.stopOnProfit,
            stopOnLoss: this.hyperSpinStore.stopOnLoss,
            timestamp: new Date().toISOString()
        });

        // Debug: Check hyperSpinStore injection
        cascadingSlotLogger.debug("[HYPER_SPIN_DEBUG] hyperSpinStore injection check", {
            hyperSpinStoreExists: !!this.hyperSpinStore,
            hyperSpinStoreType: typeof this.hyperSpinStore,
            constructorName: this.hyperSpinStore?.constructor?.name,
            hasMethod: typeof this.hyperSpinStore?.startHyperSpinSessionTracking === 'function'
        });

        // Determine action based on current state
        if (this.hyperSpinStore.isHyperSpin) {
            if (isPaused) {
                // Hyper-spin is running but paused - resume it
                cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Resuming paused hyper-spin batch", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    timestamp: new Date().toISOString()
                });
                this.resumeHyperSpinBatch();
                return;
            } else {
                // Hyper-spin is running and active - ignore click
                cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Hyper-spin already running, ignoring click");
                return;
            }
        }

        // Validate bet conditions using data from hyper-spin popup
        if (!this.isValidHyperSpinBet()) {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Invalid bet conditions, cannot start hyper-spin");
            this.handleHyperSpinError();
            return;
        }

        // Hyper-spin is not running - start a new batch
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Starting new hyper-spin batch", {
            selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });

        // Set roundsHyperSpin from selectedRoundOnPopup before starting
        this.hyperSpinStore.roundsHyperSpin = this.hyperSpinStore.selectedRoundOnPopup;
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - Set roundsHyperSpin from selectedRoundOnPopup", {
            selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup,
            roundsHyperSpin: this.hyperSpinStore.roundsHyperSpin
        });

        // Keep bet control popup open during hyper-spin execution for progress monitoring
        // this.closeHyperSpinBetControl(); // Commented out to keep popup open
        this.startHyperSpinWithCurrentSettings();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.onClickPlayButton() - New hyper-spin batch started successfully");
    }

    /**
     * Validate if hyper-spin can be started with current settings
     * Uses data directly from hyper-spin popup (selectedRoundOnPopup) instead of roundsHyperSpin
     */
    private isValidHyperSpinBet(): boolean {
        // Check if player has enough balance for at least one round
        const hasEnoughMoney = this.betControlStore.totalBet <= this.cascadingUIStore.userBalance;
        if (!hasEnoughMoney) {
            cascadingSlotLogger.info("[HYPER_SPIN_VALIDATION] Not enough money for hyper-spin", {
                totalBet: this.betControlStore.totalBet,
                userBalance: this.cascadingUIStore.userBalance
            });
            return false;
        }

        // Check if rounds are set using selectedRoundOnPopup from the hyper-spin popup
        const hasValidRounds = this.hyperSpinStore.selectedRoundOnPopup > 0;
        if (!hasValidRounds) {
            cascadingSlotLogger.info("[HYPER_SPIN_VALIDATION] Invalid rounds for hyper-spin", {
                selectedRoundOnPopup: this.hyperSpinStore.selectedRoundOnPopup
            });
            return false;
        }

        // Check if game is in valid state to start hyper-spin
        // Allow hyper-spin start even during spinning if a batch has just completed
        const isValidGameState = !this.cascadingUIStore.isPlacingBet &&
            (this.cascadingUIStore.cascadingState !== CascadingSlotState.SPINNING ||
                (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Ready"));
        if (!isValidGameState) {
            cascadingSlotLogger.info("[HYPER_SPIN_VALIDATION] Invalid game state for hyper-spin", {
                isPlacingBet: this.cascadingUIStore.isPlacingBet,
                cascadingState: this.cascadingUIStore.cascadingState,
                hyperSpinStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
                batchDataExists: !!this.hyperSpinStore.currentBatchData,
                reason: this.cascadingUIStore.isPlacingBet ?
                    "Currently placing a bet" :
                    "Game is spinning and no completed hyper-spin batch ready"
            });
            return false;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_VALIDATION] Game state validation passed", {
            isPlacingBet: this.cascadingUIStore.isPlacingBet,
            cascadingState: this.cascadingUIStore.cascadingState,
            hyperSpinStatus: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
            validationReason: this.cascadingUIStore.cascadingState === CascadingSlotState.SPINNING ?
                "Allowed due to completed hyper-spin batch" :
                "Normal game state validation"
        });

        return true;
    }

    /**
     * Handle hyper-spin validation errors
     */
    private handleHyperSpinError() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.handleHyperSpinError() - Handling hyper-spin error");

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
        cascadingSlotLogger.error("[HYPER_SPIN_ERROR] " + message);
        this.noticeStore.addWarning(message);
    }

    /**
     * Start hyper-spin with current settings from bet control popup
     */
    private startHyperSpinWithCurrentSettings() {
        // Record batch start time
        this.hyperSpinBatchStartTime = Date.now();
        const startTimestamp = new Date(this.hyperSpinBatchStartTime).toISOString();

        cascadingSlotLogger.warn("🚀 🚀 🚀 [HYPER_SPIN_BATCH_TIMING] HYPER-SPIN BATCH START 🚀 🚀 🚀", {
            rounds: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            stopOnProfit: this.hyperSpinStore.stopOnProfit,
            stopOnLoss: this.hyperSpinStore.stopOnLoss,
            batchStartTime: startTimestamp,
            timestamp: startTimestamp
        });

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.startHyperSpinWithCurrentSettings() - Starting hyper-spin", {
            rounds: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            stopOnProfit: this.hyperSpinStore.stopOnProfit,
            stopOnLoss: this.hyperSpinStore.stopOnLoss,
            timestamp: startTimestamp
        });

        // Debug: Check if hyperSpinStore has the method
        cascadingSlotLogger.debug("[HYPER_SPIN_DEBUG] Checking hyperSpinStore methods", {
            hasStartTracking: typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function',
            hyperSpinStoreType: typeof this.hyperSpinStore,
            hyperSpinStoreKeys: this.hyperSpinStore ? Object.keys(this.hyperSpinStore).slice(0, 10) : 'null'
        });

        // Set hyper-spin active using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(true);

        // Initialize batch data tracking
        this.hyperSpinStore.initializeHyperSpinBatch();
        this.hyperSpinStore.startHyperSpinBatch();

        cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper spin started", {
            totalRounds: this.hyperSpinStore.roundsHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            timestamp: new Date().toISOString()
        });

        // Start tracking profit/loss for this session
        try {
            if (typeof this.hyperSpinStore.startHyperSpinSessionTracking === 'function') {
                this.hyperSpinStore.startHyperSpinSessionTracking();
            } else if (typeof this.hyperSpinStore.initializeHyperSpinTrackingFallback === 'function') {
                cascadingSlotLogger.warn("[HYPER_SPIN_WARNING] startHyperSpinSessionTracking method not found, using fallback method");
                this.hyperSpinStore.initializeHyperSpinTrackingFallback();
            } else {
                cascadingSlotLogger.error("[HYPER_SPIN_ERROR] Neither startHyperSpinSessionTracking nor initializeHyperSpinTrackingFallback methods found on hyperSpinStore", {
                    hyperSpinStore: this.hyperSpinStore,
                    constructor: this.hyperSpinStore?.constructor?.name,
                    availableMethods: Object.getOwnPropertyNames(this.hyperSpinStore).filter(name => typeof this.hyperSpinStore[name] === 'function').slice(0, 10)
                });
                // Continue execution even if tracking fails
            }
        } catch (error) {
            cascadingSlotLogger.error("[HYPER_SPIN_ERROR] Error starting hyper-spin session tracking", error);
            // Continue execution even if tracking fails
        }

        // Update UI state to show hyper-spin is active
        this.cascadingUIStore.bottomMessageState = "HYPER_SPIN";

        // Place first bet to start the hyper-spin process
        this.placeHyperSpinBet();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.startHyperSpinWithCurrentSettings() - Hyper-spin initialized and first bet placed");
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
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] placeHyperSpinBet() - Free spins active, skipping bet placement", {
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                reason: "Free spin rounds do not count toward hyper-spin rounds",
                timestamp: new Date().toISOString()
            });
            return; // Don't place bet or decrement rounds during free spins
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TIMING] placeHyperSpinBet() - SPIN START", {
            spinNumber: this.hyperSpinStore.roundsHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            totalBet: this.betControlStore.totalBet,
            currentProfit: this.calculateCurrentProfit(),
            currentLoss: this.calculateCurrentLoss(),
            freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
            spinStartTime: new Date(spinStartTime).toISOString(),
            timestamp: new Date().toISOString()
        });

        // Check stop conditions before placing bet
        if (this.shouldStopHyperSpin()) {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.placeHyperSpinBet() - Stop conditions met, stopping hyper-spin");
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

            cascadingSlotLogger.info("[HYPER_SPIN_TIMING] placeHyperSpinBet() - BET PLACEMENT SUCCESSFUL (Paid Spin)", {
                spinNumber: previousRounds,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                betPlacementDuration: `${betPlacementDuration}ms`,
                betPlacementEndTime: new Date(betPlacementEndTime).toISOString(),
                note: "This is a paid spin - free spins do not count toward round count"
            });

            cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Round completed (Paid S pin)", {
                roundNumber: previousRounds,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                totalRounds: this.hyperSpinStore.roundsHyperSpin + (previousRounds - this.hyperSpinStore.roundsHyperSpin),
                progress: `${((previousRounds - this.hyperSpinStore.roundsHyperSpin) / previousRounds * 100).toFixed(1)}%`,
                timestamp: new Date().toISOString()
            });

            // Check if hyper-spin should continue after this bet
            if (this.hyperSpinStore.roundsHyperSpin <= 0) {
                cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.placeHyperSpinBet() - All rounds completed, stopping hyper-spin");
                this.completeHyperSpin();
            } else {
                // Continue with next round after settlement completes
                cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.placeHyperSpinBet() - Continuing to next round", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin
                });
                // Instead of using timeout, rely on the game's settlement completion mechanism
                // The game's checkNextRound will be triggered when isFreeSpinEffectCompleted becomes true
                // This ensures proper timing and prevents UI state conflicts
                cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.placeHyperSpinBet() - Waiting for settlement completion");
            }
        } else {
            const roundsCompleted = Math.max(0, (this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup) - this.hyperSpinStore.roundsHyperSpin);
            cascadingSlotLogger.error("[HYPER_SPIN_ERROR] HyperSpinHandler.placeHyperSpinBet() - Bet placement failed, stopping hyper-spin", {
                errorType: "BET_PLACEMENT_FAILURE",
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                roundsCompleted: roundsCompleted,
                roundsAttempted: roundsCompleted + 1, // This was the failed attempt
                currentProfit: this.calculateCurrentProfit(),
                currentLoss: this.calculateCurrentLoss(),
                userBalance: this.cascadingUIStore.userBalance,
                betAmount: this.betControlStore.totalBet,
                balanceAfterBetAttempt: this.cascadingUIStore.userBalance,
                hasEnoughBalance: this.cascadingUIStore.userBalance >= this.betControlStore.totalBet,
                possibleCauses: [
                    "Insufficient balance",
                    "Network error",
                    "Server error",
                    "Invalid bet amount",
                    "Game state error"
                ],
                timestamp: new Date().toISOString()
            });
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

        cascadingSlotLogger.info("[HYPER_SPIN_STOP_CHECK] Checking stop conditions", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            currentProfit,
            currentLoss,
            stopOnProfit: this.hyperSpinStore.stopOnProfit,
            stopOnLoss: this.hyperSpinStore.stopOnLoss,
            stopOnFeature: this.hyperSpinStore.stopOnFeature,
            freeSpinsActive: this.cascadingUIStore.freeSpinsTotal > 0,
            freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
            userBalance: this.cascadingUIStore.userBalance,
            totalBet: this.betControlStore.totalBet,
            timestamp: new Date().toISOString()
        });

        if (this.hyperSpinStore.stopOnFeature && this.cascadingUIStore.freeSpinsTotal > 0) {
            cascadingSlotLogger.info("[HYPER_SPIN_STOP_CONDITION] Free spins active - continuing hyper-spin batch", {
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                currentProfit,
                currentLoss,
                timestamp: new Date().toISOString()
            });
            return false;
        }

        // Check profit stop condition
        if (this.hyperSpinStore.stopOnProfit > 0) {
            const profitConditionMet = currentProfit >= this.hyperSpinStore.stopOnProfit;
            cascadingSlotLogger.debug("[HYPER_SPIN_STOP_CONDITION] Profit stop condition check", {
                currentProfit,
                stopOnProfit: this.hyperSpinStore.stopOnProfit,
                conditionMet: profitConditionMet,
                remainingToTarget: Math.max(0, this.hyperSpinStore.stopOnProfit - currentProfit)
            });

            if (profitConditionMet) {
                cascadingSlotLogger.warn("[HYPER_SPIN_STOP_CONDITION] Profit stop condition met - stopping hyper-spin", {
                    currentProfit,
                    stopOnProfit: this.hyperSpinStore.stopOnProfit,
                    profitExceededBy: currentProfit - this.hyperSpinStore.stopOnProfit,
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    roundsCompleted: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] - this.hyperSpinStore.roundsHyperSpin,
                    sessionDuration: this.hyperSpinBatchStartTime > 0 ? Date.now() - this.hyperSpinBatchStartTime : 0,
                    totalBet: this.betControlStore.totalBet,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
        }

        // Check loss stop condition
        if (this.hyperSpinStore.stopOnLoss > 0) {
            const lossConditionMet = currentLoss >= this.hyperSpinStore.stopOnLoss;
            cascadingSlotLogger.debug("[HYPER_SPIN_STOP_CONDITION] Loss stop condition check", {
                currentLoss,
                stopOnLoss: this.hyperSpinStore.stopOnLoss,
                conditionMet: lossConditionMet,
                remainingToLimit: Math.max(0, this.hyperSpinStore.stopOnLoss - currentLoss)
            });

            if (lossConditionMet) {
                cascadingSlotLogger.warn("[HYPER_SPIN_STOP_CONDITION] Loss stop condition met - stopping hyper-spin", {
                    currentLoss,
                    stopOnLoss: this.hyperSpinStore.stopOnLoss,
                    lossExceededBy: currentLoss - this.hyperSpinStore.stopOnLoss,
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    roundsCompleted: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] - this.hyperSpinStore.roundsHyperSpin,
                    sessionDuration: this.hyperSpinBatchStartTime > 0 ? Date.now() - this.hyperSpinBatchStartTime : 0,
                    totalBet: this.betControlStore.totalBet,
                    timestamp: new Date().toISOString()
                });
                return true;
            }
        }

        // Check if rounds are exhausted
        const roundsExhausted = this.hyperSpinStore.roundsHyperSpin <= 0;
        cascadingSlotLogger.debug("[HYPER_SPIN_STOP_CONDITION] Rounds exhausted check", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            roundsExhausted,
            totalRounds: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup
        });

        if (roundsExhausted) {
            cascadingSlotLogger.info("[HYPER_SPIN_STOP_CONDITION] Rounds exhausted - natural completion");
            return true;
        }

        cascadingSlotLogger.debug("[HYPER_SPIN_STOP_CHECK] No stop conditions met - continuing hyper-spin", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            currentProfit,
            currentLoss,
            nextCheckInRounds: Math.min(5, this.hyperSpinStore.roundsHyperSpin) // Next check in 5 rounds or remaining rounds
        });

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

        cascadingSlotLogger.warn(`🛑 🛑 🛑 [HYPER_SPIN_BATCH_TIMING] HYPER-SPIN BATCH END (${completionType}) 🛑 🛑 🛑`, {
            completionType,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            roundsInitiallySet: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup,
            roundsCompleted: Math.max(0, (this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup) - this.hyperSpinStore.roundsHyperSpin),
            batchStartTime: this.hyperSpinBatchStartTime > 0 ? new Date(this.hyperSpinBatchStartTime).toISOString() : null,
            batchEndTime: endTimestamp,
            batchDurationMs: batchDuration,
            batchDurationSeconds: Math.round(batchDuration / 1000 * 100) / 100,
            finalProfit,
            finalLoss,
            netResult: finalProfit - finalLoss,
            stopReason,
            stopConditions: {
                stopOnProfit: this.hyperSpinStore.stopOnProfit,
                stopOnLoss: this.hyperSpinStore.stopOnLoss,
                profitConditionMet: this.hyperSpinStore.stopOnProfit > 0 && finalProfit >= this.hyperSpinStore.stopOnProfit,
                lossConditionMet: this.hyperSpinStore.stopOnLoss > 0 && finalLoss >= this.hyperSpinStore.stopOnLoss,
                roundsExhausted: this.hyperSpinStore.roundsHyperSpin <= 0
            },
            sessionStats: {
                initialBalance: this.hyperSpinStore.hyperSpinInitialBalance,
                finalBalance: this.cascadingUIStore.userBalance,
                totalChange: this.cascadingUIStore.userBalance - this.hyperSpinStore.hyperSpinInitialBalance,
                winRate: this.hyperSpinStore.roundsHyperSpin > 0 ?
                    ((this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup) - this.hyperSpinStore.roundsHyperSpin) /
                    (this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup) * 100 : 0
            },
            timestamp: endTimestamp
        });

        cascadingSlotLogger.info(`[HYPER_SPIN_WORKFLOW] HyperSpinHandler.stopHyperSpin() - Hyper-spin ${completionType.toLowerCase()}`, {
            completionType,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            stopReason,
            timestamp: endTimestamp
        });

        cascadingSlotLogger.info(`[HYPER_SPIN_PROGRESS] Hyper-spin ${completionType.toLowerCase()}`, {
            completionType,
            roundsCompleted: this.hyperSpinStore.roundsHyperSpin > 0 ? "Partial completion" : "All rounds completed",
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            finalProfit,
            finalLoss,
            netResult: finalProfit - finalLoss,
            stopReason,
            completionDetails: {
                profitTarget: this.hyperSpinStore.stopOnProfit,
                lossLimit: this.hyperSpinStore.stopOnLoss,
                roundsExhausted: this.hyperSpinStore.roundsHyperSpin <= 0,
                betFailure: stopReason.includes("Bet placement failed")
            },
            timestamp: new Date().toISOString()
        });

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

        cascadingSlotLogger.warn("✅ ✅ ✅ [HYPER_SPIN_BATCH_TIMING] HYPER-SPIN BATCH END (COMPLETED) ✅ ✅ ✅", {
            completionType: "SUCCESSFUL_COMPLETION",
            roundsCompleted: totalRoundsCompleted,
            roundsRemaining: 0,
            totalRounds: totalRoundsCompleted,
            batchStartTime: this.hyperSpinBatchStartTime > 0 ? new Date(this.hyperSpinBatchStartTime).toISOString() : null,
            batchEndTime: endTimestamp,
            batchDurationMs: batchDuration,
            batchDurationSeconds: Math.round(batchDuration / 1000 * 100) / 100,
            finalProfit,
            finalLoss,
            netResult,
            sessionSummary: {
                totalRounds: totalRoundsCompleted + " rounds completed successfully",
                initialBalance,
                finalBalance,
                totalChange: netResult,
                averageWinPerRound: totalRoundsCompleted > 0 ? netResult / totalRoundsCompleted : 0,
                winRate: totalRoundsCompleted > 0 ? (finalProfit / totalRoundsCompleted) * 100 : 0
            },
            completionStats: {
                roundsExhausted: true,
                profitTarget: this.hyperSpinStore.stopOnProfit,
                lossLimit: this.hyperSpinStore.stopOnLoss,
                profitTargetReached: this.hyperSpinStore.stopOnProfit > 0 && finalProfit >= this.hyperSpinStore.stopOnProfit,
                lossLimitReached: this.hyperSpinStore.stopOnLoss > 0 && finalLoss >= this.hyperSpinStore.stopOnLoss
            },
            timestamp: endTimestamp
        });

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.completeHyperSpin() - All rounds completed successfully", {
            totalRounds: totalRoundsCompleted,
            netResult,
            timestamp: endTimestamp
        });

        cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper-spin completed successfully - All rounds finished", {
            completionType: "SUCCESSFUL_COMPLETION",
            roundsCompleted: totalRoundsCompleted,
            roundsRemaining: 0,
            finalProfit,
            finalLoss,
            netResult,
            sessionSummary: {
                totalRounds: totalRoundsCompleted + " rounds completed successfully",
                initialBalance,
                finalBalance,
                totalChange: netResult,
                performance: netResult > 0 ? "PROFITABLE" : netResult < 0 ? "LOSING" : "BREAK_EVEN"
            },
            completionDetails: {
                roundsExhausted: true,
                profitTargetNotReached: this.hyperSpinStore.stopOnProfit === 0 || finalProfit < this.hyperSpinStore.stopOnProfit,
                lossLimitNotReached: this.hyperSpinStore.stopOnLoss === 0 || finalLoss < this.hyperSpinStore.stopOnLoss,
                naturalCompletion: true
            },
            timestamp: new Date().toISOString()
        });

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
        cascadingSlotLogger.info("[HYPER_SPIN_MESSAGE] " + message);
        this.noticeStore.addWarning(message);
    }

    /**
     * Show message when hyper-spin is completed
     */
    private showHyperSpinCompletedMessage() {
        const message = "Hyper-Spin completed successfully!";
        cascadingSlotLogger.info("[HYPER_SPIN_MESSAGE] " + message);
        this.noticeStore.addWarning(message);
    }

    /**
     * Pause hyper-spin batch
     */
    pauseHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.pauseHyperSpinBatch() - Pausing hyper-spin batch", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            currentProfit: this.calculateCurrentProfit(),
            currentLoss: this.calculateCurrentLoss(),
            timestamp: new Date().toISOString()
        });

        // Pause the batch by setting status to Paused
        this.hyperSpinStore.pauseHyperSpinBatch();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.pauseHyperSpinBatch() - Hyper-spin batch paused successfully", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Resume hyper-spin batch from paused state
     */
    resumeHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.resumeHyperSpinBatch() - Resuming hyper-spin batch", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            currentProfit: this.calculateCurrentProfit(),
            currentLoss: this.calculateCurrentLoss(),
            timestamp: new Date().toISOString()
        });

        // Resume the batch by setting status to Playing
        this.hyperSpinStore.resumeHyperSpinBatch();

        // Continue with the next round immediately
        this.checkHyperSpinNextRound();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.resumeHyperSpinBatch() - Hyper-spin batch resumed successfully", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle next round in hyper-spin (called after bet settlement)
     */
    private lastSpinTimestamp: number = 0;

    checkHyperSpinNextRound() {
        const currentTime = Date.now();
        const timeSinceLastSpin = this.lastSpinTimestamp > 0 ? currentTime - this.lastSpinTimestamp : 0;

        cascadingSlotLogger.info("[HYPER_SPIN_TIMING] checkHyperSpinNextRound() called", {
            timeSinceLastSpin: `${timeSinceLastSpin}ms`,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
            freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
            isBatchInterrupted: this.isBatchInterrupted,
            settlementWaitTimeout: !!this.settlementWaitTimeout,
            timestamp: new Date().toISOString()
        });

        // Check for batch interruption first
        if (this.isBatchInterrupted) {
            cascadingSlotLogger.warn("[HYPER_SPIN_INTERRUPTION] Batch interruption detected - stopping hyper-spin", {
                timestamp: new Date().toISOString()
            });
            this.handleBatchInterruption();
            return;
        }

        if (this.hyperSpinStore.isHyperSpin) {
            cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper spin status check", {
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                currentProfit: this.calculateCurrentProfit(),
                currentLoss: this.calculateCurrentLoss(),
                stopOnProfit: this.hyperSpinStore.stopOnProfit,
                stopOnLoss: this.hyperSpinStore.stopOnLoss,
                freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });

            // Wait for settlement effects to complete before continuing
            // Skip this check when stopOnFeature is false (hyper-spin mode optimization)
            if (this.hyperSpinStore.stopOnFeature !== false && !this.cascadingUIStore.isFreeSpinEffectCompleted) {
                // Check for timeout protection
                if (this.lastSettlementCheckTime === 0) {
                    this.lastSettlementCheckTime = currentTime;
                }

                const timeWaiting = currentTime - this.lastSettlementCheckTime;
                if (timeWaiting >= this.SETTLEMENT_WAIT_TIMEOUT_MS) {
                    cascadingSlotLogger.error("[HYPER_SPIN_TIMEOUT] Settlement wait timeout exceeded - treating as interruption", {
                        timeWaiting: `${timeWaiting}ms`,
                        timeoutLimit: `${this.SETTLEMENT_WAIT_TIMEOUT_MS}ms`,
                        isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                        roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                        timestamp: new Date().toISOString()
                    });

                    this.isBatchInterrupted = true;
                    this.handleBatchInterruption();
                    return;
                }

                cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Waiting for settlement effects - retrying with timeout protection", {
                    isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                    stopOnFeature: this.hyperSpinStore.stopOnFeature,
                    timeWaiting: `${timeWaiting}ms`,
                    timeoutLimit: `${this.SETTLEMENT_WAIT_TIMEOUT_MS}ms`,
                    waitStartTime: new Date().toISOString()
                });

                // Set up timeout protection
                if (!this.settlementWaitTimeout) {
                    this.settlementWaitTimeout = window.setTimeout(() => {
                        cascadingSlotLogger.error("[HYPER_SPIN_TIMEOUT] Settlement wait timeout triggered", {
                            timeout: `${this.SETTLEMENT_WAIT_TIMEOUT_MS}ms`,
                            timestamp: new Date().toISOString()
                        });
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
                cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Free spins active - checking if effects completed", {
                    freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                    isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    note: "Free spin rounds will NOT decrement hyper-spin round count",
                    timestamp: new Date().toISOString()
                });

                // In hyper-spin mode, free spins should auto-progress without UI effects
                // If effects are not completed, wait for them, otherwise continue free spins
                if (!this.cascadingUIStore.isFreeSpinEffectCompleted) {
                    cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Waiting for free spin effects to complete", {
                        freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                        isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                        timestamp: new Date().toISOString()
                    });
                    // Wait for effects to complete
                    return;
                } else {
                    cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Free spin effects completed - continuing free spin flow", {
                        freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                        isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                        timestamp: new Date().toISOString()
                    });
                    // Effects completed, continue with next free spin round
                    // The checkSpinNextRound will handle placing the next free spin bet
                    return;
                }
            }

            // Check if hyper-spin is paused - do this early to prevent any further processing
            if (this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus === "Paused") {
                cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper spin paused - waiting for resume", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    currentProfit: this.calculateCurrentProfit(),
                    currentLoss: this.calculateCurrentLoss(),
                    stopOnProfit: this.hyperSpinStore.stopOnProfit,
                    stopOnLoss: this.hyperSpinStore.stopOnLoss,
                    timestamp: new Date().toISOString()
                });
                return; // Don't continue while paused
            }

            // Check if we should continue or stop (only when free spins are not active)
            if (this.shouldStopHyperSpin()) {
                cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper spin stopping - stop conditions met", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    reason: this.getStopReason(),
                    timestamp: new Date().toISOString()
                });
                this.stopHyperSpin();
            } else {
                // Continue with next bet after ensuring settlement is complete
                cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Scheduling next bet placement in 0ms", {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    scheduleTime: new Date().toISOString()
                });
                setTimeout(() => {
                    cascadingSlotLogger.info("[HYPER_SPIN_TIMING] Executing scheduled bet placement", {
                        executionTime: new Date().toISOString(),
                        timeFromSchedule: "0ms"
                    });
                    this.placeHyperSpinBet();
                }, 0); // Hyper-spin maximum speed - no delay
            }
        }
    }

    /**
     * Handle batch interruption with proper cleanup and user feedback
     */
    private handleBatchInterruption() {
        cascadingSlotLogger.warn("[HYPER_SPIN_INTERRUPTION] Handling batch interruption", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            isBatchInterrupted: this.isBatchInterrupted,
            hasCurrentBatchData: !!this.hyperSpinStore.currentBatchData,
            timestamp: new Date().toISOString()
        });

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
            cascadingSlotLogger.info("[HYPER_SPIN_INTERRUPTION] Marked batch as interrupted for potential recovery", {
                timestamp: new Date().toISOString()
            });
        }

        // Show user feedback
        this.showBatchInterruptionMessage();

        // Don't automatically stop the batch - let user decide
        // The batch remains in "Interrupted" state for potential recovery
        cascadingSlotLogger.info("[HYPER_SPIN_INTERRUPTION] Batch interruption handled - waiting for user action", {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Show user feedback when batch is interrupted
     */
    private showBatchInterruptionMessage() {
        const message = "Hyper-Spin batch was interrupted. You can resume or restart the batch.";
        cascadingSlotLogger.warn("[HYPER_SPIN_MESSAGE] " + message);
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
            cascadingSlotLogger.info("[HYPER_SPIN_RECOVERY] No interrupted batch to recover", {
                hasBatchData: !!this.hyperSpinStore.currentBatchData,
                status: this.hyperSpinStore.currentBatchData?.summary.hyperSpinStatus,
                timestamp: new Date().toISOString()
            });
            return false;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_RECOVERY] Attempting to recover interrupted batch", {
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            totalRounds: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });

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

        cascadingSlotLogger.info("[HYPER_SPIN_RECOVERY] Batch recovery successful", {
            timestamp: new Date().toISOString()
        });
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

            cascadingSlotLogger.warn("❌ ❌ ❌ [HYPER_SPIN_BATCH_TIMING] HYPER-SPIN BATCH END (CANCELLED) ❌ ❌ ❌", {
                roundsCancelled: this.hyperSpinStore.roundsHyperSpin,
                batchStartTime: new Date(this.hyperSpinBatchStartTime).toISOString(),
                batchEndTime: endTimestamp,
                batchDurationMs: batchDuration,
                batchDurationSeconds: Math.round(batchDuration / 1000 * 100) / 100,
                cancellationReason: "User cancelled",
                timestamp: endTimestamp
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.cancelHyperSpin() - Cancelling HyperSpin", {
            previousRounds: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_PROGRESS] Hyper spin cancelled", {
            roundsCancelled: this.hyperSpinStore.roundsHyperSpin,
            roundsCompleted: "Cancelled before completion",
            finalProfit: this.calculateCurrentProfit(),
            finalLoss: this.calculateCurrentLoss(),
            cancellationReason: "User cancelled",
            timestamp: new Date().toISOString()
        });

        // Set hyper-spin inactive using HyperSpinStore method
        this.hyperSpinStore.setHyperSpinActive(false);
        this.updateHyperSpinRounds(0);

        // Clear batch data
        this.hyperSpinStore.clearBatchData();

        // Reset timing variables for next batch
        this.hyperSpinBatchStartTime = 0;
        this.hyperSpinBatchEndTime = 0;

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinHandler.cancelHyperSpin() - HyperSpin cancelled successfully");
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

        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] recordSpinData called", {
            hasFinishData: !!finishData,
            timestamp: new Date().toISOString()
        });

        if (!finishData) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BATCH] No finish data provided to recordSpinData");
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

            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Freespin detected during hyper-spin batch mode", {
                isFreeSpin,
                freeSpins,
                totalFreeSpins,
                win,
                stake: this.betControlStore.totalBet || 0,
                note: "Freespin will be recorded in batch data",
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

            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Creating freespin record", {
                freeSpinId,
                spinId,
                win,
                multiplier,
                stake,
                timestamp: new Date().toISOString()
            });
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

        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Spin data recorded", {
            spinId,
            isFreeSpin,
            winAmount: spinData.spinWinAmount,
            multiplier: spinData.spinWinMultiplier,
            winTag,
            balance: spinData.spinBalance,
            stake,
            wasFreespin: isFreeSpin,
            timestamp: new Date().toISOString()
        });
    }
}
