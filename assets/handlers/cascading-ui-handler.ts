import gc from "@sg/game-client-base";
import inversify from "inversify";

import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import mobx from "mobx";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet, DialogName, resourcesCache, SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { BetControlHandlers } from "./bet-control-handlers";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.UserSettings.UserSettingHandlers) protected readonly userSettingHandlers: gc.UserSettings.UserSettingHandlers;
    @inject(gc.GameUserSettings.GameUserSettingHandler)
    protected readonly gameUserSettingHandler: gc.GameUserSettings.GameUserSettingHandler;
    @inject(BuyFreespinsStore) protected readonly buyFsStore: BuyFreespinsStore;

    constructor() {
        setTimeout(() => {
            mobx.reaction(
                () => this.betControlStore.coinValue,
                () => {
                    this.saveGameUserSettings();
                }
            );
            mobx.reaction(
                () => this.betControlStore.betLevel,
                () => {
                    this.saveGameUserSettings();
                }
            );
        }, 0);
    }

    handle() { }

    handleTotalWin({ win, isActualWin = false }) {
        this.uiStore.isActualWin = isActualWin;
        if (!this.uiStore.isActualWin) {
            this.uiStore.totalWin += win;
        } else {
            this.uiStore.totalWin = win;
        }
    }

    handleTotalWinTumble(tumberWin: number) {
        this.tumblesStore.isShowTumbleWinFrame = true
        this.handleTotalWin({ win: tumberWin, isActualWin: false });
    }

    handleFreeSpinsTotal(freeSpinsTotal: number) {
        const previousFreeSpinsTotal = this.uiStore.freeSpinsTotal;
        this.uiStore.freeSpinsTotal = freeSpinsTotal;

        this.handleFreeSpinActivation(previousFreeSpinsTotal, freeSpinsTotal);
        this.handleFreeSpinDeactivation(freeSpinsTotal);
    }

    private handleFreeSpinActivation(previousFreeSpinsTotal: number, freeSpinsTotal: number) {
        const conditionMet = previousFreeSpinsTotal === 0 && freeSpinsTotal > 0;

        if (!conditionMet) {
            return;
        }

        this.updateFreespinCountMsgBottom(freeSpinsTotal);
        this.handleTriggerDuringFreeSpinBonus();
        this.uiStore.isFreeSpinEffectCompleted = true;
    }

    private handleFreeSpinDeactivation(freeSpinsTotal: number) {
        const shouldTriggerFreeSpinBonusEnd = freeSpinsTotal === 0 && !this.fsbPromotionUIStore.isFSBPromotionInProgress;

        if (shouldTriggerFreeSpinBonusEnd) {
            this.handleTriggerDuringFreeSpinBonus(null);
        }
    }

    handleFreeSpinsByRound(freeSpins: number) {
        this.uiStore.freeSpinsByRound = freeSpins;
    }

    handleMultiplier(multiplier: number) {
        this.uiStore.multiplier += multiplier;
    }

    handleOnGameHide() {
        this.resetBottomMessageState();
        this.uiStore.triggerCancelAutoPlay = {};
    }

    handlePlaceBetFailed(clearFreeSpins = false) {
        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.uiStore.triggerCancelAutoPlay = {};
        this.uiStore.isPlacingBet = false;

        const isMessageForFreeSpins = this.uiStore.bottomMessageState === SlotNotification.FREESPINS;

        if (!isMessageForFreeSpins || clearFreeSpins) {
            this.resetBottomMessageState();
        }
        if (clearFreeSpins) {
            this.clearFreeSpins();
        }
        if (this.uiStore.isFreeSpins) {
            this.updateFreespinCountMsgBottom(this.uiStore.freeSpinsTotal);
        }

    }

    resetProcessingBet() {
        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.resetBottomMessageState();
    }

    resetBottomMessageState() {
        const newMessageState = this.uiStore.isTrialMode ? SlotNotification.BEFORE_SPIN_TRIAL : SlotNotification.BEFORE_SPIN;
        this.uiStore.bottomMessageState = newMessageState;
    }

    handleNewRound() {
        // Reset spin control flags
        this.uiStore.checkToSpinNext = false;

        // Reset tumble data
        this.tumblesStore.tumbles = [];
        this.tumblesStore.isShowTumbleWinFrame = false;
        this.uiStore.totalTumbleWin = 0;

        // Reset settlement data
        this.settlementStore.finishData = null;

        // Reset completion flags - but preserve free spin effects during hyper spin
        // Don't reset isFreeSpinEffectCompleted during hyper spin to prevent race conditions
        if (!this.uiStore.isHyperSpinActive) {
            this.uiStore.isFreeSpinEffectCompleted = false;
        }
        this.uiStore.isBigWinCompleted = false;
        this.uiStore.isHighlightScattersCompleted = false;
        this.uiStore.showReachMaxWin = false;

        // Reset multiplier and win data
        this.uiStore.multiplier = 0;
        const shouldResetTotalMultiplier = !this.uiStore.isFreeSpins && !this.fsbPromotionUIStore.isFSBPromotionInProgress;

        if (shouldResetTotalMultiplier) {
            this.uiStore.totalMultiplier = 0;
            this.uiStore.portraitshowTotalMultiplierView = false;
        }

        // Reset win and effect data
        this.uiStore.totalWin = 0;
        this.uiStore.activePeekEffect = false;

        // Don't close HYPER_SPIN dialog during hyper-spin
        if (!this.uiStore.isHyperSpinActive) {
            this.triggerOpenDialog(DialogName.DUMMY_DIALOG);
        }
    }

    changeCascadingState(state: string) {
        this.uiStore.cascadingState = state;
        this.fsbPromotionUIStore.isSpinningFSB = state === CascadingSlotState.SPINNING;
    }

    handleTurboModeUI(isTurboModeUI: boolean) {
        this.uiStore.isTurboModeUI = isTurboModeUI;
    }

    handleBottomMessage(state: string) {
        if (
            this.uiStore.bottomMessageState === SlotNotification.FREESPINS ||
            this.uiStore.bottomMessageState === SlotNotification.AUTO_SPIN
        ) {
            return;
        }

        this.uiStore.bottomMessageState = state;
    }

    handleFreespinsJoinGame(freespins: any) {
        // Warn when free spins are received from service join game message

        if (!freespins || freespins.total === 0 || freespins.length === 0) {

            if (this.betControlStore.lastSetting) {
                const { betLevel, coinValue } = this.betControlStore.lastSetting;
                this.betControlHandlers.init(coinValue, betLevel);
            } else {
                this.betControlHandlers.init();
            }
            return;
        }

        const { total, betLevel, coinValue, betMultiplier } = freespins;

        this.handleFreeSpinsTotal(total);
        this.updateFreespinCountMsgBottom(total);
        this.handleTriggerDuringFreeSpinBonus();

        this.betControlHandlers.init(coinValue, betLevel);
        this.betControlHandlers.setTotalBet(calculateTotalBet(betLevel, coinValue, betMultiplier));

        if (freespins.promotionId) {
            this.fsbPromotionUIStore.resumedFSBPromotion = true;
        }

        if (freespins?.buyFreeSpins) {
            this.buyFsStore.isActive = true;
        }

        if (total > 0) {
            this.buyFsStore.triggerAutoPlay = {};
        }
    }

    protected clearFreeSpins() {
        this.uiStore.freeSpinsTotal = 0;
        this.uiStore.freeSpinsByRound = 0;

    }

    handleTotalMultiplier(totalMultiplier: number) {
        if (totalMultiplier > 0) {
            this.uiStore.portraitshowTotalMultiplierView = true;
        }

        this.uiStore.totalMultiplier = totalMultiplier;
    }

    setPeekEffect(show: boolean) {
        this.uiStore.activePeekEffect = show;
    }

    handleHaveBigWin(bigwin: boolean) {
        if (!this.settlementStore.finishData) {
            return;
        }

        const isPeekEffectSuccess = this.settlementStore?.finishData?.freeSpins > 0 && this.uiStore.activePeekEffect;

        if (bigwin && !isPeekEffectSuccess) {
            this.uiStore.haveBigWin = bigwin;
        } else {
            this.uiStore.isBigWinCompleted = true;
        }
    }

    handleBigWinAmount(win: number) {
        this.uiStore.bigWinAmount = win;
    }

    handleBigWinCompleted(completed: boolean) {
        if (!this.settlementStore.finishData) {
            return;
        }

        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        const { freeSpins } = this.settlementStore.finishData;

        this.uiStore.haveBigWin = false;
        this.uiStore.isBigWinCompleted = completed;

        if (freeSpins <= 0) {
            this.handleFreeSpinEffectCompleted(true);
        }
    }

    handleHaveFreeSpin(haveFreeSpin: boolean) {
        this.uiStore.haveFreeSpin = haveFreeSpin;
    }

    handleFreeSpinEffectCompleted(completed: boolean) {
        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        this.uiStore.haveFreeSpin = false;
        this.uiStore.isFreeSpinEffectCompleted = completed;
    }

    handleHighlightScattersCompleted(completed: boolean) {
        this.uiStore.isHighlightScattersCompleted = completed;
    }

    handleChangeMode(isTrialMode: boolean) {
        this.uiStore.isTrialMode = isTrialMode;

        if (isTrialMode) {
            this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN_TRIAL;
            this.uiStore.isTurboModeUI = false;
        } else {
            const newBottomMessageState = this.uiStore.cascadingState !== CascadingSlotState.READY_BET
                ? SlotNotification.SETTLED
                : SlotNotification.BEFORE_SPIN;
            this.uiStore.bottomMessageState = newBottomMessageState;
        }

        this.uiStore.roundId = 0;
        this.handleNewRound();
        this.betControlStore.needClearLastSetting = true;
        this.saveGameUserSettings();
    }

    saveGameUserSettings() {
        this.gameUserSettingHandler.saveTempStorage();
    }

    updateFreespinCountMsgBottom(count: number) {
        this.uiStore.bottomMessageState = SlotNotification.FREESPINS;
        this.uiStore.freespinCountMsgBottom = count;
    }

    updateConnectedTrialService(connected: boolean) {
        this.uiStore.isConnectedTrialService = connected;
    }

    handleChangeUserBalance(change: boolean) {
        this.uiStore.changeUserBalance = change;
    }

    setReachMaxWin(show: boolean) {
        this.uiStore.showReachMaxWin = show;
    }

    handleTriggerWinMultiplier() {
        this.uiStore.triggerWinMultiplier = {};
    }

    handleTriggerDuringFreeSpinBonus(trigger = {}) {
        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            return;
        }

        this.uiStore.triggerDuringFreeSpinBonus = trigger;
    }

    handleFadeBGM(fadeBGM: boolean) {
        this.uiStore.fadeBGM = { value: fadeBGM };
    }

    handleShowTotalMultiplierView(move: boolean) {
        this.uiStore.portraitshowTotalMultiplierView = move;
    }

    triggerOpenDialog(name: string) {
        this.uiStore.dialogOpenEvent = { name };
    }


    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
            handle: this.handleFreespinsJoinGame,
        },

        {
            name: GameServiceMessageCascading.CascadingTotalMultiplierMsg.eventName,
            handle: this.handleTotalMultiplier,
        },
    ];
}
