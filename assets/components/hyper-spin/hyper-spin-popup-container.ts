import { _decorator } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";

import { HyperSpinStore } from "../../stores/hyper-spin-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


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

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] renderOpenPopup called", {
            isOpenHyperSpinPopup,
            hasNode: !!this.node,
            currentChildCount: this.node.children.length,
            childrenNames: this.node.children.map(child => child.name),
            timestamp: new Date().toISOString()
        });

        if (!isOpenHyperSpinPopup) {
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] Hiding popup - processing close action", {
                isOpenHyperSpinPopup,
                currentChildCount: this.node.children.length,
                willHidePopup: true,
                timestamp: new Date().toISOString()
            });

            const nodes = this.node.children;
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] Retrieved children nodes", {
                nodesCount: nodes.length,
                nodesExist: nodes.length > 0,
                timestamp: new Date().toISOString()
            });

            if (nodes.length > 0) {
                const firstNode = nodes[0];
                const dialogComponent = firstNode.getComponent(Dialog);
                cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] Processing first child node", {
                    firstNodeName: firstNode.name,
                    hasDialogComponent: !!dialogComponent,
                    willHideDialog: true,
                    timestamp: new Date().toISOString()
                });

                dialogComponent?.hide();
                cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] Dialog hide called", {
                    hideCalled: true,
                    dialogComponentExists: !!dialogComponent,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] No children nodes to hide", {
                    nodesCount: 0,
                    skipHideAction: true,
                    timestamp: new Date().toISOString()
                });
            }

            cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] renderOpenPopup completed - popup hidden", {
                isOpenHyperSpinPopup,
                actionTaken: "hidden",
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] Showing popup - processing open action", {
            isOpenHyperSpinPopup,
            willCreateNode: true,
            timestamp: new Date().toISOString()
        });

        this.createNode();
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] createNode called", {
            createNodeCalled: true,
            newChildCount: this.node.children.length,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP_CONTAINER] renderOpenPopup completed - popup shown", {
            isOpenHyperSpinPopup,
            actionTaken: "shown",
            finalChildCount: this.node.children.length,
            timestamp: new Date().toISOString()
        });
    }
}



