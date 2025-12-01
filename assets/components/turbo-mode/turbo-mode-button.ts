import gc from "@sg/game-client-base";
import { _decorator, Node, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { DialogName } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class TurboModeButton extends ObserverComponent {
    @property(Toggle)
    tglTurboMode: Toggle = null;

    @property(Node)
    nodeDisabled: Node = null;

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(CascadingUIStore, (store) => store.disabledTurboMode)
    turboModeDisabled(disabledTurboMode: boolean) {
        this.nodeDisabled.active = disabledTurboMode;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.TURBO_MODE))
    triggerOpenTurboMode() {}
}
