import { _decorator } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";

import { FlashSpinStore } from "../../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class HyperSpinPopupContainer extends NodeContainer {
    @render(FlashSpinStore, (store) => store.isOpenHyperSpinPopup)
    renderOpenPopup(isOpenHyperSpinPopup: boolean) {

        if (!isOpenHyperSpinPopup) {
            const nodes = this.node.children;
            if (nodes.length > 0) {
                nodes[0].getComponent(Dialog)?.hide();
            }
            return;
        }

        this.createNode();
    }
}

