import gc from "@sg/game-client-base";
import inversify from "inversify";

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotConfigsHandlers implements gc.Shared.IMultipleHandlers {
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;

    handleConfigs(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        this.configStore.gameConfigs = gameConfigs;
    }

    handleTrialUser(trialUser: GameServiceMessageCascading.CascadingTrialUserMsg) {
        this.configStore.trialUser = trialUser;
    }

    handleGameInfo(gameInfo: GameServiceMessageCascading.GameInfoMsg) {
        this.configStore.gameInfo = gameInfo;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName,
            handle: this.handleConfigs,
        },
        {
            name: GameServiceMessageCascading.CascadingTrialUserMsg.eventName,
            handle: this.handleTrialUser,
        },
        {
            name: GameServiceMessageCascading.GameInfoMsg.eventName,
            handle: this.handleGameInfo,
        },
    ];
}
