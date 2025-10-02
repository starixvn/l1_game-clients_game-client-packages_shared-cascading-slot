import { _decorator } from "cc";
import Observer from "observer";

import { BuyFsPopupEvent, BuyFsPopupName, IBuyFreespinsPopupEvent } from "../handler/buy-freespins-definitions";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";
import { BuyFreespinsButton } from "./buy-freespins-button";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class PortraitBuyFreespinsButton extends BuyFreespinsButton {
    @render(BuyFreespinsStore, (store) => store.popupEvent, { fireImmediately: false })
    visibilityBuyFreespins(popupEvent: IBuyFreespinsPopupEvent) {
        if (!popupEvent) {
            return;
        }
        if (popupEvent.event === BuyFsPopupEvent.HIDE) {
            if (popupEvent.name === BuyFsPopupName.BUY_CONFIRMATION) {
                this.node.active = false;
            }
            if (popupEvent.name === BuyFsPopupName.BUY_FS_CONGRATULATION) {
                this.node.active = true;
            }
        }
    }
}
