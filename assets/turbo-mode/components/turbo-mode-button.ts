import gc from "@sg/game-client-base";
import { _decorator, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AutoPlayHandler } from "../../auto-play/scripts/auto-play-handlers";
import { AutoPlayStore } from "../../auto-play/scripts/auto-play-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class TurboModeButton extends ObserverComponent {
    @property(Toggle)
    tglTurboMode: Toggle = null;

    @handle(AutoPlayHandler, (handle, isTurboMode: boolean) => handle.handleTurboMode(isTurboMode))
    onTurboModeChanged() {
        return this.tglTurboMode.isChecked;
    }

    @render(AutoPlayStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.playSoundClick();
        this.tglTurboMode.isChecked = isTurboMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
