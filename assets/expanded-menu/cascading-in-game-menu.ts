import { _decorator, Node } from "cc";
import Observer from "observer";

import { InGameMenu } from "db://shared-components/game/in-game-menu/scripts/components/in-game-menu";
import { CascadingUIStore } from "../main-ui/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingWebViewGuide extends InGameMenu {
    @property(Node)
    nodeHistoryDisabled: Node = null;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    isTrialMode(isTrialMode: boolean) {
        this.nodeHistoryDisabled.active = isTrialMode;
    }
}
