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

        mobx.makeAutoObservable(this);

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
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                }

                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0) {
                    // Clamp stopOnLoss when totalBet changes to ensure it doesn't exceed new max
                    if (this.stopOnLoss > currentMaxStopOnLoss) {
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
                        this.setStopOnLoss(currentMaxStopOnLoss);
                    }
                    // If max decreased and stopOnLoss was at or near the old max, adjust to new max
                    else if (this._previousMaxStopOnLoss > 0 && currentMaxStopOnLoss < this._previousMaxStopOnLoss) {
                        const threshold = this._previousMaxStopOnLoss * 0.99; // 99% threshold to handle floating point
                        if (this.stopOnLoss >= threshold) {
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
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                    // If max decreased and stopOnProfit was at or near the old max, adjust to new max
                    else if (this._previousMaxStopOnProfit > 0 && currentMaxStopOnProfit < this._previousMaxStopOnProfit) {
                        const threshold = this._previousMaxStopOnProfit * 0.99; // 99% threshold to handle floating point
                        if (this.stopOnProfit >= threshold) {
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
        const step = this.stopOnProfitStep; // Step is equal to totalBet
        const newValue = increase ? this.stopOnProfit + step : this.stopOnProfit - step;
        this.setStopOnProfit(newValue);
    }

    /**
     * Set stop on profit value with bounds checking
     * @param value - The new stop on profit value
     */
    setStopOnProfit(value: number) {

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            return;
        }

        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnProfit = clampedValue;

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
        const step = this.stopOnLossStep; // Step is equal to totalBet (1x total bet)
        const newValue = increase ? this.stopOnLoss + step : this.stopOnLoss - step;
        this.setStopOnLoss(newValue);
    }

    /**
     * Set stop on loss value with bounds checking
     * @param value - The new stop on loss value
     */
    setStopOnLoss(value: number) {

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            return;
        }

        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnLoss = clampedValue;

    }

    /**
     * Start tracking profit/loss for hyper-spin session
     */
    startHyperSpinSessionTracking() {

        if (!this.cascadingUIStore) {
            return;
        }

        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

    }

    /**
     * Fallback method to initialize tracking if the main method is not available
     * This is used when the browser has cached code that doesn't include the startHyperSpinSessionTracking method
     */
    initializeHyperSpinTrackingFallback() {

        if (!this.cascadingUIStore) {
            return;
        }

        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

    }

    /**
     * Stop tracking profit/loss for hyper-spin session
     */
    stopHyperSpinSessionTracking() {

        const finalBalance = this.cascadingUIStore?.userBalance ?? 0;
        const totalSessionChange = finalBalance - this._hyperSpinInitialBalance;
        const netResult = this._hyperSpinCurrentProfit - this._hyperSpinCurrentLoss;

        this._hyperSpinInitialBalance = 0;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;

    }

    /**
     * Update profit/loss tracking based on current balance
     */
    updateHyperSpinProfitLoss() {

        if (this._hyperSpinInitialBalance === 0 || !this.cascadingUIStore) {
            return; // Not tracking or store not available
        }

        const currentBalance = this.cascadingUIStore.userBalance;
        const balanceChange = currentBalance - this._hyperSpinInitialBalance;

        if (balanceChange > 0) {
            this._hyperSpinCurrentProfit = balanceChange;
            this._hyperSpinCurrentLoss = 0;
        } else if (balanceChange < 0) {
            this._hyperSpinCurrentProfit = 0;
            this._hyperSpinCurrentLoss = Math.abs(balanceChange);
        } else {
            this._hyperSpinCurrentProfit = 0;
            this._hyperSpinCurrentLoss = 0;
        }

    }

    /**
     * Get current profit during hyper-spin session
     */
    getCurrentHyperSpinProfit(): number {
        return this._hyperSpinCurrentProfit;
    }

    /**
     * Get current loss during hyper-spin session
     */
    getCurrentHyperSpinLoss(): number {
        return this._hyperSpinCurrentLoss;
    }

    /**
     * Set hyper-spin active state
     * Updates all related flags: isHyperSpin and cascadingUIStore.isHyperSpinActive
     * @param active - true to activate hyper-spin, false to deactivate
     */
    setHyperSpinActive(active: boolean) {

        this.isHyperSpin = active;

        // Update UI store flag
        if (this.cascadingUIStore) {
            this.cascadingUIStore.isHyperSpinActive = active;
        }

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

    }

    /**
     * Start hyper-spin batch (set status to Playing)
     */
    startHyperSpinBatch() {

        if (!this._currentBatchData) {
            this.initializeHyperSpinBatch();
        }

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Playing";

        }
    }

    /**
     * Pause hyper-spin batch (set status to Paused)
     */
    pauseHyperSpinBatch() {

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Paused";

        }
    }

    /**
     * Resume hyper-spin batch (set status to Playing)
     */
    resumeHyperSpinBatch() {

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Playing";

        }
    }

    /**
     * Complete hyper-spin batch (set status to Ready)
     */
    completeHyperSpinBatch() {

        if (this._currentBatchData) {
            const previousStatus = this._currentBatchData.summary.hyperSpinStatus;
            this._currentBatchData.summary.hyperSpinStatus = "Ready";

            // Get end balance from cascadingUIStore
            const endBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;
            const endBalance = this.formatNumber(endBalanceRaw, 2);
            this._currentBatchData.summary.endBalance = endBalance;
            this._currentBatchData.summary.endBalanceRaw = endBalanceRaw;

        }
    }

    /**
     * Add a spin to the current batch
     * @param spinData - The spin data to add
     */
    addSpinToBatch(spinData: HyperSpinSingleSpinData) {

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
    }

    /**
     * Clear current batch data
     */
    clearBatchData() {
        this._currentBatchData = null;
        this.resetBatchCounters();

    }

    /**
     * Recover an interrupted batch (called by HyperSpinHandler)
     */
    recoverInterruptedBatch(): boolean {

        if (!this._currentBatchData || this._currentBatchData.summary.hyperSpinStatus !== "Interrupted") {
            return false;
        }

        // Reset batch status to Playing
        this._currentBatchData.summary.hyperSpinStatus = "Playing";

        // Set hyper-spin as active
        this.setHyperSpinActive(true);

        return true;
    }
}
