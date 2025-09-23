import gc from "@sg/game-client-base";
import { _decorator, Label, sys } from "cc";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingTopMessage } from "../top-message/cascading-top-message";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitMessagesBeforeSpin extends CascadingTopMessage {
    @property(Label)
    msg4: Label = null;

    msgList = [1, 2, 3, 4];

    onLoad() {
        this.handleMessageBeforeSpin();
        super.onLoad();
    }

    handleMessageBeforeSpin() {
        const deviceSuffix = sys.isMobile ? "phone" : "desktop";
        this.msg4.string = gc.Translator.gameTranslate(`show_msg_when_spin_${deviceSuffix}`).toUpperCase();
    }

    @render(CascadingUIStore, (store) => store.isShowMesgBeforeSpinPortrait)
    setNodeVisibilityBeforeSpin(isActive: boolean) {
        this.node.active = isActive;
    }

    topMessageVisibility(isHideTopMessage: boolean) {}
}
