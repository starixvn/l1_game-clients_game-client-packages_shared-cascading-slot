import gc from "@sg/game-client-base";
import inversify from "inversify";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesHandlers implements gc.Shared.IHandler<void> {
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;

    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] constructor called", {
            hasTumblesStore: !!this.tumblesStore,
            timestamp: new Date().toISOString()
        });
    }

    handle() {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] handle called", {
            timestamp: new Date().toISOString()
        });
    }

    handleTumbles(tumbles: any) {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] handleTumbles called", {
            tumbles,
            hasTumbles: !!tumbles,
            tumblesLength: tumbles?.length,
            hasTumblesStore: !!this.tumblesStore,
            willSetTumbles: true,
            timestamp: new Date().toISOString()
        });

        this.tumblesStore.tumbles = tumbles;

        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] tumbles set in store", {
            tumblesSet: true,
            timestamp: new Date().toISOString()
        });
    }

    setTumble(tumble: any) {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] setTumble called", {
            tumble,
            hasTumble: !!tumble,
            hasTumblesStore: !!this.tumblesStore,
            willSetTumble: true,
            timestamp: new Date().toISOString()
        });

        this.tumblesStore.tumble = tumble;

        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_HANDLERS] tumble set in store", {
            tumbleSet: true,
            timestamp: new Date().toISOString()
        });
    }
}
