import gc from "@sg/game-client-base";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import inversify from "inversify";
import mobx from "mobx";
import { BuyFreespinsHandler } from "../buy-freespins/handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification } from "../cascading-slot-utils";
import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { BetControlStore } from "./../stores/bet-control-store";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { SlotBetHandler } from "./slot-bet-handler";
import { FreeSpinsPromotionEvents, FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { FSBPromotionUIHandler } from "db://shared-common-slot/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { BetControlHandlers } from "./bet-control-handlers";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayHandler implements gc.Shared.IHandler<number> {
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(gc.Bet.BetStore) private readonly betStore: gc.Bet.BetStore;
    @inject(gc.Notices.NoticeStore) private readonly noticeStore: gc.Notices.NoticeStore;
    @inject(gc.Error.ErrorStore) private readonly errorStore: gc.Error.ErrorStore;
    @inject(gc.Rounds.RoundStore) private readonly roundStore: gc.Rounds.RoundStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(BuyFreespinsHandler) protected readonly buyFsHandler: BuyFreespinsHandler;
    @inject(FSBPromotionUIHandler) protected readonly fsbPromotionUIHandler: FSBPromotionUIHandler;
    @inject(BuyFreespinsStore) protected readonly buyFsStore: BuyFreespinsStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;

    constructor() {
        mobx.makeAutoObservable(this);
        setTimeout(() => {
            mobx.reaction(
                () => this.errorStore.apiError,
                (apiError) => {
                    if (apiError) {
                        this.handleError();
                    }
                }
            );
            mobx.reaction(
                () => this.betStore.lastReceivedBet,
                (lastReceivedBet) => {
                    if (lastReceivedBet?.value === -1) {
                        this.handleError();
                    }
                }
            );
            mobx.reaction(
                () => this.cascadingUIStore.triggerCancelAutoPlay,
                (triggerCancelAutoPlay) => {
                    if (triggerCancelAutoPlay) {
                        this.cancelAutoPlay();
                    }
                }
            );
            mobx.reaction(
                () => this.fsbPromotionUIStore.pendingUIEvent,
                (evt) => {
                    if (!evt || evt.event !== FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME) {
                        return;
                    }
                    const { delayMs = 0, isPlaceBet = false } = evt.data ?? {};
                    setTimeout(() => {
                        const { coinValue, betLevel } = this.fsbPromotionUIHandler.getDataBetControl();
                        this.betControlHandlers.init(coinValue, betLevel);
                        this.fsbPromotionUIHandler.tryConsumeFSB();
                        if (isPlaceBet) {
                            this.placeBet();
                        }
                        this.fsbPromotionUIStore.removePendingUIEvent();
                    }, delayMs);
                }
            );

            mobx.reaction(
                () => [this.fsbPromotionUIStore.isEligibleForNextFSBSpin, this.fsbPromotionUIStore.hasServerFinishPromotion] as const,
                ([eligible, finished]) => {
                    if (!eligible || finished) {
                        return;
                    }
                    const { coinValue, betLevel } = this.fsbPromotionUIHandler.getDataBetControl();
                    this.betControlHandlers.init(coinValue, betLevel);
                    this.fsbPromotionUIHandler.tryConsumeFSB();
                    this.placeBet();
                }
            );
            mobx.reaction(
                () => this.buyFsStore.triggerAutoPlay,
                (triggerAutoPlay) => {
                    if (triggerAutoPlay) {
                        this.placeBet();
                    }
                }
            );
        }, 0);
    }

    handle() { }

    async handleAutoPlaceBet() {
        if (!this.isValidBet()) {
            this.handleError();
            return;
        }

        this.placeBet();
    }

    handleError() {
        this.cascadingUIHandler.handlePlaceBetFailed();
    }

    placeBet() {
        this.autoPlayStore.triggerBet = {};
        this.placeBetSilent();
    }

    placeBetSilent() {
        this.cascadingUIHandler.handleNewRound();
        const success = this.slotBetHandler.handle();
        if (success) {
            if (this.cascadingUIStore.freeSpinsTotal > 0) {
                this.cascadingUIHandler.updateFreespinCountMsgBottom(this.cascadingUIStore.freeSpinsTotal - 1);
            }
        }
    }

    openAutoPlayPopup() {
        this.autoPlayStore.isOpenAutoplayPopup = true;
        this.autoPlayStore.selectedRoundOnPopup = this.autoPlayStore.roundsList[0];
    }

    clickAutoPlay() {
        if (!this.autoPlayStore.isAutoplay && this.isValidBet()) {
            this.openAutoPlayPopup();
        } else {
            this.cancelAutoPlay();
            this.cascadingUIHandler.resetBottomMessageState();
        }
    }

    cancelAutoPlay() {
        this.autoPlayStore.isAutoplay = false;
        this.updateAutoPlayRounds(0);
    }

    isValidBet() {
        if (!this.isEnoughMoney()) {
            this.showNotEnoughMoney();
            return false;
        }

        return true;
    }

    isEnoughMoney() {
        return this.betControlStore.totalBet <= this.betStore.availableBalance;
    }

    isAmountGreaterMinBet() {
        return this.betControlStore.totalBet >= this.roundStore.minBet;
    }

    private showNotEnoughMoney() {
        const { freebetEnabled } = this.betStore;
        const message = freebetEnabled
            ? gc.Translator.commonTranslate("not_enough_scoin")
            : gc.Translator.commonTranslate("not_enough_money");
        this.noticeStore.addWarning(message);
    }

    showMsgMinBet() {
        this.noticeStore.addWarning(gc.Translator.commonTranslate("message_min_bet_notice", { minBet: this.roundStore.minBet }));
    }

    closeAutoPlayPopup() {
        this.autoPlayStore.isOpenAutoplayPopup = false;
        this.cancelAutoPlay();
    }

    confirmRoundAndStart() {
        const DELAY_AUTO_SPIN = 500;
        this.cascadingUIStore.bottomMessageState = SlotNotification.AUTO_SPIN;
        this.autoPlayStore.roundsAutoplay = this.autoPlayStore.selectedRoundOnPopup;
        this.autoPlayStore.isOpenAutoplayPopup = false;
        setTimeout(() => {
            this.autoBetWhenConfirmStart();
        }, DELAY_AUTO_SPIN);
    }
    autoBetWhenConfirmStart() {
        if (this.isValidBet()) {
            this.autoPlayStore.isAutoplay = true;

            this.placeBet();
            this.updateAutoPlayRounds(this.autoPlayStore.roundsAutoplay - 1);
        } else {
            this.cancelAutoPlay();
        }
    }

    updateAutoPlayRounds(rounds: number) {
        this.autoPlayStore.roundsAutoplay = rounds;
    }

    checkFinishedAutoPlay() {
        return this.autoPlayStore.roundsAutoplay <= 0;
    }

    checkSpinNextRound() {
        this.buyFsHandler.showBuyFsCongratulation();

        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            this.placeBet();
        } else {
            this.betControlStore.resumeLastBet = false;
            this.cascadingUIStore.bottomMessageState = this.autoPlayStore.isAutoplay
                ? SlotNotification.AUTO_SPIN
                : SlotNotification.SETTLED;
            if (!this.fsbPromotionUIStore.isFSBPromotionInProgress) {
                this.cascadingUIHandler.changeCascadingState(CascadingSlotState.SETTLED);
            }
            if (this.autoPlayStore.isAutoplay) {
                this.updateAutoPlayRounds(this.autoPlayStore.roundsAutoplay - 1);
                this.handleAutoPlaceBet();
            } else {
                if (this.holdActionStore.isHolding) {
                    setTimeout(() => {
                        this.handleAutoPlaceBet();
                    }, 1000);
                }
                if (this.fsbPromotionUIStore.isShowFreeSpinMessage) {
                    this.fsbPromotionUIHandler.changeUIPendingEvent(FreeSpinsPromotionEvents.OPEN_PROMOTION_INFO);
                }
            }
        }
    }

    updateNoOfRounds(rounds: number) {
        this.autoPlayStore.selectedRoundOnPopup = rounds;
    }

    // Enable autoplay directly when free spin effect is completed
    checkAutoPlayWhenSettlementCompleted() {
        if (this.autoPlayStore.isAutoplay && this.autoPlayStore.roundsAutoplay === 0 && this.cascadingUIStore.freeSpinsTotal === 0) {
            this.autoPlayStore.isAutoplay = false;
            this.autoPlayStore.isOpenAutoplayPopup = true;
            this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;
            this.autoPlayStore.triggerBet = null;
        }
    }
}
