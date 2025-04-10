import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIHandler } from "../../main-ui";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingTrialMode extends ObserverComponent {
    @property(Node)
    nodeTrialMode: Node = null;

    @property(Node)
    nodeRealMode: Node = null;

    @property(Node)
    nodeDisabled: Node = null;

    private isTrialMode = false;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
        this.nodeTrialMode.active = !isTrialMode;
        this.nodeRealMode.active = isTrialMode;
    }

    @handle(CascadingUIHandler, (handle, isTrialMode: boolean) => handle.handleChangeMode(isTrialMode))
    onClickChangeMode() {
        this.playSoundClick();
        this.handleSymbolPreviewVisiblity(false);
        return !this.isTrialMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return "click";
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    handleSymbolPreviewVisiblity(isVisible: boolean) {
        return isVisible;
    }
}
