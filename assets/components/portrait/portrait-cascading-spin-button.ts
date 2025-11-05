import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import Observer from "observer";
import { cascadingSlotLogger } from "../../cascading-slot-logger";
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

    @render(CascadingUIStore, (store) => store.isShowAutoSpinRoundPortrait)
    setNodeVisibilityAutoSpinRound(isActive: boolean) {
        cascadingSlotLogger.info(`[PortraitCascadingSpinButton] setNodeVisibilityAutoSpinRound called with isActive: ${isActive}`);
        this.nodeAutospinNumber.active = isActive;
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    setRoundsAutoplayMsg(roundsAutoplay: number) {
        cascadingSlotLogger.info(`[PortraitCascadingSpinButton] setRoundsAutoplayMsg called with roundsAutoplay: ${roundsAutoplay}`);
        this.lblAutoSpinRound.string = roundsAutoplay.toString();
        cascadingSlotLogger.info(`[PortraitCascadingSpinButton] Set auto spin round label to: ${this.lblAutoSpinRound.string}`);
    }

    @handle(AutoPlayHandler, (handle) => handle.clickAutoPlay())
    onClickAutoPlay() {
        cascadingSlotLogger.info(`[PortraitCascadingSpinButton] onClickAutoPlay called`);
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        cascadingSlotLogger.info(`[PortraitCascadingSpinButton] playSoundClick returning audio ID: ${gc.Audios.AudioIds.CLICK}`);
        return gc.Audios.AudioIds.CLICK;
    }
}

