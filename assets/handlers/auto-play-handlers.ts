import gc from "@sg/game-client-base";
import { FSBPromotionUIHandler } from "db://shared-common-slot/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import {
    FreeSpinSource,
    FreeSpinsPromotionEvents,
    FSBPromotionUIStore,
} from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { FunctionUtils } from "db://shared-components/shared/utils";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import inversify from "inversify";
import mobx from "mobx";
import { BuyFreespinsHandler } from "../buy-freespins/handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { DialogName, SlotNotification } from "../cascading-slot-utils";
import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { BetControlStore } from "./../stores/bet-control-store";
import { BetControlHandlers } from "./bet-control-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { SlotBetHandler } from "./slot-bet-handler";

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
                (evt) => this.handleFsbEvent(evt)
            );

            mobx.reaction(
                () => this.fsbPromotionUIStore.event,
                (evt) => this.handleFsbEvent(evt)
            );

            mobx.reaction(
                () => this.buyFsStore.triggerAutoPlay,
                (triggerAutoPlay) => {
                    if (triggerAutoPlay) {
                        this.placeBet();
                    }
                }
            );

            mobx.reaction(
                () => this.autoPlayStore.triggerContinuousBet,
                (trigger) => {
                    if (trigger) {
                        this.handleFastBetContinue();
                    }
                }
            );
        }, 0);
    }

    handle() {}

    async handleAutoPlaceBet() {
        if (!this.isValidBet()) {
            this.handleError();
            return;
        }

        this.placeBet();
    }

    handleFsbEvent(evt: { event: string; data?: any }) {
        if (!evt) {
            return;
        }

        switch (evt.event) {
            case FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT:
            case FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP:
            case FreeSpinsPromotionEvents.OPEN_CLAIM_BONUS_NOTIFICATION:
            case FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION:
                this.cascadingUIHandler.triggerOpenDialog(evt.event);
                break;
            default:
                break;
        }

        if (evt.event === FreeSpinsPromotionEvents.BEGIN_USING_FBS) {
            this.cascadingUIStore.totalMultiplier = 0;
            return;
        }

        if (evt.event === FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME) {
            const { delayMs = 0, isPlaceBet = false } = evt.data ?? {};
            setTimeout(() => {
                this.fsbPromotionUIHandler.tryConsumeFSB();
                this.cascadingUIHandler.handleTriggerDuringFreeSpinBonus();
                if (isPlaceBet) {
                    this.placeBet();
                }
                this.fsbPromotionUIStore.removePendingUIEvent();
            }, delayMs);
        }
    }

    handleError() {
        this.cascadingUIHandler.handlePlaceBetFailed();
    }

    placeBet() {
        if (this.cascadingUIStore.isPlacingBet) {
            return;
        }
        this.autoPlayStore.triggerBet = {};
        this.cascadingUIStore.isPlacingBet = this.placeBetSilent();
    }

    handleFastBetContinue() {
        this.autoPlayStore.triggerContinuousBet = null;
        if (this.autoPlayStore.fastBetMode && this.autoPlayStore.roundsAutoplay > 0) {
            this.autoPlayStore.roundsAutoplay--;
            this.cascadingUIStore.isPlacingBet = false;
            this.placeBet();
        } else if (this.autoPlayStore.fastBetMode && this.autoPlayStore.roundsAutoplay <= 0) {
            this.stopFastBet();
            this.autoPlayStore.isOpenAutoplayPopup = true;
        }
    }

    startFastBet(rounds?: number) {
        const totalRounds = rounds || this.autoPlayStore.selectedRoundOnPopup;

        if (!this.isValidBet()) {
            this.handleError();
            return;
        }

        this.autoPlayStore.fastBetMode = true;
        this.autoPlayStore.roundsAutoplay = totalRounds;
        this.placeBet();
    }

    stopFastBet() {
        this.autoPlayStore.fastBetMode = false;
        this.autoPlayStore.roundsAutoplay = 0;
        this.autoPlayStore.triggerContinuousBet = null;
        this.cascadingUIStore.isPlacingBet = false;
        this.cascadingUIHandler.resetProcessingBet();
    }

    triggerFastBetContinue() {
        this.autoPlayStore.triggerContinuousBet = {};
    }

    placeBetSilent() {
        this.cascadingUIHandler.handleNewRound();
        const success = this.slotBetHandler.handle();
        if (success) {
            if (this.cascadingUIStore.freeSpinsTotal > 0) {
                this.cascadingUIHandler.updateFreespinCountMsgBottom(this.cascadingUIStore.freeSpinsTotal - 1);
            }
        }
        return success;
    }

    openAutoPlayPopup() {
        this.autoPlayStore.isOpenAutoplayPopup = true;
        this.autoPlayStore.selectedRoundOnPopup = this.autoPlayStore.roundsList[0];
    }

    clickAutoPlay() {
        this.cascadingUIHandler.triggerOpenDialog(DialogName.AUTO_SPIN);
        if (!this.autoPlayStore.isAutoplay && this.isValidBet()) {
            this.openAutoPlayPopup();
        } else {
            this.cancelAutoPlay();
            this.cascadingUIHandler.resetBottomMessageState();
        }
    }

    cancelAutoPlay() {
        this.autoPlayStore.isAutoplay = false;
        this.autoPlayStore.fastBetMode = false;
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
        if (this.autoPlayStore.fastBetMode) {
            this.cascadingUIStore.bottomMessageState = SlotNotification.AUTO_SPIN;
            this.autoPlayStore.roundsAutoplay = this.autoPlayStore.selectedRoundOnPopup;
            this.autoPlayStore.isAutoplay = true;
            this.autoPlayStore.isOpenAutoplayPopup = false;
            setTimeout(() => {
                this.startFastBet(this.autoPlayStore.selectedRoundOnPopup);
            }, DELAY_AUTO_SPIN);
            return;
        }

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

    async checkSpinNextRound() {
        this.cascadingUIStore.checkToSpinNext = true;
        this.autoPlayStore.triggerBet = null;
        this.cascadingUIStore.isPlacingBet = false;

        this.fsbPromotionUIStore.setActiveFreeSpin(FreeSpinSource.PROMOTION, this.cascadingUIStore.isUsedFSBPromotionBonus);
        this.buyFsHandler.showBuyFsCongratulation();
        this.fsbPromotionUIHandler.tryShowEndedPopup();

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
                    this.fsbPromotionUIHandler.openPromotionInfo();
                    this.fsbPromotionUIHandler.setShowFreeSpinMessage(false);
                    await FunctionUtils.waitUntil(() => this.fsbPromotionUIStore.isFSBInfoReady, 100, 10000).catch(() => {});
                }
                await this.awaitShowBuyFsResult();
                this.checkToSpinNextFSB();
            }
        }
    }

    private async awaitShowBuyFsResult() {
        if (this.fsbPromotionUIStore.canSpinNextFSB && this.buyFsStore.buyFsResult) {
            await AnimationUtils.delayTime(3);
        }
    }

    checkToSpinNextFSB() {
        if (this.fsbPromotionUIStore.canSpinNextFSB) {
            this.fsbPromotionUIHandler.tryConsumeFSB();
            this.cascadingUIHandler.handleTriggerDuringFreeSpinBonus();
            this.placeBet();
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
