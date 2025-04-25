import gc from "@sg/game-client-base";
import inversify from "inversify";

import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class CascadingHoldActionHandlers implements gc.Shared.IHandler<number> {
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    handle() {}

    callTriggerAction() {
        if (!this.holdActionStore.triggerAction) {
            //TODO: bug trigger contiuously fast => not wait spin finish
            this.holdActionStore.triggerAction = {};
        }
    }

    clearTriggerAction() {
        this.holdActionStore.triggerAction = null;
    }
}
