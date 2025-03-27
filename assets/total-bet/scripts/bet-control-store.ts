import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class BetControlStore {
    _isShow = false;
    _betLevel = 0;
    _coinValue = 0;
    _totalBet = 0;

    constructor() {
        mobx.makeAutoObservable(this);
    }

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
}
