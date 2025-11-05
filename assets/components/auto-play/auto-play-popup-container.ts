import { _decorator } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";

import { AutoPlayStore } from "../../stores/auto-play-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class AutoPlayPopupContainer extends NodeContainer {
    @render(AutoPlayStore, (store) => store.isOpenAutoplayPopup)
    renderOpenPopup(isOpenAutoPlayPopup: boolean) {
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP_CONTAINER] renderOpenPopup called", {
            isOpenAutoPlayPopup,
            currentChildCount: this.node.children.length,
            hasChildren: this.node.children.length > 0,
            timestamp: new Date().toISOString()
        });

        if (!isOpenAutoPlayPopup) {
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP_CONTAINER] Hiding popup", {
                willHideDialog: this.node.children.length > 0,
                timestamp: new Date().toISOString()
            });

            const nodes = this.node.children;
            if (nodes.length > 0) {
                const dialog = nodes[0].getComponent(Dialog);
                cascadingSlotLogger.info("[AUTO_PLAY_POPUP_CONTAINER] Found dialog component, hiding it", {
                    hasDialogComponent: !!dialog,
                    timestamp: new Date().toISOString()
                });
                dialog?.hide();
            }
            return;
        }

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP_CONTAINER] Showing popup, creating node", {
            willCreateNode: true,
            timestamp: new Date().toISOString()
        });

        this.createNode();

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP_CONTAINER] renderOpenPopup completed", {
            isOpenAutoPlayPopup,
            nodeCreated: true,
            timestamp: new Date().toISOString()
        });
    }
}



