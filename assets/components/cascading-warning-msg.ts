import { _decorator, Component, Label } from "cc";
import Observer from "observer";

import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningMsg extends Component {
    @property(Label)
    lblMessage: Label = null;

    setData(msg: string) {
        this.lblMessage.string = msg.toUpperCase();
        ComponentUtils.autoDisappear(this.node);
    }
}
