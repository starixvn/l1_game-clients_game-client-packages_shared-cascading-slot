import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingFreespinsStore } from "./cascading-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingFreespinsHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingFreespinsStore) protected readonly freespinStore: CascadingFreespinsStore;
    handle() {}

    handleFreespins(freespins: GameServiceMessageCascading.CascadingFreeSpinsMsg) {
        const { total, betLevel, coinValue, betMultiplier } = freespins;
        this.freespinStore.totalFreeSpins = total;
        this.freespinStore.betLevel = betLevel;
        this.freespinStore.coinValue = coinValue;
        this.freespinStore.betMultiplier = betMultiplier;
    }

    setTotalFreeSpins(total: number) {
        this.freespinStore.totalFreeSpins = total;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
            handle: this.handleFreespins,
        },
    ];
}
