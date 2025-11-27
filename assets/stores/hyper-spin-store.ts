import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
import gc from "@sg/game-client-base";
import { CascadingSlotState } from "../cascading-slot-state";
import { AutoPlayStore } from "./auto-play-store";
import { CascadingUIStore } from "./cascading-ui-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { BetControlStore } from "./bet-control-store";
const { injectable, inject } = inversify;
const { FormatUtils } = gc;

// Hyper-spin status types
export type HyperSpinStatus = "Ready" | "Playing" | "Paused" | "Interrupted" | "Cancel";

// Win tag types for multipliers
export type WinTag = "Bronze" | "Silver" | "Gold" | "Amethyst" | null;

// Individual cascade step within a winning spin
export interface CascadeRecord {
    step: number; // Step number in cascade (1, 2, 3...)
    winAmount: number; // Win amount for this step
    winAmountFormatted: string; // Formatted win amount
    multiplier: number; // Multiplier for this step
    multiplierFormatted: string; // Formatted multiplier
    hasScatterTrigger: boolean; // Whether this step triggered scatters
    hasMultiplier: boolean; // Whether this step has multipliers
}

// Single spin data within a hyper-spin batch
export interface HyperSpinSingleSpinData {
    spinId: string | number; // Spin ID (1,2,3...) or free spin marker
    isFreeSpin: boolean; // Whether this is a free spin
    spinWinAmount: string; // Formatted win amount (e.g., "1,234.56")
    spinWinAmountRaw: number; // Raw win amount for calculations
    spinWinMultiplier: string; // Formatted multiplier (e.g., "1.5x")
    spinWinMultiplierRaw: number; // Raw multiplier for calculations
    winTag: WinTag; // Win tag for special wins
    spinBalance: string; // Formatted ending balance
    spinBalanceRaw: number; // Raw ending balance for calculations
    stake: number; // Stake amount for this spin
    isCascadeRecord?: boolean; // Whether this represents a complete cascade (deprecated - use cascadeRecords instead)
    cascadeRecords?: CascadeRecord[]; // Array of individual cascade steps (if cascade occurred)
}

// Hyper-spin batch summary data
export interface HyperSpinBatchSummary {
    totalBet: string; // Formatted total bet amount
    totalBetRaw: number; // Raw total bet for calculations
    hyperSpinStatus: HyperSpinStatus; // Current batch status
    totalWin: string; // Formatted total win amount
    totalWinRaw: number; // Raw total win for calculations
    startingBalance: string; // Formatted starting balance
    startingBalanceRaw: number; // Raw starting balance for calculations
    endBalance: string; // Formatted ending balance
    endBalanceRaw: number; // Raw ending balance for calculations
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
    isHyperSpin = false;

    get isTurnOnHyperSpin() {
        return this.isOpenHyperSpinPopup || this.isHyperSpin;
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
        console.warn("🎯 [HYPER_SPIN_STORE] setStopOnProfit()", {
            value,
            previousValue: this.stopOnProfit,
            min: this.minStopOnProfit,
            max: this.maxStopOnProfit,
            timestamp: new Date().toISOString()
        });

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            console.warn("⚠️ [HYPER_SPIN_STORE] setStopOnProfit() invalid value, skipping");
            return;
        }

        const min = this.minStopOnProfit;
        const max = this.maxStopOnProfit;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnProfit = clampedValue;

        console.warn("✅ [HYPER_SPIN_STORE] setStopOnProfit() completed", {
            finalValue: this.stopOnProfit,
            wasClamped: clampedValue !== value,
            timestamp: new Date().toISOString()
        });
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
        console.warn("🎯 [HYPER_SPIN_STORE] setStopOnLoss()", {
            value,
            previousValue: this.stopOnLoss,
            min: this.minStopOnLoss,
            max: this.maxStopOnLoss,
            timestamp: new Date().toISOString()
        });

        // Validate value to prevent NaN
        if (typeof value !== "number" || isNaN(value)) {
            console.warn("⚠️ [HYPER_SPIN_STORE] setStopOnLoss() invalid value, skipping");
            return;
        }

        const min = this.minStopOnLoss;
        const max = this.maxStopOnLoss;
        // Round to 2 decimal places
        const roundedValue = Math.round(value * 100) / 100;
        // Clamp between min and max
        const clampedValue = Math.max(min, Math.min(max, roundedValue));

        this.stopOnLoss = clampedValue;

        console.warn("✅ [HYPER_SPIN_STORE] setStopOnLoss() completed", {
            finalValue: this.stopOnLoss,
            wasClamped: clampedValue !== value,
            timestamp: new Date().toISOString()
        });
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
        if (!this.cascadingUIStore) {
            return;
        }

        this._hyperSpinInitialBalance = this.cascadingUIStore.userBalance;
        this._hyperSpinCurrentProfit = 0;
        this._hyperSpinCurrentLoss = 0;
    }

    // Fallback for cached code compatibility
    initializeHyperSpinTrackingFallback() {
        this.startHyperSpinSessionTracking();
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
        console.warn("🔄 [HYPER_SPIN_STORE] setHyperSpinActive()", {
            active,
            previousState: this.isHyperSpin,
            roundsRemaining: this.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        this.isHyperSpin = active;

        // Collapse settings when hyper-spin batch play starts
        if (active) {
            this.isSettingsOpen = false;
        }

        // Update UI store flag
        if (this.cascadingUIStore) {
            this.cascadingUIStore.isHyperSpinActive = active;
        }

        console.warn("✅ [HYPER_SPIN_STORE] setHyperSpinActive() completed", {
            isHyperSpin: this.isHyperSpin,
            isHyperSpinActive: this.cascadingUIStore?.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });
    }

    get isHyperSpinActive(): boolean {
        return this.isHyperSpin;
    }


    // Batch data tracking
    private _currentBatchData: HyperSpinBatchData | null = null;
    private _hyperSpinRoundCounter = 0; // Hyper-spin rounds (excludes free spins)
    private _freeSpinCounter = 0; // Free spin counter

    // Cascade tracking for hyper-spin mode
    private _currentCascadeData: {
        spinId: string | number;
        isFreeSpin: boolean;
        mainSpinRecord: HyperSpinSingleSpinData | null;
        accumulatedWin: number;
        stake: number;
        startTime: number;
        hasBigWin: boolean;
        hasMegaWin: boolean;
        hasSuperWin: boolean;
        hasReachMaxWin: boolean;
        freeSpinsTriggered: number;
        totalFreeSpins: number;
        cascadeRecords: CascadeRecord[];
    } | null = null;

    get currentBatchData(): HyperSpinBatchData | null {
        return this._currentBatchData;
    }

    // Computed property for MobX reactivity
    get spinsLength(): number {
        return this._currentBatchData?.spins?.length || 0;
    }

    initializeHyperSpinBatch() {
        console.warn("🎯 [HYPER_SPIN_STORE] initializeHyperSpinBatch()", {
            roundsHyperSpin: this.roundsHyperSpin,
            selectedRoundOnPopup: this.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });

        const startingBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;

        this._currentBatchData = {
            summary: {
                totalBet: this.formatNumber(0, 2),
                totalBetRaw: 0,
                hyperSpinStatus: "Ready",
                totalWin: this.formatNumber(0, 2),
                totalWinRaw: 0,
                startingBalance: this.formatNumber(startingBalanceRaw, 2),
                startingBalanceRaw: startingBalanceRaw,
                endBalance: this.formatNumber(0, 2),
                endBalanceRaw: 0
            },
            spins: []
        };

        this._hyperSpinRoundCounter = 0;
        this._freeSpinCounter = 0;

        console.warn("✅ [HYPER_SPIN_STORE] initializeHyperSpinBatch() completed", {
            startingBalance: this.formatNumber(startingBalanceRaw, 2),
            batchDataExists: !!this._currentBatchData,
            timestamp: new Date().toISOString()
        });
    }

    startHyperSpinBatch() {
        console.warn("▶️ [HYPER_SPIN_STORE] startHyperSpinBatch()", {
            hasBatchData: !!this._currentBatchData,
            roundsHyperSpin: this.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        if (!this._currentBatchData) {
            this.initializeHyperSpinBatch();
        }
        if (this._currentBatchData) {
            this._currentBatchData.summary.hyperSpinStatus = "Playing";
        }

        console.warn("✅ [HYPER_SPIN_STORE] startHyperSpinBatch() completed", {
            hyperSpinStatus: this._currentBatchData?.summary.hyperSpinStatus,
            isHyperSpin: this.isHyperSpin,
            timestamp: new Date().toISOString()
        });
    }

    pauseHyperSpinBatch() {
        if (this._currentBatchData) {
            this._currentBatchData.summary.hyperSpinStatus = "Paused";
        }
    }

    resumeHyperSpinBatch() {
        if (this._currentBatchData) {
            this._currentBatchData.summary.hyperSpinStatus = "Playing";
        }
    }

    completeHyperSpinBatch() {
        console.warn("🛑 [HYPER_SPIN_STORE] completeHyperSpinBatch()", {
            hasBatchData: !!this._currentBatchData,
            spinsCount: this._currentBatchData?.spins?.length || 0,
            currentStatus: this._currentBatchData?.summary.hyperSpinStatus,
            timestamp: new Date().toISOString()
        });

        if (this._currentBatchData) {
            this._currentBatchData.summary.hyperSpinStatus = "Ready";

            const endBalanceRaw = this.cascadingUIStore?.userBalance ?? 0;
            this._currentBatchData.summary.endBalance = this.formatNumber(endBalanceRaw, 2);
            this._currentBatchData.summary.endBalanceRaw = endBalanceRaw;

            console.warn("✅ [HYPER_SPIN_STORE] completeHyperSpinBatch() completed", {
                finalStatus: this._currentBatchData.summary.hyperSpinStatus,
                totalSpins: this._currentBatchData.spins.length,
                totalBet: this._currentBatchData.summary.totalBet,
                totalWin: this._currentBatchData.summary.totalWin,
                endBalance: this._currentBatchData.summary.endBalance,
                timestamp: new Date().toISOString()
            });
        }
    }

    addSpinToBatch(spinData: HyperSpinSingleSpinData) {
        console.warn("📊 [HYPER_SPIN_STORE] addSpinToBatch()", {
            spinId: spinData.spinId,
            isFreeSpin: spinData.isFreeSpin,
            winAmount: spinData.spinWinAmount,
            stake: spinData.stake,
            hasBatchData: !!this._currentBatchData,
            timestamp: new Date().toISOString()
        });

        if (!this._currentBatchData) {
            this.initializeHyperSpinBatch();
        }

        if (this._currentBatchData) {
            this._currentBatchData.spins.push(spinData);

            // Update totals
            this._currentBatchData.summary.totalBetRaw += spinData.stake;
            this._currentBatchData.summary.totalBet = this.formatNumber(
                this._currentBatchData.summary.totalBetRaw, 2
            );

            this._currentBatchData.summary.totalWinRaw += spinData.spinWinAmountRaw;
            this._currentBatchData.summary.totalWin = this.formatNumber(
                this._currentBatchData.summary.totalWinRaw, 2
            );

            console.warn("✅ [HYPER_SPIN_STORE] addSpinToBatch() completed", {
                spinsCount: this._currentBatchData.spins.length,
                runningTotalBet: this._currentBatchData.summary.totalBet,
                runningTotalWin: this._currentBatchData.summary.totalWin,
                timestamp: new Date().toISOString()
            });
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
        this._currentBatchData = null;
        this.resetBatchCounters();
    }

    recoverInterruptedBatch(): boolean {
        if (!this._currentBatchData || this._currentBatchData.summary.hyperSpinStatus !== "Interrupted") {
            return false;
        }

        this._currentBatchData.summary.hyperSpinStatus = "Playing";
        this.setHyperSpinActive(true);
        return true;
    }

    // Cascade tracking methods for hyper-spin mode
    startCascadeTracking(spinId: string | number, isFreeSpin: boolean, stake: number) {
        console.warn("🎯 [HYPER_SPIN_STORE] startCascadeTracking()", {
            spinId,
            isFreeSpin,
            stake,
            isHyperSpin: this.isHyperSpin,
            timestamp: new Date().toISOString()
        });

        if (!this.isHyperSpin) {
            console.warn("⚠️ [HYPER_SPIN_STORE] startCascadeTracking() skipped - not in hyper spin mode");
            return; // Only track cascades in hyper-spin mode
        }

        // Get current balance for the main spin record
        const currentBalance = this.cascadingUIStore?.userBalance ?? 0;

        // Create initial main spin record (will be updated as cascade progresses)
        const mainSpinRecord: HyperSpinSingleSpinData = {
            spinId,
            isFreeSpin,
            spinWinAmount: FormatUtils.numberWithCommas(0, 2, false), // Will be updated
            spinWinAmountRaw: 0, // Will be updated
            spinWinMultiplier: FormatUtils.numberWithCommas(0, 2, false), // Will be updated
            spinWinMultiplierRaw: 0, // Will be updated
            winTag: null, // Will be updated
            spinBalance: FormatUtils.numberWithCommas(currentBalance, 2, false),
            spinBalanceRaw: currentBalance,
            stake,
            cascadeRecords: [] // Will be populated with cascade steps
        };

        this._currentCascadeData = {
            spinId,
            isFreeSpin,
            mainSpinRecord,
            accumulatedWin: 0,
            stake,
            startTime: Date.now(),
            hasBigWin: false,
            hasMegaWin: false,
            hasSuperWin: false,
            hasReachMaxWin: false,
            freeSpinsTriggered: 0,
            totalFreeSpins: 0,
            cascadeRecords: []
        };

        console.warn("✅ [HYPER_SPIN_STORE] startCascadeTracking() completed", {
            spinId,
            isFreeSpin,
            stake,
            currentBalance,
            cascadeDataCreated: !!this._currentCascadeData,
            timestamp: new Date().toISOString()
        });
    }

    accumulateCascadeWin(winAmount: number, bigWin: boolean = false, megaWin: boolean = false, superWin: boolean = false, reachMaxWin: boolean = false, freeSpins: number = 0, totalFreeSpins: number = 0, hasScatterTrigger: boolean = false, hasMultiplier: boolean = false) {
        console.warn("📊 [HYPER_SPIN_STORE] accumulateCascadeWin()", {
            winAmount,
            bigWin,
            megaWin,
            superWin,
            reachMaxWin,
            freeSpins,
            totalFreeSpins,
            hasCascadeData: !!this._currentCascadeData,
            timestamp: new Date().toISOString()
        });

        if (!this._currentCascadeData) {
            console.warn("⚠️ [HYPER_SPIN_STORE] No cascade tracking active, skipping win accumulation");
            return;
        }

        // Calculate step multiplier (win / stake)
        const stepMultiplier = this._currentCascadeData.stake > 0 ? winAmount / this._currentCascadeData.stake : 0;

        // Create cascade record for this step
        const cascadeRecord: CascadeRecord = {
            step: this._currentCascadeData.cascadeRecords.length + 1,
            winAmount,
            winAmountFormatted: FormatUtils.numberWithCommas(winAmount, 2, false),
            multiplier: stepMultiplier,
            multiplierFormatted: FormatUtils.numberWithCommas(stepMultiplier, 2, false),
            hasScatterTrigger,
            hasMultiplier
        };

        // Add to cascade records array
        this._currentCascadeData.cascadeRecords.push(cascadeRecord);

        // Update accumulated totals
        this._currentCascadeData.accumulatedWin += winAmount;
        this._currentCascadeData.hasBigWin = this._currentCascadeData.hasBigWin || bigWin;
        this._currentCascadeData.hasMegaWin = this._currentCascadeData.hasMegaWin || megaWin;
        this._currentCascadeData.hasSuperWin = this._currentCascadeData.hasSuperWin || superWin;
        this._currentCascadeData.hasReachMaxWin = this._currentCascadeData.hasReachMaxWin || reachMaxWin;
        this._currentCascadeData.freeSpinsTriggered = Math.max(this._currentCascadeData.freeSpinsTriggered, freeSpins);
        this._currentCascadeData.totalFreeSpins = Math.max(this._currentCascadeData.totalFreeSpins, totalFreeSpins);

        console.warn("✅ [HYPER_SPIN_STORE] accumulateCascadeWin() completed", {
            spinId: this._currentCascadeData.spinId,
            step: cascadeRecord.step,
            stepWin: winAmount,
            accumulatedWin: this._currentCascadeData.accumulatedWin,
            totalSteps: this._currentCascadeData.cascadeRecords.length,
            hasBigWin: this._currentCascadeData.hasBigWin,
            hasMegaWin: this._currentCascadeData.hasMegaWin,
            hasSuperWin: this._currentCascadeData.hasSuperWin,
            hasReachMaxWin: this._currentCascadeData.hasReachMaxWin,
            freeSpinsTriggered: this._currentCascadeData.freeSpinsTriggered,
            timestamp: new Date().toISOString()
        });
    }

    completeCascadeTracking(): HyperSpinSingleSpinData | null {
        console.warn("🏁 [HYPER_SPIN_STORE] completeCascadeTracking()", {
            hasCascadeData: !!this._currentCascadeData,
            spinId: this._currentCascadeData?.spinId,
            accumulatedWin: this._currentCascadeData?.accumulatedWin,
            cascadeSteps: this._currentCascadeData?.cascadeRecords?.length,
            timestamp: new Date().toISOString()
        });

        if (!this._currentCascadeData) {
            console.warn("⚠️ [HYPER_SPIN_STORE] No cascade tracking active, cannot complete");
            return null;
        }

        const cascadeData = this._currentCascadeData;
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
        mainSpinRecord.spinWinAmount = FormatUtils.numberWithCommas(cascadeData.accumulatedWin, 2, false);
        mainSpinRecord.spinWinAmountRaw = cascadeData.accumulatedWin;
        mainSpinRecord.spinWinMultiplier = FormatUtils.numberWithCommas(multiplier, 2, false);
        mainSpinRecord.spinWinMultiplierRaw = multiplier;
        mainSpinRecord.winTag = winTag;
        mainSpinRecord.spinBalance = FormatUtils.numberWithCommas(currentBalance, 2, false);
        mainSpinRecord.spinBalanceRaw = currentBalance;

        // Only include cascadeRecords if there were actual cascade steps
        if (cascadeData.cascadeRecords.length > 0) {
            mainSpinRecord.cascadeRecords = [...cascadeData.cascadeRecords];
        }

        // Clear cascade tracking
        this._currentCascadeData = null;

        console.warn("✅ [HYPER_SPIN_STORE] completeCascadeTracking() completed", {
            spinId: cascadeData.spinId,
            totalAccumulatedWin: cascadeData.accumulatedWin,
            multiplier,
            winTag,
            cascadeSteps: cascadeData.cascadeRecords.length,
            duration: Date.now() - cascadeData.startTime,
            spinRecordCreated: !!mainSpinRecord,
            timestamp: new Date().toISOString()
        });

        return mainSpinRecord;
    }

    isCascadeTrackingActive(): boolean {
        return this._currentCascadeData !== null;
    }

    getCurrentCascadeData() {
        return this._currentCascadeData;
    }
}
