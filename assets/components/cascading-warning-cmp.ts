import { _decorator } from "cc";
import Observer from "observer";

import { WarningCmp } from "db://shared-components/shared/common-components/notice/scripts/warning-cmp";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningCmp extends WarningCmp {
    setData(message: string) {
        this.lblMessage.string = message.toUpperCase();
    }
}
