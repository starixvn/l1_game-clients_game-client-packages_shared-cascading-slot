import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";

import { cascadingSlotLogger } from "../cascading-slot-logger";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { DialogName, SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { AutoPlayStore } from "./auto-play-store";
import { FlashSpinStore } from "./flash-spin-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "./cascading-slot-tumbles-store";
import { HoldActionStore } from "./hold-action-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(FlashSpinStore) protected readonly flashSpinStore: FlashSpinStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    constructor() {

        mobx.makeAutoObservable(this);

    }

    checkToSpinNext = false;
    totalWin = 0;
    isHyperSpinActive = false;
    totalTumbleWin = 0;
    isActualWin = false;

    multiplier = 0;
    totalMultiplier = 0;
    get isShowTotalMultiplierJoinGame() {
        return this.totalMultiplier > 0;
    }

    isTurboModeUI = false;
    isTrialMode = false;

    _cascadingState = CascadingSlotState.NOT_READY_BET;

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
    isPlacingBet = false;

    triggerWinMultiplier = null;

    triggerDuringFreeSpinBonus = null;
    portraitshowTotalMultiplierView = false;
    get minPeekScatterCount() {

        if (!this.configsStore.gameConfigs) {
            return 1000; // default value
        }

        const freeSpinOdds = this.configsStore.gameConfigs.odds.freeSpins;

        const odds = this.isFreeSpins ? freeSpinOdds.additionalOdds : freeSpinOdds.initialOdds;

        const minOdd = odds.filter((odd) => odd.odds > 0).sort((a, b) => a.count - b.count)[0];
        const result = minOdd.count - 1;

        return result;
    }

    get isTurboMode() {
        const result = this.isTurboModeUI || (this.holdActionStore.isHolding && !this.isTrialMode);
        return result;
    }

    get isShowBigWin() {
        const result = this.haveBigWin || !this.isBigWinCompleted;
        return result;
    }

    get isShowHighlightScatters() {
        const result = this.isBigWinCompleted && this.haveFreeSpin;
        return result;
    }

    get isShowFreeSpinEffect() {
        const result = this.isHighlightScattersCompleted && this.haveFreeSpin;
        return result;
    }

    get cascadingState() {
        return this._cascadingState;
    }

    set cascadingState(state: string) {
        this._cascadingState = state;
    }

    get isSymbolPreviewVisible() {
        const result = this.dialogOpenEvent?.name === DialogName.PREVIEW_ODDS;
        return result;
    }

    get bottomMessageState() {
        return this._bottomMessageState;
    }

    set bottomMessageState(state: string) {
        this._bottomMessageState = state;
    }

    get isHideTopMessage() {
        const result = this.tumblesStore.tumbles.length > 1 || this.totalMultiplier > 0;
        return result;
    }

    get isFreeSpins() {
        const result = this.freeSpinsTotal > 0;
        return result;
    }

    get userBalance() {

        if (this.isTrialMode) {
            const trialBalance = this.configsStore.trialUser?.balance;

            // Provide a default trial balance if trial user balance is not available or is 0
            // This ensures stop-on-loss slider works in trial mode
            const defaultTrialBalance = 100000; // 100k default for trial mode
            const finalBalance = trialBalance || defaultTrialBalance;

            return finalBalance;
        }

        const mainBalance = this.mainPlayerStore.balance;

        return mainBalance;
    }

    get disabledTurboMode() {

        if (this.holdActionStore.isHolding) {
            return true;
        }

        const result = this.isTrialMode;
        return result;
    }

    get haveEventGame() {
        const result = this.haveBigWin || this.isShowFreeSpinEffect;
        return result;
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
        const result = (
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.cascadingState === CascadingSlotState.NOT_READY_BET ||
            this.holdActionStore.triggerAction
        );

        return result;
    }

    get disabledChangeTrialMode() {
        const result = (
            this.cascadingState === CascadingSlotState.SPINNING ||
            (this.isFreeSpins && !this.isTrialMode) ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        return result;
    }

    get disabledAutoPlay() {

        if (this.autoPlayStore.isAutoplay) {
            return false;
        }

        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.isTrialMode ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        return result;
    }

    get disabledFlashSpin() {

        if (this.flashSpinStore.isFlashSpin) {
            return false;
        }

        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.isTrialMode ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        return result;
    }

    get disabledHyperSpin() {
        // If hyper-spin is already active, don't disable it (allow it to continue during free spins)
        // This ensures an active hyper-spin batch continues even when free spins are triggered
        if (this.isHyperSpinActive) {
            return false; // Keep hyper-spin active even during free spins
        }

        // Otherwise, disable button when conditions are met (prevents starting new hyper-spin)
        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        return result;
    }

    get disabledOpenInputBet() {
        const result = this.isFreeSpins || this.cascadingState === CascadingSlotState.SPINNING || this.fsbPromotionUIStore.isFSBPromotionInProgress;

        return result;
    }

    get isUsedFSBPromotionBonus() {
        const result = this.freeSpinsTotal <= 0 && this.checkToSpinNext;

        return result;
    }

    fadeBGM = { value: true };

    get disableBuyFreespins() {
        const result = (
            this.isFreeSpins ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.autoPlayStore.isAutoplay ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        return result;
    }

    get showFreeSpinsSectionsPortrait() {
        const result = this.bottomMessageState === SlotNotification.FREESPINS;

        return result;
    }

    get isShowAutoSpinRoundPortrait() {
        const result = this.bottomMessageState === SlotNotification.AUTO_SPIN;

        return result;
    }

    get isAutoSpinOrFreeSpin() {
        const result = this.isFreeSpins || this.autoPlayStore.isAutoplay;

        return result;
    }

    dialogOpenEvent: { name: string } = null;
}
