import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import Observer from "observer";
import { GameSpeed } from "./../../cascading-slot-utils";

import TurboModeButton from "./turbo-mode-button";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class PortraitTurboModeButton extends TurboModeButton {
    @property(Node)
    nodeDeactive: Node = null;

    renderTurboMode(gameSpeed: string) {
        super.renderTurboMode(gameSpeed);
        this.nodeDeactive.active = gameSpeed === GameSpeed.NORMAL ? true : false;
    }
}
