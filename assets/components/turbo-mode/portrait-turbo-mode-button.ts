import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import Observer from "observer";

import TurboModeButton from "./turbo-mode-button";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class PortraitTurboModeButton extends TurboModeButton {
    @property(Node)
    nodeDeactive: Node = null;

    renderTurboMode(isTurboMode: boolean) {
        super.renderTurboMode(isTurboMode);
        this.nodeDeactive.active = !isTurboMode;
    }
}
