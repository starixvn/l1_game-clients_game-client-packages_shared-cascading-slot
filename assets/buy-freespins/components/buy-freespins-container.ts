import { _decorator } from "cc";
import Observer from "observer";

import { MultipleNodeContainer } from "db://shared-components/shared/common-components/node-container/multiple-node-container";
import { BuyFsPopupEvent, IBuyFreespinsPopupEvent } from "../handler/buy-freespins-definitions";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsContainer extends MultipleNodeContainer {
    @render(BuyFreespinsStore, (store) => store.popupEvent, { fireImmediately: false })
    renderPopupEvent(popupEvent: IBuyFreespinsPopupEvent) {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONTAINER] renderPopupEvent called", {
            popupEvent,
            hasPopupEvent: !!popupEvent,
            eventType: popupEvent?.event,
            nodeName: popupEvent?.name,
            timestamp: new Date().toISOString()
        });

        if (!popupEvent) {
            cascadingSlotLogger.info("[BUY_FREESPINS_CONTAINER] No popup event, returning early", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (popupEvent.event === BuyFsPopupEvent.SHOW) {
            cascadingSlotLogger.info("[BUY_FREESPINS_CONTAINER] Showing popup node", {
                nodeName: popupEvent.name,
                timestamp: new Date().toISOString()
            });
            this.showNode(popupEvent.name);
            return;
        }

        if (popupEvent.event === BuyFsPopupEvent.HIDE) {
            cascadingSlotLogger.info("[BUY_FREESPINS_CONTAINER] Hiding popup (calling onClose)", {
                timestamp: new Date().toISOString()
            });
            this.onClose();
        }

        cascadingSlotLogger.info("[BUY_FREESPINS_CONTAINER] renderPopupEvent completed", {
            popupEvent,
            timestamp: new Date().toISOString()
        });
    }
}
