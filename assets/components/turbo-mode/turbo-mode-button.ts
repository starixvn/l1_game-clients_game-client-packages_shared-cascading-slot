import gc from "@sg/game-client-base";
import { _decorator, Node, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { TrackingObject } from "../../cascading-slot-base-configs";
import { trackEventButton } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Shared } = gc;
const { utils } = Shared;

@ccclass
export default class TurboModeButton extends ObserverComponent {
    @property(Toggle)
    tglTurboMode: Toggle = null;

    @property(Node)
    nodeDisabled: Node = null;

    onLoad() {
        super.onLoad();
        this.trackOnLoadEvents();
    }

    trackOnLoadEvents() {
        trackEventButton(TrackingObject.TurboMode, gc.Shared.utils.TrackingAction.Show);
    }

    @handle(CascadingUIHandler, (handle, isTurboModeUI: boolean) => handle.handleTurboModeUI(isTurboModeUI))
    onTurboModeChanged() {
        trackEventButton(
            TrackingObject.TurboMode,
            this.tglTurboMode.isChecked ? gc.Shared.utils.TrackingAction.ToggleOn : gc.Shared.utils.TrackingAction.ToggleOff
        );
        return this.tglTurboMode.isChecked;
    }

    @render(CascadingUIStore, (store) => store.isTurboModeUI)
    renderTurboMode(isTurboMode: boolean) {
        this.playSoundClick();
        this.tglTurboMode.isChecked = isTurboMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(CascadingUIStore, (store) => store.disabledTurboMode)
    turboModeDisabled(disabledTurboMode: boolean) {
        this.nodeDisabled.active = disabledTurboMode;
    }
}
