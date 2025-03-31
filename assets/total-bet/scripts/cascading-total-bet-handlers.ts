import inversify from "inversify";

import { BetControlStore } from "./bet-control-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalBetHandlers {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    showBetControl() {
        this.betControlStore.isOpenBetAmountPopup = true;
    }
}
