import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";

const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    @inject(CascadingSlotConfigsStore) protected readonly gameConfigStore: CascadingSlotConfigsStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    private _isOpenBetAmountPopup = false;
    private _betLevel = 0;
    private _coinValue = 0;
    private _totalBet = 0;
    private _currentBetLevelIndex = 0;
    private _currentCoinIndex = 0;
    private _currentTotalBetIndex = 0;

    set isOpenBetAmountPopup(status: boolean) {
        this._isOpenBetAmountPopup = status;
    }

    get isOpenBetAmountPopup() {
        return this._isOpenBetAmountPopup;
    }

    set betLevel(level: number) {
        this._betLevel = level;
    }

    get betLevel() {
        return this._betLevel;
    }

    set coinValue(value: number) {
        this._coinValue = value;
    }

    get coinValue() {
        return this._coinValue;
    }

    set totalBet(bet: number) {
        this._totalBet = bet;
    }

    get totalBet() {
        return this._totalBet;
    }

    set currentBetLevelIndex(index: number) {
        this._currentBetLevelIndex = index;
    }

    get currentBetLevelIndex() {
        return this._currentBetLevelIndex;
    }

    set currentCoinIndex(index: number) {
        this._currentCoinIndex = index;
    }

    get currentCoinIndex() {
        return this._currentCoinIndex;
    }

    set currentTotalBetIndex(index: number) {
        this._currentTotalBetIndex = index;
    }

    get currentTotalBetIndex() {
        return this._currentTotalBetIndex;
    }
}
