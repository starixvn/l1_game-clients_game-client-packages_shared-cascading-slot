import gc from "@sg/game-client-base";
import inversify from "inversify";
import { SlotBetStore } from "./slot-bet-store";
const { injectable, inject } = inversify;

@injectable()
export class SlotBetHandler extends gc.Bet.BetHandler {
    @inject(SlotBetStore) protected readonly slotBetStore: SlotBetStore;
    handle() {
        const betData = this.slotBetData();
        this.handleBetData(betData);
    }
    slotBetData() {
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: 0.5,
            betLevel: 1,
            totalBet: 10,
            clientSentTime: new Date(),
            freeSpin: false,
        };
    }

    isValidBet() {
        return true;
    }
}
