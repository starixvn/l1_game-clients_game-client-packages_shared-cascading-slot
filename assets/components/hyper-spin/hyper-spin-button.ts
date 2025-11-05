import gc from "@sg/game-client-base";
import { _decorator, Node, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export default class HyperSpinButton extends ObserverComponent {
    @property(Sprite)
    sprIconAutoPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Node)
    nodeDisabled: Node = null;

    onClickHyperSpin() {
        this.playSoundClick();
        this.triggerHyperSpinHandler();
    }

    @handle(HyperSpinHandler, (handle) => handle.clickHyperSpin())
    triggerHyperSpinHandler() { }

    @handle(CascadingUIHandler, (handle) => handle.triggerOpenDialog(DialogName.AUTO_SPIN))
    onClickAutoPlay() {
        const isHyperInAutoContext = this.node.name === "portrait-hyper-spin-button" && this.node.parent?.name === "auto-spin-container";

        if (isHyperInAutoContext) {
            this.onClickHyperSpin();
            return;
        }

        this.playSoundClick();
    }

    @render(AutoPlayStore, (store) => store.isTurnOnAutoPlay)
    updateAutoPlayButton(isTurnOnAutoPlay: boolean) {
        if (this.sprIconAutoPlay && this.sprIconPause) {
            this.sprIconAutoPlay.node.active = !isTurnOnAutoPlay;
            this.sprIconPause.node.active = isTurnOnAutoPlay;
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(CascadingUIStore, (store) => store.disabledAutoPlay)
    disabledAutoPlay(disabledAutoPlay: boolean) {
        const isAutoSpinButtonInHyperContainer = this.node.name === "portrait-auto-spin-button" && this.node.parent?.name === "hyper-spin-container";

        if (!isAutoSpinButtonInHyperContainer && this.nodeDisabled) {
            this.nodeDisabled.active = disabledAutoPlay;
        }
    }

    @render(CascadingUIStore, (store) => store.disabledHyperSpin)
    disabledHyperSpin(disabledHyperSpin: boolean) {
        const isAutoSpinButtonInHyperContainer = this.node.name === "portrait-auto-spin-button" && this.node.parent?.name === "hyper-spin-container";

        if (isAutoSpinButtonInHyperContainer && this.nodeDisabled) {
            this.nodeDisabled.active = disabledHyperSpin;
        }
    }
}

