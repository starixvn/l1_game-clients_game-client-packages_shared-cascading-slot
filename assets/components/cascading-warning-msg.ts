import { _decorator, Component, Label } from "cc";
import Observer from "observer";

import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningMsg extends Component {
    @property(Label)
    lblMessage: Label = null;

    setData(msg: string) {
        cascadingSlotLogger.info("[CASCADING_WARNING_MSG] setData called", {
            msg,
            hasLblMessage: !!this.lblMessage,
            currentMessage: this.lblMessage?.string,
            hasNode: !!this.node,
            willConvertToUpperCase: true,
            willAutoDisappear: true,
            timestamp: new Date().toISOString()
        });

        this.lblMessage.string = msg.toUpperCase();
        cascadingSlotLogger.info("[CASCADING_WARNING_MSG] Message label set", {
            originalMessage: msg,
            upperCaseMessage: this.lblMessage.string,
            timestamp: new Date().toISOString()
        });

        ComponentUtils.autoDisappear(this.node);
        cascadingSlotLogger.info("[CASCADING_WARNING_MSG] Auto disappear scheduled", {
            timestamp: new Date().toISOString()
        });
    }
}




