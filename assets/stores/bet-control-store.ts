import gc from "@sg/game-client-base";
import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
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
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
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
    }

    isOpenBetAmountPopup = false;

    totalBetUnique = [];
    betLevels: number[] = [];
    coinValues: number[] = [];
    betMultiplier = 0;
    defaultCoinValue = 0;

    _totalBet = 0;

    resumeLastBet = false;
    resumeLastBetXMode = false;
    xModeFreeSpin = 1;

    needClearLastSetting = false;

    _lastSetting = null;

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

    set totalBet(value: number) {
        this._totalBet = value;
    }

    get totalBet() {
        if (this.resumeLastBet) {
            return this.totalBetWithXMode();
        }

        if (
            this.totalBetUnique.length === 0 ||
            this.currentTotalBetIndex === -1 ||
            this.currentTotalBetIndex >= this.totalBetUnique.length
        ) {
            return 0;
        }
        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        return +total;
    }

    totalBetWithXMode() {
        return this.mainPlayerStore.xMode > 1 && this.xModeFreeSpin === 1 ? this._totalBet * this.mainPlayerStore.xMode : this._totalBet;
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
        const index = this.totalBetUnique.findIndex((detail) => +Object.keys(detail)[0] === totalBet);
        this.currentTotalBetIndex = index === -1 ? 0 : index;
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
