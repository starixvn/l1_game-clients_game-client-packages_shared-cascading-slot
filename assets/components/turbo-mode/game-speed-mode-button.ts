import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import Observer from "observer";
import { DialogName } from "./../../cascading-slot-utils";

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

    @property({ type: Node })
    nodeSpeedList: Node[] = [];

    private currentSpeedIndex = 0;

    @render(CascadingUIStore, (store) => store.gameSpeed)
    getGameSpeed(gameSpeed: string) {
        const targetSpeed = gameSpeed.toLowerCase();
        const targetIndex = this.findTargetSpeedIndex(targetSpeed);

        if (targetIndex === -1) {
            return;
        }

        this.currentSpeedIndex = targetIndex;
        this.updateSpeedNodesDisabledState(targetIndex);
        this.playSoundClick();
    }

    private findTargetSpeedIndex(targetSpeed: string): number {
        return this.nodeSpeedList.findIndex((node) => node.name === targetSpeed);
    }

    private updateSpeedNodesDisabledState(targetIndex: number): void {
        this.nodeSpeedList.forEach((node, index) => {
            const disabledNode = node.getChildByName("disabled");
            // Nodes before and at target speed: disabled = false
            // Nodes after target speed: disabled = true
            disabledNode.active = index > targetIndex;
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.TURBO_MODE))
    triggerOpenTurboMode() {}

    @handle(CascadingUIHandler, (handle, gameSpeed: string) => handle.handleTurboModeUI(gameSpeed))
    onClickSpeedChanged() {
        this.triggerOpenTurboMode();
        this.currentSpeedIndex++;
        if (this.currentSpeedIndex >= this.nodeSpeedList.length) {
            this.currentSpeedIndex = 0;
        }
        return this.nodeSpeedList[this.currentSpeedIndex].name.toUpperCase();
    }

    @render(CascadingUIStore, (store) => store.disabledTurboMode)
    gameSpeedDisabled(disabledTurboMode: boolean) {
        this.nodeDisabled.active = disabledTurboMode;
    }
}
