import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
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

    handleHoldAction() {
        if (
            this.autoPlayStore.isAutoplay ||
            this.cascadingUIStore.freeSpinsTotal > 0 ||
            (this.autoPlayStore.triggerBet && !this.cascadingUIStore.isFreeSpinEffectCompleted)
        ) {
            this.holdActionStore.isPressingKey = false;
            this.holdActionStore.isTouching = false;
            return;
        }
        if (
            this.cascadingUIStore.cascadingState === CascadingSlotState.SETTLED ||
            this.cascadingUIStore.cascadingState === CascadingSlotState.START_ROUND
        ) {
            this.holdActionStore.isPressingKey = true;
            this.holdActionStore.isTouching = true;
        }
    }

    handleDropAction() {
        this.holdActionStore.isPressingKey = false;
        this.holdActionStore.isTouching = false;
    }

    updatePressingDownKeyTime(pressingDownKeyTime: number) {
        this.holdActionStore.isPressingDownKeyTime = pressingDownKeyTime;
        this.holdActionStore.isPressingUpKeyTime = 0;
        this.cascadingUIHandler.changeCascadingState(CascadingSlotState.HOLDING);
        if (this.holdActionStore.isPressingUpKeyTime === 0) {
            this.cascadingUIStore.isTurboMode = true;
        }
    }

    updatePressingUpKeyTime(pressingUpKeyTime: number) {
        this.holdActionStore.isPressingUpKeyTime = pressingUpKeyTime;

        const delta = pressingUpKeyTime - this.holdActionStore.isPressingDownKeyTime;
        if (delta < 1000) {
            this.cascadingUIStore.isTurboMode = false;
        } else {
            this.cascadingUIStore.isTurboMode = true;
        }
    }
}
