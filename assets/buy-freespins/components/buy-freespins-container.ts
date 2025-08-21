import { _decorator } from "cc";
import Observer from "observer";

import { MultipleNodeContainer } from "db://shared-components/shared/common-components/node-container/multiple-node-container";
import { BuyFsPopupEvent, IBuyFreespinsPopupEvent } from "../handler/buy-freespins-definitions";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsContainer extends MultipleNodeContainer {
    @render(BuyFreespinsStore, (store) => store.popupEvent, { fireImmediately: false })
    renderPopupEvent(popupEvent: IBuyFreespinsPopupEvent) {
        if (!popupEvent) {
            return;
        }

        if (popupEvent.event === BuyFsPopupEvent.SHOW) {
            this.showNode(popupEvent.name);

            return;
        }

        if (popupEvent.event === BuyFsPopupEvent.HIDE) {
            this.onClose();
        }
    }
}
