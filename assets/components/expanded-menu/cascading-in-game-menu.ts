import { _decorator, Node } from "cc";
import Observer from "observer";

import { InGameMenu } from "db://shared-components/game/in-game-menu/scripts/components/in-game-menu";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingWebViewGuide extends InGameMenu {
    @property(Node)
    nodeHistoryDisabled: Node = null;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    isTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_IN_GAME_MENU] isTrialMode called", {
            isTrialMode,
            hasNodeHistoryDisabled: !!this.nodeHistoryDisabled,
            previousActiveState: this.nodeHistoryDisabled?.active,
            willSetActive: isTrialMode,
            timestamp: new Date().toISOString()
        });

        this.nodeHistoryDisabled.active = isTrialMode;

        cascadingSlotLogger.info("[CASCADING_IN_GAME_MENU] isTrialMode completed", {
            nodeHistoryDisabledActive: this.nodeHistoryDisabled?.active,
            timestamp: new Date().toISOString()
        });
    }

    protected handleEvent(event: string) {
        cascadingSlotLogger.info("[CASCADING_IN_GAME_MENU] handleEvent called", {
            event,
            willTriggerOpenDialog: true,
            willCallSuper: true,
            timestamp: new Date().toISOString()
        });

        this.triggerOpenDialog(event);
        const result = super.handleEvent(event);

        cascadingSlotLogger.info("[CASCADING_IN_GAME_MENU] handleEvent completed", {
            event,
            superResult: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    @handle(CascadingUIHandler, (handler, event: string) => handler.triggerOpenDialog(event))
    triggerOpenDialog(event: string) {
        return event;
    }
}



