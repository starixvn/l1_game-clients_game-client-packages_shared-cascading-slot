import Observer from "observer";
import { CascadingSlotGame } from "./cascading-slot-game";

import { _decorator } from "cc";
import { CascadingUIHandler } from "./handlers/cascading-ui-handler";

const { ccclass, property } = _decorator;

const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingSlotGame extends CascadingSlotGame {
    protected async showTotalMultiplierView(totalMultiplier: number, isFreeSpin: boolean, winMultiplier: boolean) {
        if (totalMultiplier > 0) {
            this.showTotalMutiplier();
        }
        super.showTotalMultiplierView(totalMultiplier, isFreeSpin, winMultiplier);
    }

    @handle(CascadingUIHandler, (handle) => handle.handleShowTotalMultiplierView(true))
    showTotalMutiplier() {}
}
