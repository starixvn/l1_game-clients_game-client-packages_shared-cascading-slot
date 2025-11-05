import { _decorator } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { CascadingBottomArea } from "./cascading-bottom-area";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("PortraitCascadingBottomArea")
export class PortraitCascadingBottomArea extends CascadingBottomArea {
    updateColorLabel(comp: ChangeNodeColor) {
        cascadingSlotLogger.info("[PORTRAIT_CASCADING_BOTTOM_AREA] updateColorLabel called", {
            componentName: comp?.node?.name,
            hasColorConfig: !!this.colorConfig,
            bottomAreaTextColor: this.colorConfig?.bottomAreaTextColor,
            hasLocalizedLabel: !!comp?.node?.getComponent('LocalizedLabel'),
            timestamp: new Date().toISOString()
        });

        const color = this.colorConfig.bottomAreaTextColor;

        cascadingSlotLogger.info("[PORTRAIT_CASCADING_BOTTOM_AREA] updateColorLabel returning color", {
            color: color,
            timestamp: new Date().toISOString()
        });

        return color;
    }
}




