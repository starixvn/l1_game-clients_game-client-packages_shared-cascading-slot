import gc from "@sg/game-client-base";
import inversify from "inversify";

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotConfigsHandlers implements gc.Shared.IHandler<GameServiceMessageCascading.CascadingSlotConfigsMsg> {
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;
    name = GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName;

    handle(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        this.configStore.gameConfigs = gameConfigs;
    }
}
