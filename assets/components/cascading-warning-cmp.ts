import { _decorator } from "cc";
import Observer from "observer";

import { WarningCmp } from "db://shared-components/shared/common-components/notice/scripts/warning-cmp";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningCmp extends WarningCmp {
    setData(message: string) {
        cascadingSlotLogger.info("[CASCADING_WARNING_CMP] setData called", {
            message,
            hasLblMessage: !!this.lblMessage,
            currentMessage: this.lblMessage?.string,
            willConvertToUpperCase: true,
            timestamp: new Date().toISOString()
        });

        this.lblMessage.string = message.toUpperCase();

        cascadingSlotLogger.info("[CASCADING_WARNING_CMP] Warning message set", {
            originalMessage: message,
            upperCaseMessage: this.lblMessage.string,
            timestamp: new Date().toISOString()
        });
    }
}




