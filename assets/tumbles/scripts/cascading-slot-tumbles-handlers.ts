import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";
import { CascadingSlotTumblesStore } from "./cascading-slot-tumbles-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesHandlers implements gc.Shared.IHandler<void> {
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    handle() {}

    handleTumbles(tumbles: any) {
        this.tumblesStore.tumbles = tumbles;
    }
}
