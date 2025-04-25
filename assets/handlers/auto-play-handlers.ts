import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "./../stores/bet-control-store";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
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
    constructor() {
        mobx.makeAutoObservable(this);
        setTimeout(() => {
            mobx.reaction(
                () => this.errorStore.apiError,
                (apiError) => {
                    if (apiError) {
                        this.cancelAutoPlay();
                    }
                }
            );
        }, 0);
    }

    handle() {}

    async handleAutoPlaceBet() {
        if (!this.isValidBet()) {
            return;
        }

        this.placeBet();
    }

    placeBet() {
        this.autoPlayStore.triggerBet = {};
        this.cascadingUIHandler.handleNewRound();
        this.slotBetHandler.handle();
    }

    placeBetSilent() {
        this.cascadingUIHandler.handleNewRound();
        this.slotBetHandler.handle();
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
            this.cascadingUIHandler.changeCascadingState(CascadingSlotState.SPINNING);
            this.cascadingUIStore.bottomMessageState = SlotNotification.FREESPINS;
            this.cascadingUIHandler.updateSpinButtonState(SpinButtonState.SPINNING);
            this.cascadingUIHandler.updateFreespinCountMsgBottom(this.cascadingUIStore.freeSpinsTotal - 1);
            this.cascadingUIHandler.handleNewRound();
            this.placeBet();
        } else {
            this.cascadingUIStore.bottomMessageState = SlotNotification.SETTLED;
            this.cascadingUIHandler.changeCascadingState(CascadingSlotState.SETTLED);
            this.cascadingUIHandler.updateSpinButtonState(SpinButtonState.IDLE);
            if (this.autoPlayStore.isAutoplay) {
                this.cascadingUIStore.bottomMessageState = SlotNotification.AUTO_SPIN;
                this.cascadingUIHandler.handleNewRound();
                this.handleAutoPlaceBet();
                this.updateAutoPlayRounds(this.autoPlayStore.roundsAutoplay - 1);
            } else {
                if (this.holdActionStore.isPressingKey) {
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
            return;
        }

        if (!this.holdActionStore.isPressingKey && this.cascadingUIStore.isFreeSpinEffectCompleted) {
            this.cascadingUIStore.cascadingState = CascadingSlotState.SETTLED;
        }
    }
}
