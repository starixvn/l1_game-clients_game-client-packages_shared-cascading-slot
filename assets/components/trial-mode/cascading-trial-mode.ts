import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
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
    private readonly BET_LEVEL_DEFAULT_TRIAL_MODE = 4;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
        this.nodeTrialMode.active = !isTrialMode;
        this.nodeRealMode.active = isTrialMode;
        if (isTrialMode) {
            this.isConnectedTrialService ? this.inGameTrial() : this.connectToServiceTrial();
        } else {
            this.inGame();
        }
    }

    @handle(CascadingUIHandler, (handle, isTrialMode: boolean) => handle.handleChangeMode(isTrialMode))
    onClickChangeMode() {
        this.playSoundClick();
        this.handleSymbolPreviewVisiblity(false);
        this.handleChangeUserBalance(true);
        return !this.isTrialMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return "click";
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    handleSymbolPreviewVisiblity(isVisible: boolean) {
        return isVisible;
    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler, (handle) => handle.handleTrial())
    connectToServiceTrial() {
        this.updateConnectedTrialService(true);
    }

    @render(gc.Connection.ConnectionTrialStore, (store) => store.isConnected)
    onSignedIn(isConnected: boolean) {
        isConnected && this.inGameTrial();
    }

    @handle(gc.Connection.ConnectionHandlers.InGameHandler, (handle) => handle.handleTrial())
    inGameTrial() {
        this.setInitializedGameConfigs(false);
    }

    @handle(gc.Connection.ConnectionHandlers.InGameHandler)
    inGame() {
        this.setInitializedGameConfigs(false);
    }

    @handle(CascadingUIHandler, (handler, connected: boolean) => handler.updateConnectedTrialService(connected))
    updateConnectedTrialService(connected: boolean) {
        return connected;
    }

    @render(CascadingUIStore, (store) => store.isConnectedTrialService)
    renderConnectedTrialService(isConnected: boolean) {
        this.isConnectedTrialService = isConnected;
    }

    @handle(gc.GameConfigs.GameConfigHandlers, (handler, connected: boolean) => handler.setInitializedGameConfigs(connected))
    setInitializedGameConfigs(initialized: boolean) {
        return initialized;
    }

    @render(CascadingUIStore, (store) => store.disabledChangeTrialMode)
    renderDisabledTrialMode(disabledChangeTrialMode: boolean) {
        this.nodeDisabled.active = disabledChangeTrialMode;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        return changed;
    }
}
