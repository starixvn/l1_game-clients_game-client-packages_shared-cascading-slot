import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import Observer from "observer";

import TurboModeButton from "./turbo-mode-button";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class PortraitTurboModeButton extends TurboModeButton {
    @property(Node)
    nodeDeactive: Node = null;

    renderTurboMode(isTurboMode: boolean) {
        cascadingSlotLogger.info("[PORTRAIT_TURBO_MODE_BUTTON] renderTurboMode called", {
            isTurboMode,
            hasNodeDeactive: !!this.nodeDeactive,
            currentNodeDeactiveActive: this.nodeDeactive?.active,
            willCallSuper: true,
            willSetNodeDeactive: true,
            timestamp: new Date().toISOString()
        });

        super.renderTurboMode(isTurboMode);
        cascadingSlotLogger.info("[PORTRAIT_TURBO_MODE_BUTTON] Super renderTurboMode called", {
            timestamp: new Date().toISOString()
        });

        this.nodeDeactive.active = !isTurboMode;
        cascadingSlotLogger.info("[PORTRAIT_TURBO_MODE_BUTTON] Node deactive active set", {
            isTurboMode,
            nodeDeactiveActive: this.nodeDeactive.active,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[PORTRAIT_TURBO_MODE_BUTTON] renderTurboMode completed", {
            isTurboMode,
            finalNodeDeactiveActive: this.nodeDeactive.active,
            timestamp: new Date().toISOString()
        });
    }
}


