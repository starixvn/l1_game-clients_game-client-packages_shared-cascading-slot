import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { AutoPlayStore } from "./auto-play-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "./cascading-slot-tumbles-store";
import { HoldActionStore } from "./hold-action-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    totalWin: number = 0;
    totalTumbleWin = 0;
    isActualWin = false;

    multiplier = 0;
    totalMultiplier = 0;

    isTurboModeUI = false;
    isTrialMode = false;

    _cascadingState = CascadingSlotState.NOT_READY_BET;
    _isSymbolPreviewVisible = false;

    _bottomMessageState = SlotNotification.BEFORE_SPIN;
    _spinButtonState = SpinButtonState.IDLE;

    haveBigWin = false;
    bigWinAmount = 0;
    isBigWinCompleted = false;

    highlightScatters = false;
    isHighlightScattersCompleted = false;

    freeSpinsTotal = 0;
    freeSpinsByRound = 0;
    freeSpinsJoinGame = {};
    haveFreeSpin = false;
    isFreeSpinEffectCompleted = false;

    freespinCountMsgBottom = 0;

    isConnectedTrialService = false;
    changeUserBalance = true;

    showReachMaxWin = false;

    roundId = 0;

    get isTurboMode() {
        return this.isTurboModeUI || (this.holdActionStore.isHolding && !this.isTrialMode);
    }

    get isShowBigWin() {
        return this.haveBigWin || !this.isBigWinCompleted;
    }

    get isShowHighlightScatters() {
        return this.isBigWinCompleted && this.haveFreeSpin;
    }

    get isShowFreeSpinEffect() {
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
        return this.freeSpinsTotal > 0;
    }

    get userBalance() {
        if (!this.changeUserBalance) {
            return;
        }
        if (this.isTrialMode) {
            return this.configsStore.trialUser?.balance;
        }
        return this.mainPlayerStore.balance;
    }

    get disabledTurboMode() {
        if (this.holdActionStore.isHolding) {
            return true;
        }
        return this.isTrialMode;
    }

    get haveEventGame() {
        return this.haveBigWin || this.isShowFreeSpinEffect;
    }

    get spinButtonState() {
        switch (this.cascadingState) {
            case CascadingSlotState.SPINNING:
                return SpinButtonState.SPINNING;
            default:
                return SpinButtonState.IDLE;
        }
    }

    get disabledSpinButton() {
        return (
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.cascadingState === CascadingSlotState.NOT_READY_BET ||
            this.holdActionStore.triggerAction
        );
    }

    get disabledAutoPlay() {
        if (this.autoPlayStore.isAutoplay) {
            return false;
        }
        if (this.holdActionStore.isHolding) {
            return true;
        }
        return this.isTrialMode || this.cascadingState === CascadingSlotState.SPINNING;
    }

    get disabledOpenInputBet() {
        return this.cascadingState === CascadingSlotState.SPINNING;
    }
}
