import gc from "@sg/game-client-base";
import inversify from "inversify";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingTotalMultiplierStore } from "./cascading-total-multiplier-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingTotalMultiplierStore) protected readonly totalMultiplierStore: CascadingTotalMultiplierStore;
    handle() {}

    handleTotalMultiplier(multiplier: number) {
        this.totalMultiplierStore.totalMultiplier += multiplier;
    }

    handleTotalMultiplierTimeline(show: boolean) {
        this.totalMultiplierStore.isShowTotalMultiplierTimeline = show;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingTotalMultiplierMsg.eventName,
            handle: this.handleTotalMultiplier,
        },
    ];
}
