import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import Observer from "observer";
import { DialogName, resourcesCache } from "./../../cascading-slot-utils";

import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class GameSpeedModeButton extends ObserverComponent {
    @property(Node)
    nodeDisabled: Node = null;

    @property(Node)
    nodeSpeed: Node = null;

    protected colorConfig: any;

    async onLoad() {
        this.colorConfig = resourcesCache.colorJson;
        try {
            const prefabSpeed = await bundleManager.loadAssetsFromBundle<Prefab>(
                "game-speed-resources",
                "prefabs/game-speed-button",
                Prefab,
                null
            );
            const nodeGameSpeed = instantiate(prefabSpeed);
            this.nodeSpeed.addChild(nodeGameSpeed);
            this.updateColor();
            super.onLoad();
        } catch (err) {}
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.TURBO_MODE))
    triggerOpenTurboMode() {}

    onClickSpeedChanged() {
        this.triggerOpenTurboMode();
    }

    @render(CascadingUIStore, (store) => store.disabledTurboMode)
    gameSpeedDisabled(disabledTurboMode: boolean) {
        this.nodeDisabled.active = disabledTurboMode;
    }

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
        });
    }
}
