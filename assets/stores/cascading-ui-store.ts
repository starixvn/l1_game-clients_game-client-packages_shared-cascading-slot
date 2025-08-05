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

    totalWin = 0;
    totalTumbleWin = 0;
    isActualWin = false;

    multiplier = 0;
    totalMultiplier = 0;
    isShowTotalMultiplierJoinGame = false;

    isTurboModeUI = false;
    isTrialMode = false;

    _cascadingState = CascadingSlotState.NOT_READY_BET;
    _isSymbolPreviewVisible = false;

    _bottomMessageState = SlotNotification.BEFORE_SPIN;
    _spinButtonState = SpinButtonState.IDLE;

    activePeekEffect = false;
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
    triggerCancelAutoPlay = null;

    triggerWinMultiplier = null;

    get minPeekScatterCount() {
        if (!this.configsStore.gameConfigs) {
            return 1000; // default value
        }
        const freeSpinOdds = this.configsStore.gameConfigs.odds.freeSpins;

        const odds = this.isFreeSpins ? freeSpinOdds.additionalOdds : freeSpinOdds.initialOdds;
        const minOdd = odds.filter((odd) => odd.odds > 0).sort((a, b) => a.count - b.count)[0];
        return minOdd.count - 1;
    }

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
        if (this.cascadingState === CascadingSlotState.SPINNING) {
            if (this.haveBigWin || this.haveFreeSpin || this.tumblesStore.tumbles.length > 1) {
                return SpinButtonState.WIN_TUMBLE_OR_EVENT;
            }
            return SpinButtonState.SPINNING;
        } else {
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

    get disabledChangeTrialMode() {
        return this.cascadingState === CascadingSlotState.SPINNING || (this.isFreeSpins && !this.isTrialMode);
    }

    get disabledAutoPlay() {
        if (this.autoPlayStore.isAutoplay) {
            return false;
        }
        return (
            this.holdActionStore.isHolding || this.isFreeSpins || this.isTrialMode || this.cascadingState === CascadingSlotState.SPINNING
        );
    }

    get disabledOpenInputBet() {
        return this.isFreeSpins || this.cascadingState === CascadingSlotState.SPINNING;
    }

    get isUsedFSBPromotionBonus() {
        return this.freeSpinsByRound <= 0 && this.isFreeSpinEffectCompleted;
    }
}
