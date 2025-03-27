import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class TurboModeStore {
    _isEnableTurboMode = false;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set isEnableTurboMode(status: boolean) {
        this._isEnableTurboMode = status;
    }

    get isEnableTurboMode() {
        return this._isEnableTurboMode;
    }
}
