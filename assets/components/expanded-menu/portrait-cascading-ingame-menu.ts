import { _decorator, Sprite } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { CascadingInGameMenu } from "./cascading-in-game-menu";
const { ccclass } = _decorator;
const { render } = Observer;

@ccclass
export class PortraitCascadingInGameMenu extends CascadingInGameMenu {
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
