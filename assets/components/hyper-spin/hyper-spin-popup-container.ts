import { _decorator } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";

import { HyperSpinStore } from "../../stores/hyper-spin-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class HyperSpinPopupContainer extends NodeContainer {
    @render(HyperSpinStore, (store) => store.isOpenHyperSpinPopup)
    renderOpenPopup(isOpenHyperSpinPopup: boolean) {
        console.warn("🎰 HYPER-SPIN POPUP CONTAINER: renderOpenPopup called", {
            isOpenHyperSpinPopup,
            hasNode: !!this.node,
            currentChildCount: this.node.children.length,
            childrenNames: this.node.children.map(child => child.name),
            timestamp: new Date().toISOString()
        });

        if (!isOpenHyperSpinPopup) {
            const nodes = this.node.children;

            if (nodes.length > 0) {
                const firstNode = nodes[0];
                const dialogComponent = firstNode.getComponent(Dialog);

                dialogComponent?.hide();
            }

            return;
        }

        this.createNode();
    }
}

