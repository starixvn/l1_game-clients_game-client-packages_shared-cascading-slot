import { _decorator } from "cc";
import Observer from "observer";

import { ExpandableNode } from "db://shared-components/shared/common-components/expandable-node/scripts/expandable-node";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { DialogName } from "../cascading-slot-utils";
import { CascadingUIHandler } from "../handlers/cascading-ui-handler";
import { BetControlStore } from "../stores/bet-control-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class CascadingExpandableNode extends ObserverComponent {
    @property(ExpandableNode)
    expandableNode: ExpandableNode = null;

    @render(BetControlStore, (store) => store.isCollapseMenuInGame)
    protected renderMenuInGame(isCollapseMenuInGame: boolean) {
        if (isCollapseMenuInGame) {
            this.expandableNode.collapse();
        }
    }

    onClickMenu() {
        this.openInGameMenu();
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.IN_GAME_MENU))
    openInGameMenu() { }
}
