import { _decorator } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";

import { FlashSpinStore } from "../../stores/flash-spin-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class FlashSpinPopupContainer extends NodeContainer {
    @render(FlashSpinStore, (store) => store.isOpenFlashSpinPopup)
    renderOpenPopup(isOpenFlashSpinPopup: boolean) {
        cascadingSlotLogger.info(`[FlashSpinPopupContainer] renderOpenPopup called with isOpenFlashSpinPopup: ${isOpenFlashSpinPopup}`);

        if (!isOpenFlashSpinPopup) {
            const nodes = this.node.children;
            cascadingSlotLogger.info(`[FlashSpinPopupContainer] Closing popup, found ${nodes.length} child nodes`);
            if (nodes.length > 0) {
                nodes[0].getComponent(Dialog)?.hide();
                cascadingSlotLogger.info(`[FlashSpinPopupContainer] Hiding dialog on first child node`);
            }
            return;
        }

        cascadingSlotLogger.info(`[FlashSpinPopupContainer] Opening popup, creating node`);
        this.createNode();
    }
}


