import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingUIStore } from "./cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IHandler<void> {
    @inject(CascadingUIStore) protected readonly tumblesStore: CascadingUIStore;
    handle() {}

    handleTotalWinTumble(tumbleWin: number) {
        this.tumblesStore.totalTumbleWin += tumbleWin;
    }

    handleTotalWin(win: number) {
        this.tumblesStore.totalWin += win;
    }

    handleTotalMultiplier(multiplier: number) {
        this.tumblesStore.totalMultiplier += multiplier;
    }

    handleFreeSpins(freeSpins: number) {
        this.tumblesStore.freeSpins += freeSpins;
    }
}
