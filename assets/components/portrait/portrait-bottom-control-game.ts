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
        } else {
            AnimationUtils.fadeOut(this.nodeFreeSpinsSections, 0.3);
        }
    }

    @render(CascadingUIStore, (store) => store.freespinCountMsgBottom)
    setFreeSpinsCount(freespinCountMsgBottom: number) {
        this.labelFreeSpinsCount.string = freespinCountMsgBottom.toString();
    }
}
