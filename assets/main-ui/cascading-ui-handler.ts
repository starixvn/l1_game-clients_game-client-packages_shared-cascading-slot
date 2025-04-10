import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotSettlementStore } from "../settlements/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";
import { CascadingUIStore } from "./cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;

    handle() {}

    handleTotalWinTumble(tumbleWin: number) {
        this.uiStore.totalTumbleWin += tumbleWin;
    }

    handleTotalWin(win: number) {
        this.uiStore.totalWin += win;
    }

    handleFreeSpins(freeSpins: number) {
        if (freeSpins > 0) {
            this.uiStore.bottomMessageState = SlotNotification.FREESPINS;
        }
        this.uiStore.freeSpinsCount = freeSpins;
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
        if (!this.uiStore.isFreeSpins) {
            this.uiStore.multiplier = 0;
            this.uiStore.totalMultiplier = 0;
        }
        this.uiStore.totalWin = 0;
        this.changeCascadingState(CascadingSlotState.START_ROUND);
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

    handleFreespins(freespins: GameServiceMessageCascading.CascadingFreeSpinsMsg) {
        const { total, betLevel, coinValue, betMultiplier } = freespins;
        this.uiStore.freeSpinsJoinGame = { total, betLevel, coinValue, betMultiplier };
    }

    handleTotalMultiplier(totalMultiplier: number) {
        this.uiStore.totalMultiplier = totalMultiplier;
    }

    handleHaveBigWin(bigwin: boolean) {
        this.uiStore.haveBigWin = bigwin;
        !bigwin && (this.uiStore.isBigWinCompleted = true);
    }

    handleBigWinAmount(win: number) {
        this.uiStore.bigWinAmount = win;
    }

    handleBigWinCompleted(completed: boolean) {
        this.uiStore.haveBigWin = false;
        this.uiStore.isBigWinCompleted = completed;
    }

    handleHaveFreeSpin(haveFreeSpin: boolean) {
        this.uiStore.haveFreeSpin = haveFreeSpin;
        !haveFreeSpin && (this.uiStore.isFreeSpinEffectCompleted = true);
    }

    handleFreeSpinEffectCompleted(completed: boolean) {
        this.uiStore.haveFreeSpin = false;
        this.uiStore.isFreeSpinEffectCompleted = completed;
    }

    handleHighlightScattersCompleted(completed: boolean) {
        this.uiStore.isHighlightScattersCompleted = completed;
        console.log("handleHighlightScattersCompleted", completed);
    }

    handleChangeMode(isTrialMode: boolean) {
        this.uiStore.isTrialMode = isTrialMode;
    }

    updateSpinButtonState(state: string) {
        this.uiStore.spinButtonState = state;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
            handle: this.handleFreespins,
        },

        {
            name: GameServiceMessageCascading.CascadingTotalMultiplierMsg.eventName,
            handle: this.handleTotalMultiplier,
        },
    ];
}
