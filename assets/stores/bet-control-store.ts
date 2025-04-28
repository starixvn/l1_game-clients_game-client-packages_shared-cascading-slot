import inversify from "inversify";
import mobx from "mobx";
import { calculateTotalBet } from "../cascading-slot-utils";
import { CascadingUIStore } from "./cascading-ui-store";
const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    constructor() {
        mobx.makeAutoObservable(this);
        mobx.reaction(
            () => this.currentCoinIndex,
            () => {
                console.log(" on changed currentCoinIndex", this.currentCoinIndex);
                this.onChangeCoinAndBetLevel();
            }
        );
        mobx.reaction(
            () => this.currentBetLevelIndex,
            () => {
                console.log(" on changed currentBetLevelIndex", this.currentBetLevelIndex);
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
            return this._totalBet;
        }

        if (this.totalBetUnique.length === 0) {
            return 0;
        }
        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        return +total;
    }

    currentBetLevelIndex = 0;
    currentCoinIndex = 0;
    currentTotalBetIndex = 0;

    get disabledChangeBet() {
        return this.cascadingUIStore.isFreeSpins;
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
        console.log("onChangeCoinAndBetLevel", this.currentTotalBetIndex);
    }
}
