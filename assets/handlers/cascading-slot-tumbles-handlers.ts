import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesHandlers implements gc.Shared.IHandler<void> {
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    handle() {}

    handleTumbles(tumbles: any) {
        this.tumblesStore.tumbles = tumbles;
    }

    setTumble(tumble: any) {
        this.tumblesStore.tumble = tumble;
    }
}
