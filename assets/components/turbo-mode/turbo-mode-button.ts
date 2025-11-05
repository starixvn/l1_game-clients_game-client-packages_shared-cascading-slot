import gc from "@sg/game-client-base";
import { _decorator, Node, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { cascadingSlotLogger, createFileLogger } from "../../cascading-slot-logger";

import { DialogName } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

// Create file-specific logger for per-file enable/disable control
const FILE_ID = "turbo-mode-button";
const logger = createFileLogger(FILE_ID);

@ccclass
export default class TurboModeButton extends ObserverComponent {
    @property(Toggle)
    tglTurboMode: Toggle = null;

    @property(Node)
    nodeDisabled: Node = null;

    @handle(CascadingUIHandler, (handle, isTurboModeUI: boolean) => handle.handleTurboModeUI(isTurboModeUI))
    onTurboModeChanged() {
        logger.info("[TURBO_MODE_BUTTON] onTurboModeChanged called", {
            hasTglTurboMode: !!this.tglTurboMode,
            currentIsChecked: this.tglTurboMode?.isChecked,
            willTriggerOpenTurboMode: true,
            willReturnIsChecked: true,
            timestamp: new Date().toISOString()
        });

        this.triggerOpenTurboMode();
        logger.info("[TURBO_MODE_BUTTON] triggerOpenTurboMode called", {
            timestamp: new Date().toISOString()
        });

        const isChecked = this.tglTurboMode.isChecked;
        logger.info("[TURBO_MODE_BUTTON] onTurboModeChanged returning", {
            isChecked,
            timestamp: new Date().toISOString()
        });

        return isChecked;
    }

    @render(CascadingUIStore, (store) => store.isTurboModeUI)
    renderTurboMode(isTurboMode: boolean) {
        logger.info("[TURBO_MODE_BUTTON] renderTurboMode called", {
            isTurboMode,
            hasTglTurboMode: !!this.tglTurboMode,
            currentIsChecked: this.tglTurboMode?.isChecked,
            willPlaySound: true,
            willSetChecked: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();
        logger.info("[TURBO_MODE_BUTTON] Sound played", {
            timestamp: new Date().toISOString()
        });

        this.tglTurboMode.isChecked = isTurboMode;
        logger.info("[TURBO_MODE_BUTTON] Turbo mode toggle set", {
            isTurboMode,
            finalIsChecked: this.tglTurboMode.isChecked,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        logger.info("[TURBO_MODE_BUTTON] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        logger.info("[TURBO_MODE_BUTTON] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.disabledTurboMode)
    turboModeDisabled(disabledTurboMode: boolean) {
        logger.info("[TURBO_MODE_BUTTON] turboModeDisabled called", {
            disabledTurboMode,
            hasNodeDisabled: !!this.nodeDisabled,
            currentNodeActive: this.nodeDisabled?.active,
            willSetActive: true,
            timestamp: new Date().toISOString()
        });

        this.nodeDisabled.active = disabledTurboMode;
        logger.info("[TURBO_MODE_BUTTON] Disabled node active set", {
            disabledTurboMode,
            finalActive: this.nodeDisabled.active,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.TURBO_MODE))
    triggerOpenTurboMode() {
        logger.info("[TURBO_MODE_BUTTON] triggerOpenTurboMode called", {
            dialogName: DialogName.TURBO_MODE,
            timestamp: new Date().toISOString()
        });

        // Empty implementation - handler will be called by decorator
        logger.info("[TURBO_MODE_BUTTON] triggerOpenTurboMode completed", {
            timestamp: new Date().toISOString()
        });
    }
}
