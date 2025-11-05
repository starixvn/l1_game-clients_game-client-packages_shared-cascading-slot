import Observer from "observer";
import { CascadingSlotGame } from "./cascading-slot-game";
import { cascadingSlotLogger } from "./cascading-slot-logger";

import { _decorator } from "cc";
import { CascadingUIHandler } from "./handlers/cascading-ui-handler";

const { ccclass, property } = _decorator;

const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingSlotGame extends CascadingSlotGame {
    protected async showTotalMultiplierView(totalMultiplier: number, isFreeSpin: boolean, winMultiplier: boolean) {
        cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] showTotalMultiplierView called", {
            totalMultiplier,
            isFreeSpin,
            winMultiplier,
            willShowTotalMultiplier: totalMultiplier > 0,
            timestamp: new Date().toISOString()
        });

        if (totalMultiplier > 0) {
            cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] Calling showTotalMutiplier for portrait view", {
                totalMultiplier,
                timestamp: new Date().toISOString()
            });
            this.showTotalMutiplier();
        }

        cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] Calling parent showTotalMultiplierView", {
            totalMultiplier,
            isFreeSpin,
            winMultiplier,
            timestamp: new Date().toISOString()
        });

        await super.showTotalMultiplierView(totalMultiplier, isFreeSpin, winMultiplier);

        cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] showTotalMultiplierView completed", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handle) => handle.handleShowTotalMultiplierView(true))
    showTotalMutiplier() {
        cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] showTotalMutiplier called", {
            timestamp: new Date().toISOString()
        });

        // Portrait-specific total multiplier display logic
        cascadingSlotLogger.info("[PORTRAIT_CASCADING_SLOT_GAME] showTotalMutiplier completed", {
            timestamp: new Date().toISOString()
        });
    }
}
