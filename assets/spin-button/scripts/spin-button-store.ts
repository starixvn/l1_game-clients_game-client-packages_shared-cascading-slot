import inversify from "inversify";
import mobx from "mobx";

export enum SpinButtonState {
    Normal = 0,
    AutoSpin,
    FreeSpin,
    ResumeWithFreeSpin,
}

const { injectable, inject } = inversify;

@injectable()
export class SpinButtonStore {
    _buttonStatus = true;
    _state = SpinButtonState.Normal;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set buttonStatus(status: boolean) {
        this._buttonStatus = status;
    }

    get buttonStatus() {
        return this._buttonStatus;
    }

    set state(state: SpinButtonState) {
        this._state = state;
    }

    get state() {
        return this._state;
    }
}
