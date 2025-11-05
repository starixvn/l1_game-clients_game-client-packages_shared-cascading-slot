import { _decorator, Node } from "cc";
import Observer from "observer";

import { InGameMenu } from "db://shared-components/game/in-game-menu/scripts/components/in-game-menu";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingInGameMenu extends InGameMenu {
    @property(Node)
    nodeHistoryDisabled: Node = null;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    isTrialMode(isTrialMode: boolean) {
        this.nodeHistoryDisabled.active = isTrialMode;
    }

    protected handleEvent(event: string) {
        this.triggerOpenDialog(event);
        return super.handleEvent(event);
    }

    @handle(CascadingUIHandler, (handler, event: string) => handler.triggerOpenDialog(event))
    triggerOpenDialog(event: string) {
        return event;
    }
}
