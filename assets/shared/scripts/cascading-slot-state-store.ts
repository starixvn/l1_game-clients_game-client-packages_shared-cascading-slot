import inversify from "inversify";
import mobx from "mobx";

export enum CascadingSlotState {
    None = 0,
    Start_Round,
    Spinning,
    Settled,
}

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotStateStore {
    _state: CascadingSlotState = CascadingSlotState.None;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    set state(state: CascadingSlotState) {
        this._state = state;
    }

    get state() {
        return this._state;
    }
}
