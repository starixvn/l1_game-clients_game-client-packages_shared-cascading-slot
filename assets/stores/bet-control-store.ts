import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet } from "../cascading-slot-utils";
import { AutoPlayStore } from "./auto-play-store";
import { CascadingUIStore } from "./cascading-ui-store";
const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(FSBPromotionStore) protected readonly fsbPromotionStore: FSBPromotionStore;
    constructor() {
        cascadingSlotLogger.info("[BET_CONTROL_STORE] BetControlStore constructor called", {
            cascadingUIStoreInjected: !!this.cascadingUIStore,
            autoPlayStoreInjected: !!this.autoPlayStore,
            fsbPromotionUIStoreInjected: !!this.fsbPromotionUIStore,
            fsbPromotionStoreInjected: !!this.fsbPromotionStore,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[BET_CONTROL_STORE] Setting up MobX reactions for bet control", {
            timestamp: new Date().toISOString()
        });

        mobx.reaction(
            () => this.currentCoinIndex,
            () => {
                cascadingSlotLogger.info("[BET_CONTROL_STORE] Coin index changed, triggering onChangeCoinAndBetLevel", {
                    newCoinIndex: this.currentCoinIndex,
                    newCoinValue: this.coinValues[this.currentCoinIndex],
                    timestamp: new Date().toISOString()
                });
                this.onChangeCoinAndBetLevel();
            }
        );
        mobx.reaction(
            () => this.currentBetLevelIndex,
            () => {
                cascadingSlotLogger.info("[BET_CONTROL_STORE] Bet level index changed, triggering onChangeCoinAndBetLevel", {
                    newBetLevelIndex: this.currentBetLevelIndex,
                    newBetLevel: this.betLevels[this.currentBetLevelIndex],
                    timestamp: new Date().toISOString()
                });
                this.onChangeCoinAndBetLevel();
            }
        );

        cascadingSlotLogger.info("[BET_CONTROL_STORE] MobX reactions setup completed", {
            timestamp: new Date().toISOString()
        });
    }

    isOpenBetAmountPopup = false;

    totalBetUnique = [];
    betLevels: number[] = [];
    coinValues: number[] = [];
    betMultiplier = 0;
    defaultCoinValue = 0;

    _totalBet = 0;

    resumeLastBet = false;

    needClearLastSetting = false;

    _lastSetting = null;

    get lastSetting() {
        cascadingSlotLogger.info("[BET_CONTROL_STORE] get lastSetting accessed", {
            lastSetting: this._lastSetting,
            timestamp: new Date().toISOString()
        });
        return this._lastSetting;
    }

    set lastSetting(value: { betLevel: number; coinValue: number }) {
        cascadingSlotLogger.info("[BET_CONTROL_STORE] set lastSetting called", {
            previousLastSetting: this._lastSetting,
            newLastSetting: value,
            timestamp: new Date().toISOString()
        });
        this._lastSetting = value;
    }

    get betLevel() {
        const result = this.betLevels[this.currentBetLevelIndex] ?? 0;
        cascadingSlotLogger.info("[BET_CONTROL_STORE] get betLevel accessed", {
            currentBetLevelIndex: this.currentBetLevelIndex,
            betLevelsLength: this.betLevels.length,
            calculatedBetLevel: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get coinValue() {
        const result = this.coinValues[this.currentCoinIndex] ?? 0;
        cascadingSlotLogger.info("[BET_CONTROL_STORE] get coinValue accessed", {
            currentCoinIndex: this.currentCoinIndex,
            coinValuesLength: this.coinValues.length,
            calculatedCoinValue: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    set totalBet(value: number) {
        cascadingSlotLogger.info("[BET_CONTROL_STORE] set totalBet called", {
            previousTotalBet: this._totalBet,
            newTotalBet: value,
            resumeLastBet: this.resumeLastBet,
            timestamp: new Date().toISOString()
        });
        this._totalBet = value;
    }

    get totalBet() {
        cascadingSlotLogger.info("[BET_CONTROL_STORE] get totalBet accessed", {
            resumeLastBet: this.resumeLastBet,
            totalBetUniqueLength: this.totalBetUnique.length,
            currentTotalBetIndex: this.currentTotalBetIndex,
            timestamp: new Date().toISOString()
        });

        if (this.resumeLastBet) {
            cascadingSlotLogger.info("[BET_CONTROL_STORE] Returning resume last bet value", {
                resumeLastBetValue: this._totalBet,
                timestamp: new Date().toISOString()
            });
            return this._totalBet;
        }

        if (
            this.totalBetUnique.length === 0 ||
            this.currentTotalBetIndex === -1 ||
            this.currentTotalBetIndex >= this.totalBetUnique.length
        ) {
            cascadingSlotLogger.info("[BET_CONTROL_STORE] Returning 0 due to invalid total bet state", {
                totalBetUniqueLength: this.totalBetUnique.length,
                currentTotalBetIndex: this.currentTotalBetIndex,
                reason: this.totalBetUnique.length === 0 ? "empty totalBetUnique" :
                       this.currentTotalBetIndex === -1 ? "invalid index -1" :
                       "index out of bounds",
                timestamp: new Date().toISOString()
            });
            return 0;
        }

        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        const result = +total;

        cascadingSlotLogger.info("[BET_CONTROL_STORE] Calculated total bet from unique array", {
            item,
            totalKey: total,
            parsedTotalBet: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    currentBetLevelIndex = 0;
    currentCoinIndex = 0;
    currentTotalBetIndex = 0;

    get disabledChangeBet() {
        return this.cascadingUIStore.isFreeSpins || this.cascadingUIStore.disabledOpenInputBet;
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
        return {
            increase: this.currentTotalBetIndex < this.totalBetUnique.length - 1,
            decrease: this.currentTotalBetIndex > 0,
        };
    }

    syncCurrentTotalBetIndex(totalBet: number) {
        this.currentTotalBetIndex = this.totalBetUnique.findIndex((detail) => +Object.keys(detail)[0] === totalBet);
    }

    onChangeCoinAndBetLevel() {
        const totalBet = calculateTotalBet(this.betLevel, this.coinValue, this.betMultiplier);
        this.syncCurrentTotalBetIndex(totalBet);
    }

    get isCollapseMenuInGame() {
        return (
            this.cascadingUIStore.cascadingState === CascadingSlotState.SPINNING ||
            this.autoPlayStore.isOpenAutoplayPopup ||
            this.isOpenBetAmountPopup
        );
    }

    get effectiveCoinValue() {
        return this.fsbPromotionUIStore.isFSBPromotionInProgress ? this.fsbPromotionStore.promotion?.coinValue : this.coinValue;
    }

    get effectiveBetLevel() {
        return this.fsbPromotionUIStore.isFSBPromotionInProgress ? this.fsbPromotionStore.promotion?.betLevel : this.betLevel;
    }

    get effectiveTotalBet() {
        return this.fsbPromotionUIStore.isFSBPromotionInProgress
            ? calculateTotalBet(this.fsbPromotionStore.promotion?.betLevel, this.fsbPromotionStore.promotion?.coinValue, this.betMultiplier)
            : this.totalBet;
    }
}
