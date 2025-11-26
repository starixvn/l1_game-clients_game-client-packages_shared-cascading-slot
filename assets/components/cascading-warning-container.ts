import { _decorator, instantiate, Prefab } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingWarningMsg } from "./cascading-warning-msg";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningContainer extends ObserverComponent {
    @property(Prefab)
    prefabWarning: Prefab = null;

    private isTrialMode = false;

    @render(CascadingUIStore, (store) => store.gameSpeed, { fireImmediately: false })
    renderTurboModeMsg(gameSpeed: string) {
        if (this.isTrialMode) {
            return;
        }
        const msg = gc.Translator.gameTranslate(`speed_${gameSpeed.toLowerCase()}`);
        this.addNode(msg);
    }

    @render(CascadingUIStore, (store) => store.showReachMaxWin, { fireImmediately: false })
    renderShowReachMaxWin(showReachMaxWin: boolean) {
        if (showReachMaxWin) {
            const msg = gc.Translator.gameTranslate("reach_max_win");
            this.addNode(msg);
        }
    }

    addNode(msg: string) {
        const warningNode = instantiate(this.prefabWarning);
        const comp = warningNode.getComponent(CascadingWarningMsg);
        this.node.addChild(warningNode);
        comp.setData(msg);
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
    }
}
