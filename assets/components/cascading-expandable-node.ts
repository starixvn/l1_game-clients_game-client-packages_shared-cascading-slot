import { _decorator } from "cc";
import Observer from "observer";

import { ExpandableNode } from "db://shared-components/shared/common-components/expandable-node/scripts/expandable-node";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { DialogName } from "../cascading-slot-utils";
import { CascadingUIHandler } from "../handlers/cascading-ui-handler";
import { BetControlStore } from "../stores/bet-control-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class CascadingExpandableNode extends ObserverComponent {
    @property(ExpandableNode)
    expandableNode: ExpandableNode = null;

    @render(BetControlStore, (store) => store.isCollapseMenuInGame)
    protected renderMenuInGame(isCollapseMenuInGame: boolean) {
        cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] renderMenuInGame called", {
            isCollapseMenuInGame,
            hasExpandableNode: !!this.expandableNode,
            willCollapse: isCollapseMenuInGame,
            timestamp: new Date().toISOString()
        });

        if (isCollapseMenuInGame) {
            cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] Collapsing expandable node", {
                timestamp: new Date().toISOString()
            });
            this.expandableNode.collapse();
        }

        cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] renderMenuInGame completed", {
            isCollapseMenuInGame,
            collapsed: isCollapseMenuInGame,
            timestamp: new Date().toISOString()
        });
    }

    onClickMenu() {
        cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] onClickMenu called", {
            willOpenInGameMenu: true,
            timestamp: new Date().toISOString()
        });

        this.openInGameMenu();

        cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] onClickMenu completed", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.IN_GAME_MENU))
    openInGameMenu() {
        cascadingSlotLogger.info("[CASCADING_EXPANDABLE_NODE] openInGameMenu called", {
            dialogName: DialogName.IN_GAME_MENU,
            timestamp: new Date().toISOString()
        });
    }
}




