import inversify from "inversify";

import { BetControlStore } from "./bet-control-store";

const { injectable, inject } = inversify;

@injectable()
export class BetControlHandlers {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    updateStatusBetAmountPopup(status = false) {
        this.betControlStore.isOpenBetAmountPopup = false;
    }

    updateTotalBet(totalBet: number) {
        this.betControlStore.totalBet = totalBet;
    }

    updateCurrentBetLevelIndex(index: number) {
        this.betControlStore.currentBetLevelIndex = index;
    }

    updateCurrentCoinIndex(index: number) {
        this.betControlStore.currentCoinIndex = index;
    }

    updateCurrentTotalBetIndex(index: number) {
        this.betControlStore.currentTotalBetIndex = index;
    }
}
