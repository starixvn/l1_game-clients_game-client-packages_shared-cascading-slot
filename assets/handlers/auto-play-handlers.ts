import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "./../stores/bet-control-store";

import { TrackingObject } from "../cascading-slot-base-configs";
import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, trackEventButton } from "../cascading-slot-utils";
import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { SlotBetHandler } from "./slot-bet-handler";

const { injectable, inject } = inversify;
const { Shared } = gc;
const { utils } = Shared;

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
        trackEventButton(TrackingObject.AutoSpin, gc.Shared.utils.TrackingAction.Click);
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
        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            this.placeBet();
        } else {
            this.betControlStore.resumeLastBet = false;
            this.cascadingUIStore.bottomMessageState = this.autoPlayStore.isAutoplay
                ? SlotNotification.AUTO_SPIN
                : SlotNotification.SETTLED;
            this.cascadingUIHandler.changeCascadingState(CascadingSlotState.SETTLED);
            if (this.autoPlayStore.isAutoplay) {
                this.updateAutoPlayRounds(this.autoPlayStore.roundsAutoplay - 1);
                this.handleAutoPlaceBet();
            } else {
                if (this.holdActionStore.isHolding) {
                    setTimeout(() => {
                        this.handleAutoPlaceBet();
                    }, 1000);
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
