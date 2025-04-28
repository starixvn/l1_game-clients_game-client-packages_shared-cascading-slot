import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    constructor() {
        mobx.makeAutoObservable(this);
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
        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        return this.resumeLastBet ? this._totalBet : +total;
    }

    currentBetLevelIndex = 0;
    currentCoinIndex = 0;
    currentTotalBetIndex = 0;

    get interactableBetLevel() {
        return {
            increase: this.currentBetLevelIndex < this.betLevels.length - 1,
            decrease: this.currentBetLevelIndex > 0,
        };
    }

    get interactableCoinValue() {
        return {
            increase: this.currentCoinIndex < this.coinValues.length - 1,
            decrease: this.currentCoinIndex > 0,
        };
    }

    get interactableTotalBet() {
        return {
            increase: this.currentTotalBetIndex < this.totalBetUnique.length - 1,
            decrease: this.currentTotalBetIndex > 0,
        };
    }
}
