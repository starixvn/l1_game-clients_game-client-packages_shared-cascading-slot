import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";
import { CascadingUIStore } from "./cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IHandler<void> {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    handle() {}

    handleTotalWinTumble(tumbleWin: number) {
        this.uiStore.totalTumbleWin += tumbleWin;
    }

    handleTotalWin(win: number) {
        this.uiStore.totalWin += win;
    }

    handleTotalMultiplier(multiplier: number) {
        this.uiStore.totalMultiplier += multiplier;
    }

    handleFreeSpins(freeSpins: number) {
        this.uiStore.freeSpins += freeSpins;
    }

    handleMultiplier(multiplier: number) {
        this.uiStore.multiplier = multiplier;
    }

    handleNewRound() {
        this.tumblesStore.tumbles = [];
    }
}
