import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
import gc from "@sg/game-client-base";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet } from "../cascading-slot-utils";
import { AutoPlayStore } from "./auto-play-store";
import { CascadingUIStore } from "./cascading-ui-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { BetControlStore } from "./bet-control-store";
const { injectable, inject } = inversify;
const { FormatUtils } = gc;

/**
 * Hyper-spin status types
 */
export type HyperSpinStatus = "Ready" | "Playing" | "Paused" | "Interrupted";

/**
 * Win tag types for multipliers
 */
export type WinTag = "Bronze" | "Silver" | "Gold" | "Amethyst" | null;

/**
 * Single spin data within a hyper-spin batch
 */
export interface HyperSpinSingleSpinData {
    /**
     * Spin ID - numerical order (1,2,3,4...) or free spin order with icon
     * Free spins are marked with icon and not counted in hyper-spin round count
     */
    spinId: string | number;

    /**
     * Whether this is a free spin round
     */
    isFreeSpin: boolean;

    /**
     * Gross win amount of this round
     * Number format: number with thousand separator and 2 decimals, ex: 1,234,567.89
     */
    spinWinAmount: string;

    /**
     * Raw win amount (for calculations)
     */
    spinWinAmountRaw: number;

    /**
     * Win multiplier of this round (Gross Win / Stake)
     * Number format: number with thousand separators and up to 2 decimals + "x"
     * Ex: 0x, 1.5x, 30.15x, 1,234,567.89x
     */
    spinWinMultiplier: string;

    /**
     * Raw multiplier value (for calculations)
     */
    spinWinMultiplierRaw: number;

    /**
     * Win tag for special wins (Big Win, Mega Win, Super Win, Max Win)
     * Bronze: Big Win
     * Silver: Super Win
     * Gold: Mega Win
     * Amethyst: Max Win, Jackpot win
     */
    winTag: WinTag;

    /**
     * Ending balance of this round
     * Number format: number with thousand separator and up to 2 decimals, ex: 1,234,567.89
     */
    spinBalance: string;

    /**
     * Raw balance value (for calculations)
     */
    spinBalanceRaw: number;

    /**
     * Stake amount for this spin
     */
    stake: number;
}

/**
 * Hyper-spin batch summary data
 */
export interface HyperSpinBatchSummary {
    /**
     * Total Bet amount placed in HyperSpin
     * Default value: 0
     * Number format: number with thousand separator and 2 decimals, ex: 1,234,567.89
     */
    totalBet: string;

    /**
     * Raw total bet value (for calculations)
     */
    totalBetRaw: number;

    /**
     * Hyper-spin status
     * Ready: used when opening the pop up and after finishing all HyperSpin
     * Playing: used when HyperSpin is running
     * Paused: used when HyperSpin is pausing (clicking Pause button or changing Bet size while HyperSpin is running)
     */
    hyperSpinStatus: HyperSpinStatus;

    /**
     * Total Win amount using HyperSpin
     * Default value: 0
     */
    totalWin: string;

    /**
     * Raw total win value (for calculations)
     */
    totalWinRaw: number;

    /**
     * Starting balance value when starting HyperSpin
     * This field will display the starting balance when starting HyperSpin.
     * Number format: number with thousand separator and 2 decimals, ex: 1,234,567.89
     */
    startingBalance: string;

    /**
     * Raw starting balance value (for calculations)
     */
    startingBalanceRaw: number;

    /**
     * End balance value after finishing all HyperSpins
     * Ending balance will be shown after the last spin when finishing all HyperSpins.
     * Number format: number with thousand separator and 2 decimals, ex: 1,234,567.89
     */
    endBalance: string;

    /**
     * Raw end balance value (for calculations)
     */
    endBalanceRaw: number;
}

/**
 * Complete hyper-spin batch data
 */
export interface HyperSpinBatchData {
    /**
     * Batch summary information
     */
    summary: HyperSpinBatchSummary;

    /**
     * Array of single spin data for each spin in the batch
     */
    spins: HyperSpinSingleSpinData[];
}

@injectable()
export class HyperSpinStore {
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    constructor() {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] HyperSpinStore constructor called", {
            cascadingUIStoreInjected: !!this.cascadingUIStore,
            autoPlayStoreInjected: !!this.autoPlayStore,
            fsbPromotionUIStoreInjected: !!this.fsbPromotionUIStore,
            fsbPromotionStoreInjected: !!this.fsbPromotionStore,
            configStoreInjected: !!this.configStore,
            betControlStoreInjected: !!this.betControlStore,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] MobX auto-observable setup completed", {
            timestamp: new Date().toISOString()
        });
        mobx.reaction(
            () => this.currentCoinIndex,
            () => {
                this.onChangeCoinAndBetLevel();
            }
        );
        mobx.reaction(
            () => this.currentBetLevelIndex,
            () => {
                this.onChangeCoinAndBetLevel();
            }
        );
        mobx.reaction(
            () => this.betControlStore?.totalBet,
            () => {
                // Only clamp if we have valid config data AND the calculated max is valid (> 0)
                // And ensure stores are initialized
                if (!this.betControlStore || !this.cascadingUIStore || !this.configStore) {
                    return;
                }

                const maxWinPerRound = this.configStore.gameConfigs?.maxWinPerRound ?? 0;
                const currentMaxStopOnProfit = this.maxStopOnProfit;
                const currentMaxStopOnLoss = this.maxStopOnLoss;

                if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0) {
                    // Clamp stopOnProfit when totalBet changes to ensure it doesn't exceed new max
                    if (this.stopOnProfit > currentMaxStopOnProfit) {
                        cascadingSlotLogger.info("[STOP_ON_PROFIT] Clamping due to totalBet change - value exceeds new max", {
                            oldValue: this.stopOnProfit,
                            newMax: currentMaxStopOnProfit,
                            totalBet: this.betControlStore.totalBet,
                            maxWinPerRound
                        });
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                }

                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0) {
                    // Clamp stopOnLoss when totalBet changes to ensure it doesn't exceed new max
                    if (this.stopOnLoss > currentMaxStopOnLoss) {
                        cascadingSlotLogger.info("[STOP_ON_LOSS] Clamping due to totalBet change - value exceeds new max", {
                            oldValue: this.stopOnLoss,
                            newMax: currentMaxStopOnLoss,
                            totalBet: this.betControlStore.totalBet,
                            userBalance: this.cascadingUIStore.userBalance
                        });
                        this.setStopOnLoss(currentMaxStopOnLoss);
                    }
                }
            }
        );
        mobx.reaction(
            () => this.cascadingUIStore?.userBalance,
            () => {
                // Clamp stopOnLoss when userBalance changes to ensure it doesn't exceed new max
                // Only clamp if we have valid user balance data AND the calculated max is valid (> 0)
                // And ensure stores are initialized
                if (!this.cascadingUIStore) {
                    return;
                }

                const currentMaxStopOnLoss = this.maxStopOnLoss;

                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0) {
                    // Always clamp if value exceeds new max
                    if (this.stopOnLoss > currentMaxStopOnLoss) {
                        cascadingSlotLogger.info("[STOP_ON_LOSS] Clamping due to userBalance change - value exceeds new max", {
                            oldValue: this.stopOnLoss,
                            newMax: currentMaxStopOnLoss,
                            userBalance: this.cascadingUIStore.userBalance
                        });
                        this.setStopOnLoss(currentMaxStopOnLoss);
                    }
                    // If max decreased and stopOnLoss was at or near the old max, adjust to new max
                    else if (this._previousMaxStopOnLoss > 0 && currentMaxStopOnLoss < this._previousMaxStopOnLoss) {
                        const threshold = this._previousMaxStopOnLoss * 0.99; // 99% threshold to handle floating point
                        if (this.stopOnLoss >= threshold) {
                            cascadingSlotLogger.info("[STOP_ON_LOSS] Adjusting to new max due to userBalance decrease - was at old max", {
                                oldValue: this.stopOnLoss,
                                oldMax: this._previousMaxStopOnLoss,
                                newMax: currentMaxStopOnLoss,
                                userBalance: this.cascadingUIStore.userBalance
                            });
                            this.setStopOnLoss(currentMaxStopOnLoss);
                        }
                    }
                }

                // Update previous max for next reaction
                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0) {
                    this._previousMaxStopOnLoss = currentMaxStopOnLoss;
                }
            }
        );
        mobx.reaction(
            () => this.betControlStore?.totalBet,
            () => {
                // And ensure stores are initialized
                if (!this.betControlStore || !this.configStore) {
                    return;
                }
                // Clamp stopOnProfit when totalBet changes to ensure it doesn't exceed new max
                // Only clamp if we have valid config data (maxWinPerRound > 0) AND the calculated max is valid (> 0)
                const maxWinPerRound = this.configStore.gameConfigs?.maxWinPerRound ?? 0;
                const currentMaxStopOnProfit = this.maxStopOnProfit;

                if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0) {
                    // Always clamp if value exceeds new max
                    if (this.stopOnProfit > currentMaxStopOnProfit) {
                        cascadingSlotLogger.info("[STOP_ON_PROFIT] Clamping due to totalBet change - value exceeds new max", {
                            oldValue: this.stopOnProfit,
                            newMax: currentMaxStopOnProfit,
                            totalBet: this.betControlStore.totalBet,
                            maxWinPerRound
                        });
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                    // If max decreased and stopOnProfit was at or near the old max, adjust to new max
                    else if (this._previousMaxStopOnProfit > 0 && currentMaxStopOnProfit < this._previousMaxStopOnProfit) {
                        const threshold = this._previousMaxStopOnProfit * 0.99; // 99% threshold to handle floating point
                        if (this.stopOnProfit >= threshold) {
                            cascadingSlotLogger.info("[STOP_ON_PROFIT] Adjusting to new max due to totalBet decrease - was at old max", {
                                oldValue: this.stopOnProfit,
                                oldMax: this._previousMaxStopOnProfit,
                                newMax: currentMaxStopOnProfit,
                                totalBet: this.betControlStore.totalBet,
                                maxWinPerRound
                            });
                            this.setStopOnProfit(currentMaxStopOnProfit);
                        }
                    }
                }

                // Update previous max for next reaction
                if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0) {
                    this._previousMaxStopOnProfit = currentMaxStopOnProfit;
                }
            }
        );

        // Initialize previous max values after reactions are set up
        // Use a small delay to ensure store values are initialized
        setTimeout(() => {
            // Ensure stores are initialized before accessing them
            if (!this.configStore || !this.cascadingUIStore) {
                return;
            }

            const maxWinPerRound = this.configStore.gameConfigs?.maxWinPerRound ?? 0;
            if (maxWinPerRound > 0) {
                const currentMaxStopOnProfit = this.maxStopOnProfit;
                if (currentMaxStopOnProfit > 0) {
                    this._previousMaxStopOnProfit = currentMaxStopOnProfit;
                }
            }
            if (this.cascadingUIStore.userBalance > 0) {
                const currentMaxStopOnLoss = this.maxStopOnLoss;
                if (currentMaxStopOnLoss > 0) {
                    this._previousMaxStopOnLoss = currentMaxStopOnLoss;
                }
            }
        }, 0);
    }

    isOpenBetAmountPopup = false;

    // HyperSpin bet control popup properties (separate from regular bet control)
    isOpenHyperSpinBetControlPopup = false;

    // HyperSpin rounds properties
    public roundsList = [10, 50, 100, 500, 1000];
    public isOpenHyperSpinPopup = false;
    public selectedRoundOnPopup = this.roundsList[2]; // Default to 100 (index 2)
    public roundsHyperSpin = 0;

    public isHyperSpin = false;

    public triggerBet = null;

    public isClickHyperSpinToggle = false;

    get isTurnOnHyperSpin() {
        return this.isOpenHyperSpinPopup || this.isHyperSpin;
    }

    totalBetUnique = [];
    betLevels: number[] = [];
    coinValues: number[] = [];
    betMultiplier = 0;
    defaultCoinValue = 0;

    stopOnProfit = 0;
    stopOnLoss = 0;
    public stopOnFeature = false;

    resumeLastBet = false;

    needClearLastSetting = false;

    _lastSetting = null;

    // Track previous max values to detect when values at max should be adjusted
    private _previousMaxStopOnProfit = 0;
    private _previousMaxStopOnLoss = 0;

    // Track hyper-spin session profit/loss
    private _hyperSpinInitialBalance = 0;
    private _hyperSpinCurrentProfit = 0;
    private _hyperSpinCurrentLoss = 0;

    get hyperSpinInitialBalance(): number {
        return this._hyperSpinInitialBalance;
    }

    get lastSetting() {
        return this._lastSetting;
    }

    set lastSetting(value: { betLevel: number; coinValue: number }) {
        this._lastSetting = value;
    }

    get betLevel() {
        return this.betLevels[this.currentBetLevelIndex] ?? 0;
    }

    get coinValue() {
        return this.coinValues[this.currentCoinIndex] ?? 0;
    }

    get totalBet() {
        return this.betControlStore?.totalBet ?? 0;
    }

    currentBetLevelIndex = 0;
    currentCoinIndex = 0;
    currentTotalBetIndex = 0;

    get disabledChangeBet() {
        return this.cascadingUIStore?.isFreeSpins || this.cascadingUIStore?.disabledOpenInputBet || false;
    }

    get interactableBetLevel() {
        if (this.disabledChangeBet) {
            return {
                increase: false,
                decrease: false,
            };
        }
        return {
            increase: this.currentBetLevelIndex < this.betLevels.length - 1,
            decrease: this.currentBetLevelIndex > 0,
        };
    }

    get interactableCoinValue() {
        if (this.disabledChangeBet) {
            return {
                increase: false,
                decrease: false,
            };
        }
        return {
            increase: this.currentCoinIndex < this.coinValues.length - 1,
            decrease: this.currentCoinIndex > 0,
        };
    }

    get interactableTotalBet() {
        if (this.disabledChangeBet) {
            return {
                increase: false,
                decrease: false,
            };
        }
        // Use BetControlStore's totalBetUnique array
        const totalBetUnique = this.betControlStore.totalBetUnique;
        return {
            increase: this.currentTotalBetIndex < totalBetUnique.length - 1,
            decrease: this.currentTotalBetIndex > 0,
        };
    }



    syncCurrentTotalBetIndex(totalBet: number) {
        // Use BetControlStore's totalBetUnique array
        // Check if stores are initialized
        if (!this.betControlStore) {
            return;
        }

        this.currentTotalBetIndex = this.betControlStore.totalBetUnique.findIndex((detail) => +Object.keys(detail)[0] === totalBet);
    }

    onChangeCoinAndBetLevel() {
        const totalBet = calculateTotalBet(this.betLevel, this.coinValue, this.betMultiplier);
        this.syncCurrentTotalBetIndex(totalBet);
    }

    get isCollapseMenuInGame() {
        return (
            (this.cascadingUIStore?.cascadingState === CascadingSlotState.SPINNING) ||
            (this.autoPlayStore?.isOpenAutoplayPopup) ||
            this.isOpenBetAmountPopup ||
            this.isOpenHyperSpinPopup
        );
    }

    get effectiveCoinValue() {
        return this.fsbPromotionUIStore?.isFSBPromotionInProgress ? this.fsbPromotionStore?.promotion?.coinValue : this.coinValue;
    }

    get effectiveBetLevel() {
        return this.fsbPromotionUIStore?.isFSBPromotionInProgress ? this.fsbPromotionStore?.promotion?.betLevel : this.betLevel;
    }

    get effectiveTotalBet() {
        return this.fsbPromotionUIStore?.isFSBPromotionInProgress
            ? calculateTotalBet(this.fsbPromotionStore?.promotion?.betLevel, this.fsbPromotionStore?.promotion?.coinValue, this.betMultiplier)
            : (this.betControlStore?.totalBet ?? 0);
    }

    /**
     * Get the maximum stop on profit value (Max of Total Bet or Total Bet Per Round * Max Win)
     * Default to 0 if maxWinPerRound is not available
     */
    get maxStopOnProfit() {
        const maxWinPerRound = this.configStore?.gameConfigs?.maxWinPerRound ?? 0;
        const currentTotalBet = this.betControlStore?.totalBet ?? 0;
        // Use totalBet for stop on profit calculation
        return currentTotalBet * maxWinPerRound;
    }

    /**
     * Get the minimum stop on profit value (always 0)
     */
    get minStopOnProfit() {
        return 0;
    }

    /**
     * Get the step size for stop on profit (1 x Total Bet)
     */
    get stopOnProfitStep() {
        return this.betControlStore?.totalBet ?? 0;
    }

    /**
     * Change stop on profit by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnProfit(increase: boolean) {
        cascadingSlotLogger.info("[STOP_ON_PROFIT] changeStopOnProfit called", {
            increase,
            currentValue: this.stopOnProfit,
            step: this.stopOnProfitStep,
            currentTotalBet: this.betControlStore?.totalBet ?? 0
        });
        const step = this.stopOnProfitStep; // Step is equal to totalBet
        const newValue = increase ? this.stopOnProfit + step : this.stopOnProfit - step;
        cascadingSlotLogger.info("[STOP_ON_PROFIT] New value before setStopOnProfit", { newValue });
        this.setStopOnProfit(newValue);
    }

    /**
     * Set stop on profit value with bounds checking
     * @param value - The new stop on profit value
     */
    setStopOnProfit(value: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnProfit called", {
            value,
            previousStopOnProfit: this.stopOnProfit,
            minStopOnProfit: this.minStopOnProfit,
            maxStopOnProfit: this.maxStopOnProfit,
            currentTotalBet: this.betControlStore?.totalBet ?? 0,
            userBalance: this.cascadingUIStore?.userBalance ?? 0,
            timestamp: new Date().toISOString()
        });

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            cascadingSlotLogger.warn("[HYPER_SPIN_STORE] setStopOnProfit called with invalid value", { value });
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnProfit aborted - invalid value", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnProfit calculations", {
            originalValue: value,
            roundedValue,
            clampedValue,
            min,
            max,
            effectiveBet: this.betControlStore?.totalBet ?? 0,
            wasRounded: value !== roundedValue,
            wasClamped: clampedValue !== roundedValue,
            clampDirection: clampedValue !== roundedValue ? (roundedValue < min ? "below minimum" : "above maximum") : "no clamping",
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[STOP_ON_PROFIT] setStopOnProfit", {
            value,
            roundedValue,
            clampedValue,
            min,
            max,
            currentTotalBet: this.betControlStore?.totalBet ?? 0,
            effectiveBet: this.betControlStore?.totalBet ?? 0
        });

        this.stopOnProfit = clampedValue;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnProfit completed", {
            finalStopOnProfit: this.stopOnProfit,
            changeFromPrevious: this.stopOnProfit - (this.stopOnProfit - clampedValue + (typeof value === 'number' && !isNaN(value) ? value : 0)),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get the maximum stop on loss value (Current Player's Balance)
     * Default to 0 if userBalance is not available
     */
    get maxStopOnLoss() {
        const userBalance = this.cascadingUIStore?.userBalance ?? 0;
        return userBalance;
    }

    /**
     * Get the minimum stop on loss value (always 0)
     */
    get minStopOnLoss() {
        return 0;
    }

    /**
     * Get the step size for stop on loss (1 x Total Bet)
     */
    get stopOnLossStep() {
        return this.betControlStore?.totalBet ?? 0;
    }

    /**
     * Change stop on loss by step (increase or decrease)
     * @param increase - true to increase, false to decrease
     */
    changeStopOnLoss(increase: boolean) {
        cascadingSlotLogger.info("[STOP_ON_LOSS] changeStopOnLoss called", { increase, currentValue: this.stopOnLoss, step: this.stopOnLossStep });
        const step = this.stopOnLossStep; // Step is equal to totalBet (1x total bet)
        const newValue = increase ? this.stopOnLoss + step : this.stopOnLoss - step;
        cascadingSlotLogger.info("[STOP_ON_LOSS] New value before setStopOnLoss", { newValue });
        this.setStopOnLoss(newValue);
    }

    /**
     * Set stop on loss value with bounds checking
     * @param value - The new stop on loss value
     */
    setStopOnLoss(value: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnLoss called", {
            value,
            previousStopOnLoss: this.stopOnLoss,
            minStopOnLoss: this.minStopOnLoss,
            maxStopOnLoss: this.maxStopOnLoss,
            currentTotalBet: this.betControlStore?.totalBet ?? 0,
            userBalance: this.cascadingUIStore?.userBalance ?? 0,
            timestamp: new Date().toISOString()
        });

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            cascadingSlotLogger.warn("[HYPER_SPIN_STORE] setStopOnLoss called with invalid value", { value });
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnLoss aborted - invalid value", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnLoss calculations", {
            originalValue: value,
            roundedValue,
            clampedValue,
            min,
            max,
            wasRounded: value !== roundedValue,
            wasClamped: clampedValue !== roundedValue,
            clampDirection: clampedValue !== roundedValue ? (roundedValue < min ? "below minimum" : "above maximum") : "no clamping",
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[STOP_ON_LOSS] setStopOnLoss", { value, roundedValue, clampedValue, min, max, currentTotalBet: this.betControlStore?.totalBet ?? 0, userBalance: this.cascadingUIStore?.userBalance ?? 0 });

        this.stopOnLoss = clampedValue;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setStopOnLoss completed", {
            finalStopOnLoss: this.stopOnLoss,
            changeFromPrevious: this.stopOnLoss - (this.stopOnLoss - clampedValue + (typeof value === 'number' && !isNaN(value) ? value : 0)),
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Start tracking profit/loss for hyper-spin session
     */
    startHyperSpinSessionTracking() {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] startHyperSpinSessionTracking called", {
            cascadingUIStoreAvailable: !!this.cascadingUIStore,
            currentUserBalance: this.cascadingUIStore?.userBalance ?? 0,
            previousInitialBalance: this._hyperSpinInitialBalance,
            previousCurrentProfit: this._hyperSpinCurrentProfit,
            previousCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });

        if (!this.cascadingUIStore) {
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] startHyperSpinSessionTracking aborted - cascadingUIStore not available", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TRACKING] Starting hyper-spin session tracking", {
            initialBalance: this.cascadingUIStore.userBalance,
            timestamp: new Date().toISOString()
        });

        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] startHyperSpinSessionTracking completed", {
            hyperSpinInitialBalance: this._hyperSpinInitialBalance,
            hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
            hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Fallback method to initialize tracking if the main method is not available
     * This is used when the browser has cached code that doesn't include the startHyperSpinSessionTracking method
     */
    initializeHyperSpinTrackingFallback() {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] initializeHyperSpinTrackingFallback called", {
            cascadingUIStoreAvailable: !!this.cascadingUIStore,
            currentUserBalance: this.cascadingUIStore?.userBalance ?? 0,
            previousInitialBalance: this._hyperSpinInitialBalance,
            previousCurrentProfit: this._hyperSpinCurrentProfit,
            previousCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });

        if (!this.cascadingUIStore) {
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] initializeHyperSpinTrackingFallback aborted - cascadingUIStore not available", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_FALLBACK] Initializing hyper-spin tracking via fallback method", {
            initialBalance: this.cascadingUIStore.userBalance,
            timestamp: new Date().toISOString()
        });

        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] initializeHyperSpinTrackingFallback completed", {
            hyperSpinInitialBalance: this._hyperSpinInitialBalance,
            hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
            hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Stop tracking profit/loss for hyper-spin session
     */
    stopHyperSpinSessionTracking() {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] stopHyperSpinSessionTracking called", {
            cascadingUIStoreAvailable: !!this.cascadingUIStore,
            currentUserBalance: this.cascadingUIStore?.userBalance ?? 0,
            hyperSpinInitialBalance: this._hyperSpinInitialBalance,
            hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
            hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });

        const finalBalance = this.cascadingUIStore?.userBalance ?? 0;
        const totalSessionChange = finalBalance - this._hyperSpinInitialBalance;
        const netResult = this._hyperSpinCurrentProfit - this._hyperSpinCurrentLoss;

        cascadingSlotLogger.info("[HYPER_SPIN_TRACKING] Stopping hyper-spin session tracking", {
            initialBalance: this._hyperSpinInitialBalance,
            finalBalance,
            totalSessionChange,
            totalProfit: this._hyperSpinCurrentProfit,
            totalLoss: this._hyperSpinCurrentLoss,
            netResult,
            sessionResult: totalSessionChange >= 0 ? "profit" : "loss",
            timestamp: new Date().toISOString()
        });

        this._hyperSpinInitialBalance = 0;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] stopHyperSpinSessionTracking completed", {
            trackingReset: {
                hyperSpinInitialBalance: this._hyperSpinInitialBalance,
                hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
                hyperSpinCurrentLoss: this._hyperSpinCurrentLoss
            },
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update profit/loss tracking based on current balance
     */
    updateHyperSpinProfitLoss() {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] updateHyperSpinProfitLoss called", {
            hyperSpinInitialBalance: this._hyperSpinInitialBalance,
            cascadingUIStoreAvailable: !!this.cascadingUIStore,
            currentUserBalance: this.cascadingUIStore?.userBalance ?? 0,
            previousCurrentProfit: this._hyperSpinCurrentProfit,
            previousCurrentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });

        if (this._hyperSpinInitialBalance === 0 || !this.cascadingUIStore) {
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] updateHyperSpinProfitLoss skipped", {
                reason: this._hyperSpinInitialBalance === 0 ? "not tracking (initial balance is 0)" : "cascadingUIStore not available",
                hyperSpinInitialBalance: this._hyperSpinInitialBalance,
                cascadingUIStoreAvailable: !!this.cascadingUIStore,
                timestamp: new Date().toISOString()
            });
            return; // Not tracking or store not available
        }

        const currentBalance = this.cascadingUIStore.userBalance;
        const balanceChange = currentBalance - this._hyperSpinInitialBalance;

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] Calculating profit/loss", {
            currentBalance,
            initialBalance: this._hyperSpinInitialBalance,
            balanceChange,
            changeType: balanceChange > 0 ? "profit" : balanceChange < 0 ? "loss" : "break-even",
            timestamp: new Date().toISOString()
        });

        if (balanceChange > 0) {
            this._hyperSpinCurrentProfit = balanceChange;
            this._hyperSpinCurrentLoss = 0;
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] Updated to profit state", {
                hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
                hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
                timestamp: new Date().toISOString()
            });
        } else if (balanceChange < 0) {
            this._hyperSpinCurrentProfit = 0;
            this._hyperSpinCurrentLoss = Math.abs(balanceChange);
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] Updated to loss state", {
                hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
                hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
                timestamp: new Date().toISOString()
            });
        } else {
            this._hyperSpinCurrentProfit = 0;
            this._hyperSpinCurrentLoss = 0;
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] Updated to break-even state", {
                hyperSpinCurrentProfit: this._hyperSpinCurrentProfit,
                hyperSpinCurrentLoss: this._hyperSpinCurrentLoss,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TRACKING] Updated profit/loss tracking", {
            initialBalance: this._hyperSpinInitialBalance,
            currentBalance,
            balanceChange,
            currentProfit: this._hyperSpinCurrentProfit,
            currentLoss: this._hyperSpinCurrentLoss
        });

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] updateHyperSpinProfitLoss completed", {
            finalCurrentProfit: this._hyperSpinCurrentProfit,
            finalCurrentLoss: this._hyperSpinCurrentLoss,
            netResult: this._hyperSpinCurrentProfit - this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get current profit during hyper-spin session
     */
    getCurrentHyperSpinProfit(): number {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] getCurrentHyperSpinProfit accessed", {
            currentProfit: this._hyperSpinCurrentProfit,
            timestamp: new Date().toISOString()
        });
        return this._hyperSpinCurrentProfit;
    }

    /**
     * Get current loss during hyper-spin session
     */
    getCurrentHyperSpinLoss(): number {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] getCurrentHyperSpinLoss accessed", {
            currentLoss: this._hyperSpinCurrentLoss,
            timestamp: new Date().toISOString()
        });
        return this._hyperSpinCurrentLoss;
    }

    /**
     * Set hyper-spin active state
     * Updates all related flags: isHyperSpin and cascadingUIStore.isHyperSpinActive
     * @param active - true to activate hyper-spin, false to deactivate
     */
    setHyperSpinActive(active: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setHyperSpinActive called", {
            active,
            previousIsHyperSpin: this.isHyperSpin,
            previousIsHyperSpinActiveUI: this.cascadingUIStore?.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        this.isHyperSpin = active;

        // Update UI store flag
        if (this.cascadingUIStore) {
            this.cascadingUIStore.isHyperSpinActive = active;
            cascadingSlotLogger.info("[HYPER_SPIN_STORE] Updated CascadingUIStore flag", {
                isHyperSpinActive: this.cascadingUIStore.isHyperSpinActive,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] setHyperSpinActive completed", {
            active,
            isHyperSpin: this.isHyperSpin,
            isHyperSpinActiveUI: this.cascadingUIStore?.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get hyper-spin active state
     * Returns true if hyper-spin is currently active
     */
    get isHyperSpinActive(): boolean {
        return this.isHyperSpin;
    }

    // Hyper-spin batch data tracking
    private _currentBatchData: HyperSpinBatchData | null = null;
    private _hyperSpinRoundCounter = 0; // Counter for hyper-spin rounds (excludes free spins)
    private _freeSpinCounter = 0; // Counter for free spins

    /**
     * Get current hyper-spin batch data
     */
    get currentBatchData(): HyperSpinBatchData | null {
        return this._currentBatchData;
    }

    /**
     * Get the length of the spins array (computed property for MobX reactivity)
     * This ensures observers can track when spins are added
     */
    get spinsLength(): number {
        return this._currentBatchData?.spins?.length || 0;
    }

    /**
     * Initialize a new hyper-spin batch
     */
    initializeHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] initializeHyperSpinBatch called", {
            timestamp: new Date().toISOString()
        });

        const initialTotalBet = this.formatNumber(0, 2);
        const initialTotalWin = this.formatNumber(0, 2);

        // Get starting balance from cascadingUIStore
        const startingBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;
        const startingBalance = this.formatNumber(startingBalanceRaw, 2);
        const initialEndBalance = this.formatNumber(0, 2); // End balance will be set when batch completes

        this._currentBatchData = {
            summary: {
                totalBet: initialTotalBet,
                totalBetRaw: 0,
                hyperSpinStatus: "Ready",
                totalWin: initialTotalWin,
                totalWinRaw: 0,
                startingBalance: startingBalance,
                startingBalanceRaw: startingBalanceRaw,
                endBalance: initialEndBalance,
                endBalanceRaw: 0
            },
            spins: []
        };

        this._hyperSpinRoundCounter = 0;
        this._freeSpinCounter = 0;


        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] initializeHyperSpinBatch completed", {
            batchData: this._currentBatchData,
            startingBalance: startingBalance,
            startingBalanceRaw: startingBalanceRaw,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Start hyper-spin batch (set status to Playing)
     */
    startHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] startHyperSpinBatch called", {
            timestamp: new Date().toISOString()
        });

        if (!this._currentBatchData) {
            this.initializeHyperSpinBatch();
        }

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Playing";


            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch status set to Playing", {
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Pause hyper-spin batch (set status to Paused)
     */
    pauseHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] pauseHyperSpinBatch called", {
            timestamp: new Date().toISOString()
        });

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Paused";

            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch status set to Paused", {
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Resume hyper-spin batch (set status to Playing)
     */
    resumeHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] resumeHyperSpinBatch called", {
            timestamp: new Date().toISOString()
        });

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Playing";

            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch status set to Playing", {
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Complete hyper-spin batch (set status to Ready)
     */
    completeHyperSpinBatch() {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] completeHyperSpinBatch called", {
            timestamp: new Date().toISOString()
        });

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Ready";

            // Get end balance from cascadingUIStore
            const endBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;
            const endBalance = this.formatNumber(endBalanceRaw, 2);
            this._currentBatchData.summary.endBalance = endBalance;
            this._currentBatchData.summary.endBalanceRaw = endBalanceRaw;


            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch status set to Ready", {
                endBalance: endBalance,
                endBalanceRaw: endBalanceRaw,
                startingBalance: this._currentBatchData.summary.startingBalance,
                startingBalanceRaw: this._currentBatchData.summary.startingBalanceRaw,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Add a spin to the current batch
     * @param spinData - The spin data to add
     */
    addSpinToBatch(spinData: HyperSpinSingleSpinData) {
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] addSpinToBatch called", {
            spinData,
            timestamp: new Date().toISOString()
        });

        if (!this._currentBatchData) {
            this.initializeHyperSpinBatch();
        }

        if (this._currentBatchData) {
            const previousTotalBet = this._currentBatchData.summary.totalBet;
            const previousTotalWin = this._currentBatchData.summary.totalWin;

            this._currentBatchData.spins.push(spinData);

            // Update total bet (accumulate stake amounts)
            this._currentBatchData.summary.totalBetRaw += spinData.stake;
            this._currentBatchData.summary.totalBet = this.formatNumber(
                this._currentBatchData.summary.totalBetRaw,
                2
            );

            // Update total win (accumulate win amounts)
            this._currentBatchData.summary.totalWinRaw += spinData.spinWinAmountRaw;
            this._currentBatchData.summary.totalWin = this.formatNumber(
                this._currentBatchData.summary.totalWinRaw,
                2
            );

            cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Spin added to batch", {
                spinId: spinData.spinId,
                isFreeSpin: spinData.isFreeSpin,
                winAmount: spinData.spinWinAmount,
                multiplier: spinData.spinWinMultiplier,
                totalBet: this._currentBatchData.summary.totalBet,
                totalWin: this._currentBatchData.summary.totalWin,
                totalSpins: this._currentBatchData.spins.length,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Format number with thousand separator and specified decimal places
     * @param value - The number to format
     * @param decimals - Number of decimal places (default: 2)
     * @returns Formatted string (e.g., "1,234,567.89")
     */
    private formatNumber(value: number, decimals: number = 2): string {
        return FormatUtils.numberWithCommas(value, decimals, true);
    }

    /**
     * Format multiplier with "x" suffix
     * @param multiplier - The multiplier value
     * @returns Formatted string (e.g., "1.5x", "1,234,567.89x")
     */
    formatMultiplier(multiplier: number): string {
        const formatted = FormatUtils.numberWithCommas(multiplier, 2, true);
        return `${formatted}x`;
    }

    /**
     * Determine win tag based on win amount and thresholds
     * @param winAmount - Gross win amount
     * @param stake - Stake amount
     * @param bigWin - Big win flag from settlement
     * @param megaWin - Mega win flag from settlement
     * @param superWin - Super win flag from settlement
     * @param reachMaxWin - Max win flag from settlement
     * @returns Win tag or null
     */
    determineWinTag(
        winAmount: number,
        stake: number,
        bigWin: boolean,
        megaWin: boolean,
        superWin: boolean,
        reachMaxWin: boolean
    ): WinTag {
        // Max Win / Jackpot win takes highest priority
        if (reachMaxWin) {
            return "Amethyst";
        }

        // Mega Win (Gold tag)
        if (megaWin) {
            return "Gold";
        }

        // Super Win (Silver tag)
        if (superWin) {
            return "Silver";
        }

        // Big Win (Bronze tag)
        if (bigWin) {
            return "Bronze";
        }

        return null;
    }

    /**
     * Get next spin ID for hyper-spin round (increments counter)
     * Free spins are handled separately
     */
    getNextHyperSpinId(): number {
        this._hyperSpinRoundCounter++;
        return this._hyperSpinRoundCounter;
    }

    /**
     * Get next free spin ID (increments free spin counter)
     * Free spins are marked with icon and not counted in hyper-spin round count
     */
    getNextFreeSpinId(): number {
        this._freeSpinCounter++;
        return this._freeSpinCounter;
    }

    /**
     * Reset batch counters
     */
    resetBatchCounters() {
        this._hyperSpinRoundCounter = 0;
        this._freeSpinCounter = 0;
        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch counters reset", {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Clear current batch data
     */
    clearBatchData() {
        this._currentBatchData = null;
        this.resetBatchCounters();

        cascadingSlotLogger.info("[HYPER_SPIN_BATCH] Batch data cleared", {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Recover an interrupted batch (called by HyperSpinHandler)
     */
    recoverInterruptedBatch(): boolean {
        cascadingSlotLogger.info("[HYPER_SPIN_STORE] recoverInterruptedBatch called", {
            hasCurrentBatchData: !!this._currentBatchData,
            batchStatus: this._currentBatchData?.summary.hyperSpinStatus,
            timestamp: new Date().toISOString()
        });

        if (!this._currentBatchData || this._currentBatchData.summary.hyperSpinStatus !== "Interrupted") {
            cascadingSlotLogger.warn("[HYPER_SPIN_STORE] No interrupted batch to recover", {
                hasBatchData: !!this._currentBatchData,
                status: this._currentBatchData?.summary.hyperSpinStatus,
                timestamp: new Date().toISOString()
            });
            return false;
        }

        // Reset batch status to Playing
        this._currentBatchData.summary.hyperSpinStatus = "Playing";

        // Set hyper-spin as active
        this.setHyperSpinActive(true);

        cascadingSlotLogger.info("[HYPER_SPIN_STORE] Interrupted batch recovered successfully", {
            roundsRemaining: this.roundsHyperSpin,
            batchStatus: this._currentBatchData.summary.hyperSpinStatus,
            timestamp: new Date().toISOString()
        });

        return true;
    }
}
