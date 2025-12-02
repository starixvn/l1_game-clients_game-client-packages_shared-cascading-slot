import gc from "@sg/game-client-base";
import { _decorator, Label, Node, sp } from "cc";
import { ButtonState } from "db://shared-components/shared/common-components/button/button-state";
import { StateChangedEvent } from "db://shared-components/shared/common-components/button/custom-button";
import Observer from "observer";
import { AutoPlayHandler } from "../../handlers/auto-play-handlers";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingSpinButton } from "../spin-button/cascading-spin-button";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingSpinButton extends CascadingSpinButton {
    @property(Node)
    nodeAutospinNumber: Node = null;

    @property(Label)
    lblAutoSpinRound: Label = null;

    @property(sp.Skeleton)
    spineAutoSpin: sp.Skeleton = null;

    onLoad() {
        super.onLoad();
        this.nodeAutospinNumber.on(StateChangedEvent, this.onButtonStateChanged, this);
    }

    @render(CascadingUIStore, (store) => store.isShowAutoSpinRoundPortrait)
    setNodeVisibilityAutoSpinRound(isActive: boolean) {
        this.nodeAutospinNumber.active = isActive;
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    setRoundsAutoplayMsg(roundsAutoplay: number) {
        this.lblAutoSpinRound.string = roundsAutoplay.toString();
    }

    @handle(AutoPlayHandler, (handle) => handle.clickAutoPlay())
    onClickAutoPlay() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    onButtonStateChanged(state: ButtonState) {
        if (state === ButtonState.HOVER) {
            this.spineAutoSpin.setAnimation(1, "hover", true);
        } else {
            this.spineAutoSpin.clearAnimation(1);
        }
    }
}
