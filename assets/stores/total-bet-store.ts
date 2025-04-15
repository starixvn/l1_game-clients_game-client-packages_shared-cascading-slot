import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class TotalBetStore {
    _buttonStatus = true;
    _totalBet = 0;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set buttonStatus(status: boolean) {
        this._buttonStatus = status;
    }

    get buttonStatus() {
        return this._buttonStatus;
    }

    set totalBet(bet: number) {
        this._totalBet = bet;
    }

    get totalBet() {
        return this._totalBet;
    }
}
