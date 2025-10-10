import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitBottomControlGame extends ObserverComponent {
    @property(Node)
    nodeFreeSpinsSections: Node = null;

    @property(Label)
    labelFreeSpinsCount: Label = null;

    @property(Node)
    nodeLastFreeSpin: Node = null;

    @render(CascadingUIStore, (store) => store.showFreeSpinsSectionsPortrait)
    setShowFreeSpinsSectionsPortrait(showFreeSpinsSectionsPortrait: boolean) {
        if (showFreeSpinsSectionsPortrait) {
            this.nodeFreeSpinsSections.active = true;
        } else {
            this.nodeFreeSpinsSections.active = false;
        }
    }

    @render(CascadingUIStore, (store) => store.freespinCountMsgBottom)
    setFreeSpinsCount(freespinCountMsgBottom: number) {
        const nodeRemainingFreeSpins = this.nodeFreeSpinsSections.getChildByName("remaining-freespins");
        if (freespinCountMsgBottom === 0) {
            this.nodeLastFreeSpin.active = true;
            nodeRemainingFreeSpins.active = false;
        } else {
            this.nodeLastFreeSpin.active = false;
            nodeRemainingFreeSpins.active = true;
        }
        this.labelFreeSpinsCount.string = freespinCountMsgBottom.toString();
    }
}
