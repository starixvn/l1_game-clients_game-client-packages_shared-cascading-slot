import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotConfigsStore } from "../../game-configs/cascading-slot-configs-store";

const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    @inject(CascadingSlotConfigsStore) protected readonly gameConfigStore: CascadingSlotConfigsStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    private _isShow = false;
    private _betLevel = 0;
    private _coinValue = 0;
    private _totalBet = 0;
    private _currentBetLevelIndex = 0;

    set isShow(status: boolean) {
        this._isShow = status;
    }

    get isShow() {
        return this._isShow;
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
}
