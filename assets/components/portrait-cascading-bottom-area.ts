import { _decorator } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { CascadingBottomArea } from "./cascading-bottom-area";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("PortraitCascadingBottomArea")
export class PortraitCascadingBottomArea extends CascadingBottomArea {
    updateColorLabel(comp: ChangeNodeColor) {
        return this.colorConfig.bottomAreaTextColor;
    }
}
