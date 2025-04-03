import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification } from "../cascading-slot-utils";
import { CascadingTotalMultiplierStore } from "../total-multiplier/scripts";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingTotalMultiplierStore) protected readonly totalMultiplierStore: CascadingTotalMultiplierStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }
    // totalTumbleWin = { totalWin: 0, isAnimated: false };
    totalWin: number = 0;
    totalTumbleWin = 0;
    multiplier = 0;

    freeSpinsCount = 0;
    freeSpinsJoinGame = {};

    isTurboMode = false;

    _cascadingState = CascadingSlotState.NONE;
    _isSymbolPreviewVisible = false;

    _bottomMessageState = SlotNotification.BEFORE_SPIN;

    get cascadingState() {
        return this._cascadingState;
    }

    set cascadingState(state: string) {
        this._cascadingState = state;
    }

    get isSymbolPreviewVisible() {
        return this._isSymbolPreviewVisible;
    }

    set isSymbolPreviewVisible(value: boolean) {
        this._isSymbolPreviewVisible = value;
    }

    get bottomMessageState() {
        return this._bottomMessageState;
    }

    set bottomMessageState(state: string) {
        this._bottomMessageState = state;
    }

    get isShowTopMessage() {
        return this.tumblesStore.tumbles.length === 0 && this.totalMultiplierStore.totalMultiplier === 0;
    }
}
