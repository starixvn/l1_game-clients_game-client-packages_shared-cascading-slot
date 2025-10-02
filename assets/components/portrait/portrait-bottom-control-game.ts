import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitBottomControlGame extends ObserverComponent {
    @property(Node)
    nodeMsgBeforeSpin: Node = null;

    @property(Node)
    nodeMsg: Node = null;

    @property(Node)
    nodeFreeSpinsSections: Node = null;

    @property(Node)
    nodeBetControls: Node = null;

    @property(Label)
    labelFreeSpinsCount: Label = null;

    @property(Node)
    nodeLastFreeSpin: Node = null;

    @render(CascadingUIStore, (store) => store.isShowMesgBeforeSpinPortrait)
    setHideTopMessage(isShowMesgBeforeSpinPortrait: boolean) {
        this.nodeMsgBeforeSpin.active = isShowMesgBeforeSpinPortrait;
    }

    @render(CascadingUIStore, (store) => store.isShowMesgAfterSpinPortrait)
    setNodeVisibilityBeforeSpin(isShowMesgAfterSpinPortrait: boolean) {
        this.nodeMsg.active = isShowMesgAfterSpinPortrait;
    }

    @render(CascadingUIStore, (store) => store.showFreeSpinsSectionsPortrait)
    setShowFreeSpinsSectionsPortrait(showFreeSpinsSectionsPortrait: boolean) {
        if (showFreeSpinsSectionsPortrait) {
            AnimationUtils.fadeIn(this.nodeFreeSpinsSections, 0.3);
            this.nodeBetControls.active = false;
        } else {
            AnimationUtils.fadeOut(this.nodeFreeSpinsSections, 0.3);
            this.nodeBetControls.active = true;
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
