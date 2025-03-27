import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayStore {
    _buttonStatus = true;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set buttonStatus(status: boolean) {
        this._buttonStatus = status;
    }

    get buttonStatus() {
        return this._buttonStatus;
    }
}
