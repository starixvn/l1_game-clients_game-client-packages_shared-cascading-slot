import { _decorator, Sprite } from "cc";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ColorJson, DialogName, resourcesCache } from "../../cascading-slot-utils";
import { CascadingWebViewGuide } from "./cascading-in-game-menu";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass } = _decorator;
const {render } = Observer;

@ccclass
export class PortraitCascadingInGameMenu extends CascadingWebViewGuide {
    private colorConfig: ColorJson;
    onLoad(): void {
        this.colorConfig = resourcesCache.colorJson;
        this.updateColor();
        super.onLoad();
    }
    @render(CascadingUIStore, (store) => store.dialogOpenEvent)
    handleDialogOpenEvent(dialogOpenEvent: { name: string }) {
        if(dialogOpenEvent?.name !== DialogName.IN_GAME_MENU) {
           this.expandableNode.collapse();
        }
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
