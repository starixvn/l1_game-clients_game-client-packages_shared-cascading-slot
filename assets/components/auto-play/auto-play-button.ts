import gc from "@sg/game-client-base";
import { _decorator, Node, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AutoPlayHandler } from "../../handlers/auto-play-handlers";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class AutoPlayButton extends ObserverComponent {
    @property(Sprite)
    sprIconAutoPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Node)
    nodeDisabled: Node = null;

    @handle(AutoPlayHandler, (handle) => handle.clickAutoPlay())
    onClickAutoPlay() {

        // Check if this is the hyper spin button
        const isHyperSpinButton = this.node.name === "portrait-auto-spin-button" && this.node.parent?.name === "hyper-spin-container";

        if (isHyperSpinButton) {
            this.onClickHyperSpin();
            return;
        }

        this.playSoundClick();
    }

    @handle(CascadingUIHandler, (handle) => handle.triggerOpenDialog(DialogName.HYPER_SPIN))
    onClickHyperSpin() {

        this.playSoundClick();

    }

    @render(AutoPlayStore, (store) => store.isTurnOnAutoPlay)
    updateAutoPlayButton(isTurnOnAutoPlay: boolean) {

        this.sprIconAutoPlay.node.active = !isTurnOnAutoPlay;

        this.sprIconPause.node.active = isTurnOnAutoPlay;

    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.disabledAutoPlay)
    disabledAutoPlay(disabledAutoPlay: boolean) {

        this.nodeDisabled.active = disabledAutoPlay;
    }
}

