import gc from "@sg/game-client-base";
import { _decorator, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIHandler } from "../../main-ui/cascading-ui-handler";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class TurboModeButton extends ObserverComponent {
    @property(Toggle)
    tglTurboMode: Toggle = null;

    @handle(CascadingUIHandler, (handle, isTurboMode: boolean) => handle.handleTurboMode(isTurboMode))
    onTurboModeChanged() {
        return this.tglTurboMode.isChecked;
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.playSoundClick();
        this.tglTurboMode.isChecked = isTurboMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
