import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { CascadingSlotSettlementStore } from "../settlements/cascading-slot-settlement-store";
import { CascadingTotalMultiplierStore } from "../total-multiplier/scripts/cascading-total-multiplier-store";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";
import { CascadingUIStore } from "./cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IHandler<void> {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(CascadingTotalMultiplierStore) protected readonly totalMultiplierStore: CascadingTotalMultiplierStore;
    handle() {}

    handleTotalWinTumble(tumbleWin: number) {
        this.uiStore.totalTumbleWin += tumbleWin;
    }

    handleTotalWin(win: number) {
        this.uiStore.totalWin += win;
    }

    handleFreeSpins(freeSpins: number) {
        this.uiStore.freeSpins += freeSpins;
    }

    handleMultiplier(multiplier: number) {
        this.uiStore.multiplier += multiplier;
    }

    handleNewRound() {
        this.tumblesStore.tumbles = [];
        this.uiStore.totalTumbleWin = 0;
        this.settlementStore.finishData = null;
        this.changeCascadingState(CascadingSlotState.START_ROUND);
    }

    changeCascadingState(state: string) {
        this.uiStore.cascadingState = state;
    }

    handleTurboMode(isTurboMode: boolean) {
        this.uiStore.isTurboMode = isTurboMode;
    }
}
