import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { GAME_NAME } from "db://assets/game/scripts/game-settings";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Shared } = gc;
const { utils } = Shared;

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

    onLoad() {
        super.onLoad();
        this.trackOnLoadEvents();
    }

    trackOnLoadEvents() {
        utils.AnalyticsManager.trackEvent(gc.Shared.utils.TrackingEvent.Button, {
            location: GAME_NAME,
            action: gc.Shared.utils.TrackingAction.Show,
            object_name: "TrialMode",
            game_name: GAME_NAME,
        });
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
        this.nodeTrialMode.active = !isTrialMode;
        this.nodeRealMode.active = isTrialMode;
        if (isTrialMode) {
            this.isConnectedTrialService ? this.inGameTrial() : this.connectToServiceTrial();
        }
    }

    @handle(CascadingUIHandler, (handle, isTrialMode: boolean) => handle.handleChangeMode(isTrialMode))
    onClickChangeMode() {
        this.playSoundClick();
        this.handleSymbolPreviewVisiblity(false);
        this.handleChangeUserBalance(true);
        utils.AnalyticsManager.trackEvent(gc.Shared.utils.TrackingEvent.Button, {
            location: GAME_NAME,
            action: this.isTrialMode ? gc.Shared.utils.TrackingAction.ToggleOn : gc.Shared.utils.TrackingAction.ToggleOff,
            object_name: "TrialMode",
            game_name: GAME_NAME,
        });
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
    inGameTrial() {}

    @handle(CascadingUIHandler, (handler, connected: boolean) => handler.updateConnectedTrialService(connected))
    updateConnectedTrialService(connected: boolean) {
        return connected;
    }

    @render(CascadingUIStore, (store) => store.isConnectedTrialService)
    renderConnectedTrialService(isConnected: boolean) {
        this.isConnectedTrialService = isConnected;
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
