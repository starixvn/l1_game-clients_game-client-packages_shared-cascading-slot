import { _decorator } from "cc";
import Observer from "observer";

import { BuyFreespinsStore } from "../handler/buy-freespins-store";
import { BuyFreespinsButton } from "./buy-freespins-button";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class PortraitBuyFreespinsButton extends BuyFreespinsButton {
    @render(BuyFreespinsStore, (store) => store.isActive, { fireImmediately: false })
    visibilityBuyFreespinsBtn(isActive: boolean) {
        cascadingSlotLogger.info("[PORTRAIT_BUY_FREESPINS_BUTTON] visibilityBuyFreespinsBtn called", {
            isActive,
            previousNodeActive: this.node.active,
            willSetNodeActive: !isActive,
            timestamp: new Date().toISOString()
        });

        this.node.active = !isActive;

        cascadingSlotLogger.info("[PORTRAIT_BUY_FREESPINS_BUTTON] visibilityBuyFreespinsBtn completed", {
            isActive,
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
    }
}
