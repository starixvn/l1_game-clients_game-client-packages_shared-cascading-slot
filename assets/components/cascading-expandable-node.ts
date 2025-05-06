import { _decorator } from "cc";
import Observer from "observer";

import { ExpandableNode } from "db://shared-components/shared/common-components/expandable-node/scripts/expandable-node";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BetControlStore } from "../stores/bet-control-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
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
}
