import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayPopupStore {
    _isShow = false;
    _autoSpinCount = 0;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set isShow(status: boolean) {
        this._isShow = status;
    }

    get isShow() {
        return this._isShow;
    }

    set autoSpinCount(count: number) {
        this._autoSpinCount = count;
    }

    get autoSpinCount() {
        return this._autoSpinCount;
    }
}
