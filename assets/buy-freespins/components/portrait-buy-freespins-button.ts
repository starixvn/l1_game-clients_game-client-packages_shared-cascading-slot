import { _decorator } from "cc";
import Observer from "observer";

import { BuyFreespinsStore } from "../handler/buy-freespins-store";
import { BuyFreespinsButton } from "./buy-freespins-button";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class PortraitBuyFreespinsButton extends BuyFreespinsButton {
    @render(BuyFreespinsStore, (store) => store.isActive, { fireImmediately: false })
    visibilityBuyFreespinsBtn(isActive: boolean) {
        this.node.active = !isActive;
    }
}
