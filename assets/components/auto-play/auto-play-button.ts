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
        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayButton.onClickAutoPlay() - Button clicked", {
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            componentName: this.constructor.name,
            timestamp: new Date().toISOString()
        });

        // Check if this is the hyper spin button
        const isHyperSpinButton = this.node.name === "portrait-auto-spin-button" && this.node.parent?.name === "hyper-spin-container";
        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayButton.onClickAutoPlay() - Hyper spin check", {
            isHyperSpinButton: isHyperSpinButton,
            nodeName: this.node.name,
            expectedNodeName: "portrait-auto-spin-button",
            parentName: this.node.parent?.name,
            expectedParentName: "hyper-spin-container"
        });

        if (isHyperSpinButton) {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] AutoPlayButton.onClickAutoPlay() - Detected hyper spin button, calling onClickHyperSpin()");
            this.onClickHyperSpin();
            return;
        }

        cascadingSlotLogger.info("[AUTO_SPIN_WORKFLOW] AutoPlayButton.onClickAutoPlay() - Playing sound and proceeding with auto play");
        this.playSoundClick();
    }

    @handle(CascadingUIHandler, (handle) => handle.triggerOpenDialog(DialogName.HYPER_SPIN))
    onClickHyperSpin() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] AutoPlayButton.onClickHyperSpin() - Hyper spin triggered from auto-play button", {
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            componentName: this.constructor.name,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] AutoPlayButton.onClickHyperSpin() - Sound played, triggering HYPER_SPIN dialog");
    }

    @render(AutoPlayStore, (store) => store.isTurnOnAutoPlay)
    updateAutoPlayButton(isTurnOnAutoPlay: boolean) {
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] updateAutoPlayButton called", {
            isTurnOnAutoPlay,
            hasSprIconAutoPlay: !!this.sprIconAutoPlay,
            hasSprIconPause: !!this.sprIconPause,
            currentAutoPlayActive: this.sprIconAutoPlay?.node?.active,
            currentPauseActive: this.sprIconPause?.node?.active,
            willSetAutoPlayIcon: true,
            willSetPauseIcon: true,
            timestamp: new Date().toISOString()
        });

        this.sprIconAutoPlay.node.active = !isTurnOnAutoPlay;
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] Auto play icon active set", {
            isTurnOnAutoPlay,
            autoPlayIconActive: this.sprIconAutoPlay.node.active,
            timestamp: new Date().toISOString()
        });

        this.sprIconPause.node.active = isTurnOnAutoPlay;
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] Pause icon active set", {
            isTurnOnAutoPlay,
            pauseIconActive: this.sprIconPause.node.active,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] updateAutoPlayButton completed", {
            isTurnOnAutoPlay,
            finalAutoPlayIconActive: this.sprIconAutoPlay.node.active,
            finalPauseIconActive: this.sprIconPause.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.disabledAutoPlay)
    disabledAutoPlay(disabledAutoPlay: boolean) {
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] disabledAutoPlay called", {
            disabledAutoPlay,
            hasNodeDisabled: !!this.nodeDisabled,
            currentNodeDisabledActive: this.nodeDisabled?.active,
            willSetDisabledActive: true,
            timestamp: new Date().toISOString()
        });

        this.nodeDisabled.active = disabledAutoPlay;
        cascadingSlotLogger.info("[AUTO_PLAY_BUTTON] Disabled node active set", {
            disabledAutoPlay,
            finalDisabledActive: this.nodeDisabled.active,
            timestamp: new Date().toISOString()
        });
    }
}


