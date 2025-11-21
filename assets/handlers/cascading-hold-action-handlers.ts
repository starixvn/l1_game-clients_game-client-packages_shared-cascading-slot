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
    private timeoutHolding: NodeJS.Timeout;
    private readonly HOLDING_THRESHOLD = 1000;
    handle() { }
    callTriggerAction() {
        if (!this.holdActionStore.enabled) {
            return;
        }
        if (!this.holdActionStore.triggerAction && !this.autoPlayStore.isAutoplay) {
            const canBet =
                this.cascadingUIStore.cascadingState === CascadingSlotState.READY_BET ||
                this.cascadingUIStore.cascadingState === CascadingSlotState.SETTLED;
            if (canBet && !this.cascadingUIStore.disabledSpinButton) {
                this.holdActionStore.triggerAction = {};
                if (!this.cascadingUIStore.isTrialMode) {
                    this.timeoutHolding = setTimeout(() => {
                        this.holdActionStore.isHolding = true;
                    }, this.HOLDING_THRESHOLD);
                }
            }
        }
    }

    clearTriggerAction() {
        this.holdActionStore.triggerAction = null;
        this.holdActionStore.isHolding = false;
        this.timeoutHolding && clearTimeout(this.timeoutHolding);
    }
}
