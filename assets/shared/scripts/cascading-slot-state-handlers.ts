import inversify from "inversify";

import { CascadingSlotState, CascadingSlotStateStore } from "./cascading-slot-state-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotStateHandlers {
    @inject(CascadingSlotStateStore) protected readonly gameState: CascadingSlotStateStore;

    handle(gameState: CascadingSlotState) {
        this.gameState.state = gameState;
    }
}
