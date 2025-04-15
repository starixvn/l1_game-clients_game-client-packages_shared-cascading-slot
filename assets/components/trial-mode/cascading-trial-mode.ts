import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingSlotState } from "../../cascading-slot-state";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { CascadingUIHandler } from "../../main-ui";
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
        this.handleCurrentBetLevelIndex(0);
        this.handleCurrentCoinIndex(0);
        this.handleCurrentTotalBetIndex(0);
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

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentBetLevelIndex(index))
    private handleCurrentBetLevelIndex(currentBetLevelIndex: number) {
        return currentBetLevelIndex;
    }

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentCoinIndex(index))
    private handleCurrentCoinIndex(currentCoinIndex: number) {
        return currentCoinIndex;
    }

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentTotalBetIndex(index))
    private handleCurrentTotalBetIndex(currentTotalBetIndex: number) {
        return currentTotalBetIndex;
    }

    @render(CascadingUIStore, (store) => store.cascadingState)
    renderDisabledTrialMode(cascadingState: string) {
        this.nodeDisabled.active = cascadingState === CascadingSlotState.SPINNING;
    }
}
