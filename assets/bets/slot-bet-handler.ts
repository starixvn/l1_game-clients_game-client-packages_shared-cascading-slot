import gc from "@sg/game-client-base";
import inversify from "inversify";

import { BetControlStore } from "../total-bet/scripts/bet-control-store";
import { SlotBetStore } from "./slot-bet-store";

const { injectable, inject } = inversify;

@injectable()
export class SlotBetHandler extends gc.Bet.BetHandler {
    @inject(SlotBetStore) protected readonly slotBetStore: SlotBetStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    handle() {
        const betData = this.slotBetData();
        this.handleBetData(betData);
    }
    slotBetData() {
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.coinValue,
            betLevel: this.betControlStore.betLevel,
            totalBet: this.betControlStore.totalBet,
            clientSentTime: new Date(),
            freeSpin: false,
        };
    }

    isValidBet() {
        return true;
    }
}
