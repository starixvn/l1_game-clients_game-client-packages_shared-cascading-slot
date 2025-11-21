import gc from "@sg/game-client-base";
import { _decorator, Button, Node, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { cascadingSlotLogger } from "../../cascading-slot-logger";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class HyperSpinButton extends ObserverComponent {
    @property(Sprite)
    sprIconAutoPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Node)
    nodeDisabled: Node = null;

    onLoad() {
        super.onLoad();

        // Test if method is accessible

        // Get Button component and verify click event configuration
        const button = this.node.getComponent(Button);
        if (button) {
        } else {
        }
    }

    // This method is called directly by Button component click event
    // It must be accessible without decorator interference
    onClickHyperSpin() {

        try {
            this.playSoundClick();

            this.triggerHyperSpinHandler();
        } catch (error) {
        }
    }

    // This method is called by Observer pattern via @handle decorator
    // It calls HyperSpinHandler.clickHyperSpin() which handles both dialog and bet control
    @handle(HyperSpinHandler, (handle) => handle.clickHyperSpin())
    triggerHyperSpinHandler() {
    }

    @handle(CascadingUIHandler, (handle) => handle.triggerOpenDialog(DialogName.AUTO_SPIN))
    onClickAutoPlay() {

        // Check if this is the hyper button in auto-play context
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
            const newAutoPlayActive = !isTurnOnAutoPlay;
            const newPauseActive = isTurnOnAutoPlay;

            this.sprIconAutoPlay.node.active = newAutoPlayActive;
            this.sprIconPause.node.active = newPauseActive;

        } else {
        }

    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.disabledAutoPlay)
    disabledAutoPlay(disabledAutoPlay: boolean) {
        const nodeName = this.node.name;
        const parentName = this.node.parent?.name;
        const isAutoSpinButtonInHyperContainer = nodeName === "portrait-auto-spin-button" && parentName === "hyper-spin-container";
        const shouldApplyDisabled = !isAutoSpinButtonInHyperContainer;

        if (shouldApplyDisabled) {
            if (this.nodeDisabled) {

                this.nodeDisabled.active = disabledAutoPlay;

            } else {
            }
        } else {
        }

    }

    @render(CascadingUIStore, (store) => store.disabledHyperSpin)
    disabledHyperSpin(disabledHyperSpin: boolean) {
        const nodeName = this.node.name;
        const parentName = this.node.parent?.name;
        const isAutoSpinButtonInHyperContainer = nodeName === "portrait-auto-spin-button" && parentName === "hyper-spin-container";
        const shouldApplyDisabled = isAutoSpinButtonInHyperContainer;

        if (shouldApplyDisabled) {
            if (this.nodeDisabled) {

                this.nodeDisabled.active = disabledHyperSpin;

            } else {
            }
        } else {
        }

    }
}

