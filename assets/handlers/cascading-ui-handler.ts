import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    handle() {}

    handleTotalWin({ win, isActualWin = false }) {
        this.uiStore.isActualWin = isActualWin;
        if (!this.uiStore.isActualWin) {
            this.uiStore.totalWin += win;
        } else {
            this.uiStore.totalWin = win;
        }
    }

    handleFreeSpinsTotal(freeSpinsTotal: number) {
        this.uiStore.freeSpinsTotal = freeSpinsTotal;
    }

    handleFreeSpinsByRound(freeSpins: number) {
        this.uiStore.freeSpinsByRound = freeSpins;
    }

    handleMultiplier(multiplier: number) {
        this.uiStore.multiplier += multiplier;
    }

    handleNewRound() {
        this.tumblesStore.tumbles = [];
        this.uiStore.totalTumbleWin = 0;
        this.settlementStore.finishData = null;
        this.uiStore.isFreeSpinEffectCompleted = false;
        this.uiStore.isBigWinCompleted = false;
        this.uiStore.isHighlightScattersCompleted = false;
        this.uiStore.multiplier = 0;
        if (!this.uiStore.isFreeSpins) {
            this.uiStore.totalMultiplier = 0;
        }
        this.uiStore.totalWin = 0;
        //this.changeCascadingState(CascadingSlotState.START_ROUND);
    }

    changeCascadingState(state: string) {
        this.uiStore.cascadingState = state;
    }

    handleTurboMode(isTurboMode: boolean) {
        this.uiStore.isTurboMode = isTurboMode;
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
        if (freespins.total === 0 || !freespins || freespins.length <= 0) {
            return;
        }
        // const { total, betLevel, coinValue, betMultiplier } = freespins;
        // this.uiStore.freeSpinsJoinGame = { total, betLevel, coinValue, betMultiplier };
        // this.betControlStore.currentBetLevelIndex = findIndex(betLevel, this.configsStore.gameConfigs.betLevels);
        // this.betControlStore.currentCoinIndex = findIndex(coinValue, this.configsStore.gameConfigs.coinValues);
        // this.betControlStore.totalBet = betLevel * coinValue * betMultiplier;
    }

    handleTotalMultiplier(totalMultiplier: number) {
        this.uiStore.totalMultiplier = totalMultiplier;
    }

    handleHaveBigWin(bigwin: boolean) {
        const { freeSpins, bigWin } = this.settlementStore.finishData;
        if (freeSpins <= 0 && !bigWin) {
            this.handleFreeSpinEffectCompleted(true);
            return;
        }
        this.uiStore.haveBigWin = bigwin;
        !bigwin && (this.uiStore.isBigWinCompleted = true);
    }

    handleBigWinAmount(win: number) {
        this.uiStore.bigWinAmount = win;
    }

    handleBigWinCompleted(completed: boolean) {
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
        } else {
            if (this.uiStore.cascadingState !== CascadingSlotState.START_ROUND) {
                this.uiStore.bottomMessageState = SlotNotification.SETTLED;
            } else {
                this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN;
            }
        }
        this.uiStore.roundId = 0;
        this.handleNewRound();
    }

    updateSpinButtonState(state: string) {
        this.uiStore.spinButtonState = state;
    }

    updateFreespinCountMsgBottom(count: number) {
        this.uiStore.freespinCountMsgBottom = count;
    }

    updateConnectedTrialService(connected: boolean) {
        this.uiStore.isConnectedTrialService = connected;
    }

    handleChangeUserBalance(change: boolean) {
        this.uiStore.changeUserBalance = change;
    }

    triggerClickTurboModeToggle() {
        this.uiStore.isClickTurboModeToggle = true;
        setTimeout(() => {
            this.uiStore.isClickTurboModeToggle = false;
        }, 100);
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
