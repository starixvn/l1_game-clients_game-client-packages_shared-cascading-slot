import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class HoldActionStore {
    constructor() {
        cascadingSlotLogger.info("[HOLD_ACTION_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[HOLD_ACTION_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                enabled: this.enabled,
                triggerAction: this.triggerAction,
                isHolding: this.isHolding
            },
            timestamp: new Date().toISOString()
        });
    }

    enabled = true;
    triggerAction = null;
    isHolding = false;
}
