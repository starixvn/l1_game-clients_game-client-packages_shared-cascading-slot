import inversify from "inversify";

import { BetControlStore } from "./bet-control-store";

const { injectable, inject } = inversify;

@injectable()
export class BetControlHandlers {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    hideBetControl() {
        this.betControlStore.isShow = false;
    }

    updateTotalBet(totalBet: number) {
        this.betControlStore.totalBet = totalBet;
    }
}
