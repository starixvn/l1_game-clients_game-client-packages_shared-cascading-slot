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
import { cascadingSlotLogger } from "../cascading-slot-logger";
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
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] AutoPlayHandler constructor called", {
            autoPlayStoreInjected: !!this.autoPlayStore,
            betStoreInjected: !!this.betStore,
            noticeStoreInjected: !!this.noticeStore,
            errorStoreInjected: !!this.errorStore,
            roundStoreInjected: !!this.roundStore,
            cascadingUIStoreInjected: !!this.cascadingUIStore,
            cascadingUIHandlerInjected: !!this.cascadingUIHandler,
            betControlStoreInjected: !!this.betControlStore,
            holdActionStoreInjected: !!this.holdActionStore,
            slotBetHandlerInjected: !!this.slotBetHandler,
            fsbPromotionUIStoreInjected: !!this.fsbPromotionUIStore,
            buyFsHandlerInjected: !!this.buyFsHandler,
            fsbPromotionUIHandlerInjected: !!this.fsbPromotionUIHandler,
            buyFsStoreInjected: !!this.buyFsStore,
            betControlHandlersInjected: !!this.betControlHandlers,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Setting up MobX reactions for auto-play", {
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Initializing MobX reactions", {
                timestamp: new Date().toISOString()
            });

            mobx.reaction(
                () => this.errorStore.apiError,
                (apiError) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] API error detected in reaction", {
                        apiError,
                        willHandleError: !!apiError,
                        timestamp: new Date().toISOString()
                    });
                    if (apiError) {
                        this.handleError();
                    }
                }
            );
            mobx.reaction(
                () => this.betStore.lastReceivedBet,
                (lastReceivedBet) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Last received bet changed in reaction", {
                        lastReceivedBet,
                        betValue: lastReceivedBet?.value,
                        willHandleError: lastReceivedBet?.value === -1,
                        timestamp: new Date().toISOString()
                    });
                    if (lastReceivedBet?.value === -1) {
                        this.handleError();
                    }
                }
            );
            mobx.reaction(
                () => this.cascadingUIStore.triggerCancelAutoPlay,
                (triggerCancelAutoPlay) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Trigger cancel auto-play detected in reaction", {
                        triggerCancelAutoPlay,
                        willCancelAutoPlay: !!triggerCancelAutoPlay,
                        timestamp: new Date().toISOString()
                    });
                    if (triggerCancelAutoPlay) {
                        this.cancelAutoPlay();
                    }
                }
            );
            mobx.reaction(
                () => this.fsbPromotionUIStore.pendingUIEvent,
                (evt) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] FSB pending UI event detected in reaction", {
                        pendingUIEvent: evt,
                        willHandleFsbEvent: !!evt,
                        timestamp: new Date().toISOString()
                    });
                    this.handleFsbEvent(evt);
                }
            );

            mobx.reaction(
                () => this.fsbPromotionUIStore.event,
                (evt) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] FSB event detected in reaction", {
                        fsbEvent: evt,
                        willHandleFsbEvent: !!evt,
                        timestamp: new Date().toISOString()
                    });
                    this.handleFsbEvent(evt);
                }
            );

            mobx.reaction(
                () => this.buyFsStore.triggerAutoPlay,
                (triggerAutoPlay) => {
                    cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Buy FS trigger auto-play detected in reaction", {
                        triggerAutoPlay,
                        willPlaceBet: !!triggerAutoPlay,
                        timestamp: new Date().toISOString()
                    });
                    if (triggerAutoPlay) {
                        this.placeBet();
                    }
                }
            );

            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] MobX reactions setup completed", {
                timestamp: new Date().toISOString()
            });
        }, 0);
    }

    handle() { }

    async handleAutoPlaceBet() {
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleAutoPlaceBet called", {
            timestamp: new Date().toISOString()
        });

        const isValid = this.isValidBet();
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Bet validation result", {
            isValid,
            willHandleError: !isValid,
            timestamp: new Date().toISOString()
        });

        if (!isValid) {
            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Invalid bet detected, handling error", {
                timestamp: new Date().toISOString()
            });
            this.handleError();
            return;
        }

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Bet is valid, placing bet", {
            timestamp: new Date().toISOString()
        });
        this.placeBet();

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleAutoPlaceBet completed", {
            timestamp: new Date().toISOString()
        });
    }

    handleFsbEvent(evt: { event: string; data?: any }) {
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleFsbEvent called", {
            fsbEvent: evt,
            eventType: evt?.event,
            eventData: evt?.data,
            timestamp: new Date().toISOString()
        });

        if (!evt) {
            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] No FSB event provided, returning", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Processing FSB event", {
            event: evt.event,
            timestamp: new Date().toISOString()
        });

        switch (evt.event) {
            case FreeSpinsPromotionEvents.EFFECT_UNBOX_GIFT:
            case FreeSpinsPromotionEvents.OPEN_PROMOTION_ENDED_POPUP:
            case FreeSpinsPromotionEvents.OPEN_CLAIM_BONUS_NOTIFICATION:
            case FreeSpinsPromotionEvents.OPEN_FREE_SPINS_PROMOTION:
                cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Opening dialog for FSB event", {
                    event: evt.event,
                    dialogName: evt.event,
                    timestamp: new Date().toISOString()
                });
                this.cascadingUIHandler.triggerOpenDialog(evt.event);
                break;
            default:
                cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] FSB event not handled by switch statement", {
                    event: evt.event,
                    timestamp: new Date().toISOString()
                });
                break;
        }

        if (evt.event === FreeSpinsPromotionEvents.BEGIN_USING_FBS) {
            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Beginning FSB usage, resetting total multiplier", {
                previousTotalMultiplier: this.cascadingUIStore.totalMultiplier,
                timestamp: new Date().toISOString()
            });
            this.cascadingUIStore.totalMultiplier = 0;
            return;
        }

        if (evt.event === FreeSpinsPromotionEvents.SPIN_ON_FSB_PROMOTION_FIRST_TIME) {
            const { delayMs = 0, isPlaceBet = false } = evt.data ?? {};
            cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Processing first time FSB promotion spin", {
                delayMs,
                isPlaceBet,
                eventData: evt.data,
                willSetTimeout: delayMs > 0,
                timestamp: new Date().toISOString()
            });

            setTimeout(() => {
                cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] Executing delayed FSB promotion actions", {
                    delayMs,
                    willTryConsumeFSB: true,
                    willHandleTriggerDuringFreeSpinBonus: true,
                    willPlaceBet: isPlaceBet,
                    willRemovePendingUIEvent: true,
                    timestamp: new Date().toISOString()
                });

                this.fsbPromotionUIHandler.tryConsumeFSB();
                this.cascadingUIHandler.handleTriggerDuringFreeSpinBonus();
                if (isPlaceBet) {
                    this.placeBet();
                }
                this.fsbPromotionUIStore.removePendingUIEvent();
            }, delayMs);
        }

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleFsbEvent completed", {
            processedEvent: evt.event,
            timestamp: new Date().toISOString()
        });
    }

    handleError() {
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleError called - Handling auto-play error", {
            willCallHandlePlaceBetFailed: true,
            timestamp: new Date().toISOString()
        });

        this.cascadingUIHandler.handlePlaceBetFailed();

        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] handleError completed", {
            timestamp: new Date().toISOString()
        });
    }

    placeBet() {
        cascadingSlotLogger.info("[AUTO_PLAY_HANDLER] placeBet called", {
            isPlacingBet: this.cascadingUIStore.isPlacingBet,
            isAutoplay: this.autoPlayStore.isAutoplay,
            roundsAutoplay: this.autoPlayStore.roundsAutoplay,
            timestamp: new Date().toISOString()
        });

        if (this.cascadingUIStore.isPlacingBet) {
            return;
        }
        this.autoPlayStore.triggerBet = {};
        this.cascadingUIStore.isPlacingBet = this.placeBetSilent();
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
        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.openAutoPlayPopup() - Opening auto play popup", {
            previousState: this.autoPlayStore.isOpenAutoplayPopup,
            roundsList: this.autoPlayStore.roundsList,
            timestamp: new Date().toISOString()
        });

        this.autoPlayStore.isOpenAutoplayPopup = true;
        this.autoPlayStore.selectedRoundOnPopup = this.autoPlayStore.roundsList[0];

        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.openAutoPlayPopup() - Popup opened successfully", {
            isOpenAutoplayPopup: this.autoPlayStore.isOpenAutoplayPopup,
            selectedRoundOnPopup: this.autoPlayStore.selectedRoundOnPopup
        });
    }

    clickAutoPlay() {
        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.clickAutoPlay() - Handler called", {
            isAutoplay: this.autoPlayStore.isAutoplay,
            timestamp: new Date().toISOString()
        });

        this.cascadingUIHandler.triggerOpenDialog(DialogName.AUTO_SPIN);
        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.clickAutoPlay() - Triggered open dialog for AUTO_SPIN");

        if (!this.autoPlayStore.isAutoplay && this.isValidBet()) {
            cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.clickAutoPlay() - Conditions met: not autoplay and valid bet, opening popup");
            this.openAutoPlayPopup();
        } else {
            cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayHandler.clickAutoPlay() - Conditions not met, cancelling autoplay", {
                isAutoplay: this.autoPlayStore.isAutoplay,
                isValidBet: this.isValidBet(),
                isEnoughMoney: this.isEnoughMoney(),
                totalBet: this.betControlStore.totalBet,
                availableBalance: this.betStore.availableBalance
            });
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

    async checkSpinNextRound() {
        this.cascadingUIStore.checkToSpinNext = true;
        this.autoPlayStore.triggerBet = null;
        this.cascadingUIStore.isPlacingBet = false;

        this.fsbPromotionUIStore.setActiveFreeSpin(FreeSpinSource.PROMOTION, this.cascadingUIStore.isUsedFSBPromotionBonus);
        this.buyFsHandler.showBuyFsCongratulation();
        this.fsbPromotionUIHandler.tryShowEndedPopup();

        if (this.cascadingUIStore.freeSpinsTotal > 0) {
            // If hyper-spin is active, log that we're handling free spins within hyper-spin batch
            // IMPORTANT: Free spin rounds do NOT count toward hyper-spin round count
            if (this.cascadingUIStore.isHyperSpinActive) {
                cascadingSlotLogger.info("[AUTO_PLAY] Free spins active during hyper-spin - placing bet for free spin round", {
                    freeSpinsTotal: this.cascadingUIStore.freeSpinsTotal,
                    isHyperSpinActive: this.cascadingUIStore.isHyperSpinActive,
                    note: "Free spin rounds will NOT decrement hyper-spin round count - hyper-spin continues automatically",
                    timestamp: new Date().toISOString()
                });
            }
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
                    await FunctionUtils.waitUntil(() => this.fsbPromotionUIStore.isFSBInfoReady, 100, 10000).catch(() => { });
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
