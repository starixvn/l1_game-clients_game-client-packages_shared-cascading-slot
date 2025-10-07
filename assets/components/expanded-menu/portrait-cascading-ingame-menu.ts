import { _decorator, Sprite } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { CascadingWebViewGuide } from "./cascading-in-game-menu";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingInGameMenu extends CascadingWebViewGuide {
    private colorConfig: ColorJson;
    onLoad(): void {
        this.colorConfig = resourcesCache.colorJson;
        this.updateColor();
        super.onLoad();
    }

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const spriteComp = comp.node.getComponent(Sprite);
            if (spriteComp) {
                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });
    }
}
