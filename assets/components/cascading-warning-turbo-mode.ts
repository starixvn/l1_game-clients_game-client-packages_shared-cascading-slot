import { _decorator, Component, Label } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningTurboMode extends Component {
    @property(Label)
    lblMessage: Label = null;

    setData(isTurboMode: boolean) {
        const msg = isTurboMode ? gc.Translator.gameTranslate("enable_turbo_mode") : gc.Translator.gameTranslate("disable_turbo_mode");
        this.lblMessage.string = msg.toUpperCase();
        ComponentUtils.autoDisappear(this.node);
    }
}
