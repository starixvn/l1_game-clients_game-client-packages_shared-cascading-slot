import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }
    // totalTumbleWin = { totalWin: 0, isAnimated: false };
    totalWin: number = 0;
    totalTumbleWin = 0;
    multiplier = 0;
    totalMultiplier = 0;

    freeSpinsCount = 0;
    freeSpinsJoinGame = {};

    isTurboMode = false;
    isTrialMode = false;

    _cascadingState = CascadingSlotState.NONE;
    _isSymbolPreviewVisible = false;

    _bottomMessageState = SlotNotification.BEFORE_SPIN;

    haveBigWin = false;
    bigWinAmount = 0;
    isBigWinCompleted = false;

    highlightScatters = false;
    isHighlightScattersCompleted = false;
    haveFreeSpin = false;
    isFreeSpinEffectCompleted = false;
    spinButtonState = SpinButtonState.IDLE;

    get isShowBigWin() {
        return this.haveBigWin || !this.isBigWinCompleted;
    }

    get isShowHighlightScatters() {
        return this.isBigWinCompleted && this.haveFreeSpin;
    }

    get isShowFreeSpinEffect() {
        console.log("isShowFreeSpinEffect", this.isHighlightScattersCompleted && this.haveFreeSpin);
        return this.isHighlightScattersCompleted && this.haveFreeSpin;
    }

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

    get isHideTopMessage() {
        return this.tumblesStore.tumbles.length > 1 || this.totalMultiplier > 0;
    }

    get isFreeSpins() {
        return this.freeSpinsCount > 0;
    }
}
