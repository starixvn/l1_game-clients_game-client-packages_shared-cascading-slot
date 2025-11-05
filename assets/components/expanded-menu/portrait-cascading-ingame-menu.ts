import { _decorator, Sprite } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { CascadingWebViewGuide } from "./cascading-in-game-menu";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingInGameMenu extends CascadingWebViewGuide {
    private colorConfig: ColorJson;
    onLoad(): void {
        cascadingSlotLogger.info("PortraitCascadingInGameMenu: onLoad called");
        this.colorConfig = resourcesCache.colorJson;
        cascadingSlotLogger.info("PortraitCascadingInGameMenu: colorConfig initialized", this.colorConfig);
        this.updateColor();
        super.onLoad();
    }

    updateColor() {
        cascadingSlotLogger.info("PortraitCascadingInGameMenu: updateColor called");
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const spriteComp = comp.node.getComponent(Sprite);
            cascadingSlotLogger.info("PortraitCascadingInGameMenu: processing ChangeNodeColor component", comp);
            if (spriteComp) {
                cascadingSlotLogger.info("PortraitCascadingInGameMenu: updating color for sprite component", this.colorConfig.bottomAreaButtonBorderColor);
                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });
    }
}



