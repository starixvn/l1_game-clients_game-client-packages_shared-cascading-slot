import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingFreespinsStore } from "./cascading-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingFreespinsStore) protected readonly freespinStore: CascadingFreespinsStore;
    handle() {}

    handleFreespins(freespins: any) {
        const { total, betLevel, coinValue } = freespins;
        this.freespinStore.totalFreeSpins = total;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
            handle: this.handleFreespins,
        },
    ];
}
