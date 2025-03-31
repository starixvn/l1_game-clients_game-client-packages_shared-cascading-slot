import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotState } from "../cascading-slot-state";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    // totalTumbleWin = { totalWin: 0, isAnimated: false };
    totalWin: number = 0;
    totalTumbleWin = 0;
    multiplier = 0;

    freeSpins = 0;

    isTurboMode = false;

    _cascadingState = CascadingSlotState.NONE;

    get cascadingState() {
        return this._cascadingState;
    }

    set cascadingState(state: string) {
        this._cascadingState = state;
    }
}
