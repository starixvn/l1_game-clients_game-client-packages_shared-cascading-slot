import gc from "@sg/game-client-base";
import inversify from "inversify";

import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import mobx from "mobx";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet, SlotNotification } from "../cascading-slot-utils";
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

    handle() {}

    handleTotalWin({ win, isActualWin = false }) {
        this.uiStore.isActualWin = isActualWin;
        if (!this.uiStore.isActualWin) {
            this.uiStore.totalWin += win;
        } else {
            this.uiStore.totalWin = win;
        }
    }

    handleTotalWinTumble(tumberWin: number) {
        this.tumblesStore.isShowTumbleWinFrame = true;
        this.handleTotalWin({ win: tumberWin, isActualWin: false });
    }

    handleFreeSpinsTotal(freeSpinsTotal: number) {
        this.uiStore.freeSpinsTotal = freeSpinsTotal;
        if (freeSpinsTotal === 0) {
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

    handlePlaceBetFailed() {
        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.resetBottomMessageState();
        this.uiStore.triggerCancelAutoPlay = {};
        this.clearFreeSpins();
    }

    resetProcessingBet() {
        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.resetBottomMessageState();
    }

    resetBottomMessageState() {
        this.uiStore.bottomMessageState = this.uiStore.isTrialMode ? SlotNotification.BEFORE_SPIN_TRIAL : SlotNotification.BEFORE_SPIN;
    }

    handleNewRound() {
        this.tumblesStore.tumbles = [];
        this.tumblesStore.isShowTumbleWinFrame = false;
        this.uiStore.totalTumbleWin = 0;
        this.settlementStore.finishData = null;
        this.uiStore.isFreeSpinEffectCompleted = false;
        this.uiStore.isBigWinCompleted = false;
        this.uiStore.isHighlightScattersCompleted = false;
        this.uiStore.showReachMaxWin = false;
        this.uiStore.multiplier = 0;
        if (!this.uiStore.isFreeSpins && !this.fsbPromotionUIStore.isFSBPromotionInProgress) {
            this.uiStore.totalMultiplier = 0;
        }
        this.uiStore.totalWin = 0;
        this.uiStore.activePeekEffect = false;
        this.handleSymbolPreviewVisiblity(false);
    }

    changeCascadingState(state: string) {
        this.uiStore.cascadingState = state;
    }

    handleTurboModeUI(isTurboModeUI: boolean) {
        this.uiStore.isTurboModeUI = isTurboModeUI;
    }

    handleSymbolPreviewVisiblity(value: boolean) {
        this.uiStore.isSymbolPreviewVisible = value;
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
        this.uiStore.totalMultiplier = totalMultiplier;
    }

    setPeekEffect(show: boolean) {
        this.uiStore.activePeekEffect = show;
    }

    handleHaveBigWin(bigwin: boolean) {
        if (!this.settlementStore.finishData) {
            return;
        }
        const { bigWin, freeSpins } = this.settlementStore.finishData;

        const isPeekEffectSuccess = freeSpins > 0 && this.uiStore.activePeekEffect;
        if (bigWin && !isPeekEffectSuccess) {
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
            if (this.uiStore.cascadingState !== CascadingSlotState.READY_BET) {
                this.uiStore.bottomMessageState = SlotNotification.SETTLED;
            } else {
                this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN;
            }
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
        this.uiStore.triggerDuringFreeSpinBonus = trigger;
    }

    handleFadeBGM(fadeBGM: boolean) {
        this.uiStore.fadeBGM = { value: fadeBGM };
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
