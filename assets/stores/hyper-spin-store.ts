import gc from "@sg/game-client-base";
import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotState } from "../cascading-slot-state";
import { AutoPlayStore } from "./auto-play-store";
import { BetControlStore } from "./bet-control-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { CascadingUIStore } from "./cascading-ui-store";
const { injectable, inject } = inversify;
const { FormatUtils } = gc;

// Hyper-spin status types
export type HyperSpinStatus = "Ready" | "Playing" | "Paused" | "Interrupted" | "Cancel";

// Win tag types for multipliers
export type WinTag = "Bronze" | "Silver" | "Gold" | "Amethyst" | null;

// Individual cascade step within a winning spin
export interface DetailRecord {
    winAmount: number; // Win amount for this step
    multiplier: number; // Multiplier for this step
    winLevel: number;
}

// Single spin data within a hyper-spin batch
export interface HyperSpinSingleSpinData {
    spinId: number;
    isFreeSpin: boolean;
    balanceBefore: number;
    bet: number;

    totalWin?: number;
    totalMultiplier?: number;
    winLevel?: number;
    balanceAfter?: number;
    detailRecords?: DetailRecord[];
}

// Hyper-spin batch summary data
export interface HyperSpinBatchSummary {
    totalBet: string; // Formatted total bet amount
    totalBetRaw: number; // Raw total bet for calculations
    hyperSpinStatus: HyperSpinStatus; // Current batch status
    totalWin: number;
    startingBalance: number;
    endBalance: number;
}

// Complete hyper-spin batch data
export interface HyperSpinBatchData {
    summary: HyperSpinBatchSummary; // Batch summary info
    spins: HyperSpinSingleSpinData[]; // Array of individual spin data
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


        // Clamp stop conditions when total bet changes
        mobx.reaction(
            () => this.betControlStore?.totalBet,
            () => {
                if (!this.betControlStore || !this.cascadingUIStore || !this.configStore) {
                    return;
                }

                const maxWinPerRound = this.configStore.gameConfigs?.maxWinPerRound ?? 0;
                const currentMaxStopOnProfit = this.maxStopOnProfit;
                const currentMaxStopOnLoss = this.maxStopOnLoss;

                // Clamp stop on profit/loss to new max values
                if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0 && this.stopOnProfit > currentMaxStopOnProfit) {
                    this.setStopOnProfit(currentMaxStopOnProfit);
                }
                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0 && this.stopOnLoss > currentMaxStopOnLoss) {
                    this.setStopOnLoss(currentMaxStopOnLoss);
                }
            }
        );
        // Clamp stop on loss when user balance changes
        mobx.reaction(
            () => this.cascadingUIStore?.userBalance,
            () => {
                if (!this.cascadingUIStore) {
                    return;
                }

                const currentMaxStopOnLoss = this.maxStopOnLoss;

                if (this.cascadingUIStore.userBalance > 0 && currentMaxStopOnLoss > 0) {
                    // Clamp if exceeds new max
                    if (this.stopOnLoss > currentMaxStopOnLoss) {
                        this.setStopOnLoss(currentMaxStopOnLoss);
                    }
                    // Adjust if max decreased and stopOnLoss was at old max
                    else if (this._previousMaxStopOnLoss > 0 && currentMaxStopOnLoss < this._previousMaxStopOnLoss) {
                        const threshold = this._previousMaxStopOnLoss * 0.99;
                        if (this.stopOnLoss >= threshold) {
                            this.setStopOnLoss(currentMaxStopOnLoss);
                        }
                    }
                    this._previousMaxStopOnLoss = currentMaxStopOnLoss;
                }
            }
        );
        // Clamp stop on profit when total bet changes
        mobx.reaction(
            () => this.betControlStore?.totalBet,
            () => {
                if (!this.betControlStore || !this.configStore) {
                    return;
                }

                const maxWinPerRound = this.configStore.gameConfigs?.maxWinPerRound ?? 0;
                const currentMaxStopOnProfit = this.maxStopOnProfit;

                if (maxWinPerRound > 0 && currentMaxStopOnProfit > 0) {
                    // Clamp if exceeds new max
                    if (this.stopOnProfit > currentMaxStopOnProfit) {
                        this.setStopOnProfit(currentMaxStopOnProfit);
                    }
                    // Adjust if max decreased and stopOnProfit was at old max
                    else if (this._previousMaxStopOnProfit > 0 && currentMaxStopOnProfit < this._previousMaxStopOnProfit) {
                        const threshold = this._previousMaxStopOnProfit * 0.99;
                        if (this.stopOnProfit >= threshold) {
                            this.setStopOnProfit(currentMaxStopOnProfit);
                        }
                    }
                    this._previousMaxStopOnProfit = currentMaxStopOnProfit;
                }
            }
        );

        // Initialize previous max values after stores are ready
        setTimeout(() => {
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

    // UI state
    isOpenHyperSpinBetControlPopup = false;
    roundsList = [10, 50, 100, 500, 1000];
    isOpenHyperSpinPopup = false;
    selectedRoundOnPopup = this.roundsList[2]; // Default to 100
    roundsHyperSpin = 0;
    isActiveHyperSpin = false;
    winLevelConfig = [6, 20, 30];

    get isTurnOnHyperSpin() {
        return this.isOpenHyperSpinPopup || this.isActiveHyperSpin;
    }

    // Stop conditions
    stopOnProfit = 0;
    stopOnLoss = 0;
    stopOnFeature = false;
    isSettingsOpen = true;
    needClearLastSetting = false;

    // Previous max values for clamping logic
    private _previousMaxStopOnProfit = 0;
    private _previousMaxStopOnLoss = 0;

    // Hyper-spin session tracking
    private _hyperSpinInitialBalance = 0;
    private _hyperSpinCurrentProfit = 0;
    private _hyperSpinCurrentLoss = 0;

    get hyperSpinInitialBalance(): number {
        return this._hyperSpinInitialBalance;
    }


    get totalBet() {
        return this.betControlStore?.totalBet ?? 0;
    }

    currentTotalBetIndex = 0;

    get disabledChangeBet() {
        return this.cascadingUIStore?.isFreeSpins || this.cascadingUIStore?.disabledOpenInputBet || false;
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


    get isCollapseMenuInGame() {
        return (
            (this.cascadingUIStore?.cascadingState === CascadingSlotState.SPINNING) ||
            (this.autoPlayStore?.isOpenAutoplayPopup) ||
            this.isOpenHyperSpinPopup
        );
    }


    get maxStopOnProfit() {
        const maxWinPerRound = this.configStore?.gameConfigs?.maxWinPerRound ?? 0;
        const currentTotalBet = this.betControlStore?.totalBet ?? 0;
        return currentTotalBet * maxWinPerRound;
    }

    get minStopOnProfit() {
        return 0;
    }

    get stopOnProfitStep() {
        return this.betControlStore?.totalBet ?? 0;
    }

    changeStopOnProfit(increase: boolean) {
        const step = this.stopOnProfitStep;
        const newValue = increase ? this.stopOnProfit + step : this.stopOnProfit - step;
        this.setStopOnProfit(newValue);
    }

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

    get maxStopOnLoss() {
        return this.cascadingUIStore?.userBalance ?? 0;
    }

    get minStopOnLoss() {
        return 0;
    }

    get stopOnLossStep() {
        return this.betControlStore?.totalBet ?? 0;
    }

    changeStopOnLoss(increase: boolean) {
        const step = this.stopOnLossStep;
        const newValue = increase ? this.stopOnLoss + step : this.stopOnLoss - step;
        this.setStopOnLoss(newValue);
    }

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

    // Computed properties for UI state - Stop On Profit
    get interactableStopOnProfit(): { increase: boolean; decrease: boolean } {
        return {
            increase: this.stopOnProfit < this.maxStopOnProfit,
            decrease: this.stopOnProfit > this.minStopOnProfit
        };
    }

    get stopOnProfitSliderProgress(): number {
        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        return max > min ? Math.max(0, Math.min(1, (this.stopOnProfit - min) / (max - min))) : 0;
    }

    get formattedStopOnProfit(): string {
        return FormatUtils.numberWithCommas(this.stopOnProfit, 2, true);
    }

    // Computed properties for UI state - Stop On Loss
    get interactableStopOnLoss(): { increase: boolean; decrease: boolean } {
        return {
            increase: this.stopOnLoss < this.maxStopOnLoss,
            decrease: this.stopOnLoss > this.minStopOnLoss
        };
    }

    get stopOnLossSliderProgress(): number {
        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        return max > min ? Math.max(0, Math.min(1, (this.stopOnLoss - min) / (max - min))) : 0;
    }

    get formattedStopOnLoss(): string {
        return FormatUtils.numberWithCommas(this.stopOnLoss, 2, true);
    }

    startHyperSpinSessionTracking() {
        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;
    }

    stopHyperSpinSessionTracking() {
        this._hyperSpinInitialBalance = 0;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;
    }

    updateHyperSpinProfitLoss() {
        if (this._hyperSpinInitialBalance === 0 || !this.cascadingUIStore) {
            return;
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

    getCurrentHyperSpinProfit(): number {
        return this._hyperSpinCurrentProfit;
    }

    getCurrentHyperSpinLoss(): number {
        return this._hyperSpinCurrentLoss;
    }

    setHyperSpinActive(active: boolean) {
        this.isActiveHyperSpin = active;

        // Collapse settings when hyper-spin batch play starts
        if (active) {
            this.isSettingsOpen = false;
        }

        // Update UI store flag
        if (this.cascadingUIStore) {
            this.cascadingUIStore.isHyperSpinActive = active;
        }
    }

    get isHyperSpinActive(): boolean {
        return this.isActiveHyperSpin;
    }


    // Batch data tracking
    private _spinBatchData: HyperSpinBatchData | null = null;
    private _hyperSpinRoundCounter = 0; // Hyper-spin rounds (excludes free spins)
    private _freeSpinCounter = 0; // Free spin counter

    // Cascade tracking for hyper-spin mode
    private _singleSpinData: HyperSpinSingleSpinData = null;

    get spinBatchData(): HyperSpinBatchData {
        return this._spinBatchData;
    }

    // Computed property for MobX reactivity
    get spinsLength(): number {
        return this._spinBatchData?.spins?.length || 0;
    }

    initializeHyperSpinBatch() {
        const startingBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;

        this._spinBatchData = {
            summary: {
                totalBet: this.formatNumber(0, 2),
                totalBetRaw: 0,
                hyperSpinStatus: "Ready",
                totalWin: 0,
                startingBalance: startingBalanceRaw,
                endBalance: 0
            },
            spins: []
        };

        this._hyperSpinRoundCounter = 0;
        this._freeSpinCounter = 0;
    }

    startHyperSpinBatch() {
        if (!this._spinBatchData) {
            this.initializeHyperSpinBatch();
        }
        if (this._spinBatchData) {
            this._spinBatchData.summary.hyperSpinStatus = "Playing";
        }
    }

    pauseHyperSpinBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.hyperSpinStatus = "Paused";
        }
    }

    resumeHyperSpinBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.hyperSpinStatus = "Playing";
        }
    }

    completeHyperSpinBatch() {
        if (this._spinBatchData) {
            this._spinBatchData.summary.hyperSpinStatus = "Ready";

            const endBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;
            this._spinBatchData.summary.endBalance = endBalanceRaw;
        }
    }

    addSpinToBatch(spinData: HyperSpinSingleSpinData) {
        if (this._spinBatchData) {
            this._spinBatchData.spins.push(spinData);

            // Update totals
            this._spinBatchData.summary.totalBetRaw += spinData.bet;
            this._spinBatchData.summary.totalBet = this.formatNumber(
                this._spinBatchData.summary.totalBetRaw, 2
            );

            this._spinBatchData.summary.totalWin += spinData.totalWin;
        }
    }

    private formatNumber(value: number, decimals = 2): string {
        return FormatUtils.numberWithCommas(value, decimals, true);
    }

    formatMultiplier(multiplier: number): string {
        const formatted = FormatUtils.numberWithCommas(multiplier, 2, true);
        return `${formatted}x`;
    }

    determineWinTag(
        winAmount: number,
        stake: number,
        bigWin: boolean,
        megaWin: boolean,
        superWin: boolean,
        reachMaxWin: boolean
    ): WinTag {
        if (reachMaxWin) {
            return "Amethyst";
        }
        if (megaWin) {
            return "Gold";
        }
        if (superWin) {
            return "Silver";
        }
        if (bigWin) {
            return "Bronze";
        }
        return null;
    }

    getNextHyperSpinId(): number {
        this._hyperSpinRoundCounter++;
        return this._hyperSpinRoundCounter;
    }

    getNextFreeSpinId(): number {
        this._freeSpinCounter++;
        return this._freeSpinCounter;
    }

    resetBatchCounters() {
        this._hyperSpinRoundCounter = 0;
        this._freeSpinCounter = 0;
    }

    clearBatchData() {
        this._spinBatchData = null;
        this.resetBatchCounters();
    }

    recoverInterruptedBatch(): boolean {
        if (!this._spinBatchData || this._spinBatchData.summary.hyperSpinStatus !== "Interrupted") {
            return false;
        }

        this._spinBatchData.summary.hyperSpinStatus = "Playing";
        this.setHyperSpinActive(true);
        return true;
    }

    // Cascade tracking methods for hyper-spin mode
    startCascadeTracking(spinId: string | number, isFreeSpin: boolean, stake: number) {
        if (!this.isActiveHyperSpin) {
            return; // Only track cascades in hyper-spin mode
        }


    }

    initNewSingleSpinData(info: { isFreeSpin: boolean, bet: number, balance: number }) {
        if (!this.isCascadeTrackingActive()) {
            let spinId: number;
            if (info.isFreeSpin) {
                spinId = this.getNextFreeSpinId();
            } else {
                spinId = this.getNextHyperSpinId();
            }

            this._singleSpinData = {
                spinId,
                isFreeSpin: info.isFreeSpin,
                bet: info.bet,
                balanceBefore: info.balance
            };
        }
    }

    updateSettlementSingleSpinData(info: { totalWin: number, balanceAfter: number, detailRecords?: DetailRecord[] }) {
        if (!this._singleSpinData) {
            return;
        }

        this._singleSpinData.totalWin = info.totalWin;
        this._singleSpinData.balanceAfter = info.balanceAfter;
        this._singleSpinData.detailRecords = info.detailRecords;

        const { multiplier, winLevel } = this.calculateMultiplier(info.totalWin, this._singleSpinData.bet);
        this._singleSpinData.totalMultiplier = multiplier;
        this._singleSpinData.winLevel = winLevel;
    }

    calculateMultiplier(winAmount: number, stake: number): { multiplier: number, winLevel: number } {
        const multiplier = stake > 0 ? winAmount / stake : 0;
        const winLevel = this.winLevelConfig.findIndex(level => multiplier < level);
        return { multiplier, winLevel };
    }

    completeCascadeTracking(): HyperSpinSingleSpinData | null {
        if (!this._singleSpinData) {
            return null;
        }

        const cascadeData = this._singleSpinData;
        const multiplier = cascadeData.stake > 0 ? cascadeData.accumulatedWin / cascadeData.stake : 0;

        // Determine win tag based on accumulated cascade results
        const winTag = this.determineWinTag(
            cascadeData.accumulatedWin,
            cascadeData.stake,
            cascadeData.hasBigWin,
            cascadeData.hasMegaWin,
            cascadeData.hasSuperWin,
            cascadeData.hasReachMaxWin
        );

        // Get current balance for the final spin record
        const currentBalance = this.cascadingUIStore?.userBalance ?? 0;

        // Update the main spin record with final cascade data
        const mainSpinRecord = cascadeData.mainSpinRecord!;
        mainSpinRecord.totalWin = cascadeData.accumulatedWin;
        mainSpinRecord.totalMultiplier = multiplier;
        mainSpinRecord.winTag = winTag;
        mainSpinRecord.balanceBefore = currentBalance;

        // Only include cascadeRecords if there were actual cascade steps
        if (cascadeData.detailRecords.length > 0) {
            mainSpinRecord.cascadeRecords = [...cascadeData.detailRecords];
        }

        // Clear cascade tracking
        this._singleSpinData = null;


        return mainSpinRecord;
    }

    isCascadeTrackingActive(): boolean {
        return this._singleSpinData !== null;
    }

    getCurrentCascadeData() {
        return this._singleSpinData;
    }
}
