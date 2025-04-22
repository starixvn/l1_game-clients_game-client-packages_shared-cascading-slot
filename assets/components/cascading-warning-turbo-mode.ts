import { _decorator, Label, UIOpacity } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningTurboMode extends ObserverComponent {
    @property(Label)
    lblMessage: Label = null;

    onLoad() {
        super.onLoad();
        this.node.getComponent(UIOpacity).opacity = 0;
    }

    @render(CascadingUIStore, (store) => store.isTurboMode, { fireImmediately: false })
    renderTurboModeMsg(isTurboMode: boolean) {
        const msg = isTurboMode ? gc.Translator.gameTranslate("enable_turbo_mode") : gc.Translator.gameTranslate("disable_turbo_mode");
        this.lblMessage.string = msg.toUpperCase();
        ComponentUtils.autoDisappear(this.node);
    }
}
