import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { DialogName } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingTrialMode extends ObserverComponent {
    @property(Node)
    nodeTrialMode: Node = null;

    @property(Node)
    nodeRealMode: Node = null;

    @property(Node)
    nodeDisabled: Node = null;

    private isTrialMode = false;
    private isConnectedTrialService = false;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] renderTrialMode called with isTrialMode: ${isTrialMode}, current isTrialMode: ${this.isTrialMode}`);
        this.isTrialMode = isTrialMode;
        this.nodeTrialMode.active = !isTrialMode;
        this.nodeRealMode.active = isTrialMode;
        cascadingSlotLogger.info(`[CascadingTrialMode] Set nodeTrialMode active: ${this.nodeTrialMode.active}, nodeRealMode active: ${this.nodeRealMode.active}`);
        if (isTrialMode) {
            cascadingSlotLogger.info(`[CascadingTrialMode] In trial mode, isConnectedTrialService: ${this.isConnectedTrialService}`);
            this.isConnectedTrialService ? this.inGameTrial() : this.connectToServiceTrial();
        }
    }

    @handle(CascadingUIHandler, (handle, isTrialMode: boolean) => handle.handleChangeMode(isTrialMode))
    onClickChangeMode() {
        cascadingSlotLogger.info(`[CascadingTrialMode] onClickChangeMode called, current isTrialMode: ${this.isTrialMode}`);
        this.playSoundClick();
        this.triggerOpenTrialMode();
        this.handleChangeUserBalance(true);
        const newMode = !this.isTrialMode;
        cascadingSlotLogger.info(`[CascadingTrialMode] Returning new mode: ${newMode}`);
        return newMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        cascadingSlotLogger.info(`[CascadingTrialMode] playSoundClick returning audio ID: ${AudioIds.CLICK}`);
        return AudioIds.CLICK;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.TRIAL_MODE))
    triggerOpenTrialMode() {
        cascadingSlotLogger.info(`[CascadingTrialMode] triggerOpenTrialMode called`);
    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler, (handle) => handle.handleTrial())
    connectToServiceTrial() {
        cascadingSlotLogger.info(`[CascadingTrialMode] connectToServiceTrial called`);
        this.updateConnectedTrialService(true);
    }

    @render(gc.Connection.ConnectionTrialStore, (store) => store.isConnected)
    onSignedIn(isConnected: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] onSignedIn called with isConnected: ${isConnected}`);
        isConnected && this.inGameTrial();
    }

    @handle(gc.Connection.ConnectionHandlers.InGameHandler, (handle) => handle.handleTrial())
    inGameTrial() {
        cascadingSlotLogger.info(`[CascadingTrialMode] inGameTrial called`);
    }

    @handle(CascadingUIHandler, (handler, connected: boolean) => handler.updateConnectedTrialService(connected))
    updateConnectedTrialService(connected: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] updateConnectedTrialService called with connected: ${connected}`);
        return connected;
    }

    @render(CascadingUIStore, (store) => store.isConnectedTrialService)
    renderConnectedTrialService(isConnected: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] renderConnectedTrialService called with isConnected: ${isConnected}`);
        this.isConnectedTrialService = isConnected;
    }

    @render(CascadingUIStore, (store) => store.disabledChangeTrialMode)
    renderDisabledTrialMode(disabledChangeTrialMode: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] renderDisabledTrialMode called with disabledChangeTrialMode: ${disabledChangeTrialMode}`);
        this.nodeDisabled.active = disabledChangeTrialMode;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        cascadingSlotLogger.info(`[CascadingTrialMode] handleChangeUserBalance called with changed: ${changed}`);
        return changed;
    }
}



