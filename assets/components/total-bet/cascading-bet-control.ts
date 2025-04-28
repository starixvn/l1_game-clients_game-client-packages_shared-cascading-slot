import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { BetControlStore } from "../../stores/bet-control-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

export type BetMultiplier = {
    coinValues: number[];
    betLevels: number[];
    betMultiplier: number;
    defaultCoinValue: number;
};

enum OrderButtonNode {
    betDecrease = 0,
    betIncrease,
    coinDecrease,
    coinIncrease,
    totalDecrease,
    totalIncrease,
}

type BetControl = {
    coin: number;
    level: number;
    multiplier: number;
};

@ccclass("CascadingBetControl")
export class CascadingBetControl extends ObserverComponent {
    @property(Label)
    betLevel: Label = null;

    @property(Label)
    coinValue: Label = null;

    @property(Label)
    totalBet: Label = null;

    @property(StatusButton)
    nodeButtons: StatusButton[] = [];

    private isTrialMode = false;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    private setTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
    }

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup)
    handleDialogVisibility(status: boolean) {
        this.node.active = status;
    }

    @render(BetControlStore, (store) => store.totalBet)
    private renderTotalBet(totalBet: number) {
        this.totalBet.string = totalBet.toString();
    }

    @render(BetControlStore, (store) => store.betLevel)
    private renderBetLevel(betLevel: number) {
        this.betLevel.string = betLevel.toString();
    }

    @render(BetControlStore, (store) => store.coinValue)
    private renderCoinValue(coinValue: number) {
        this.coinValue.string = coinValue.toString();
    }

    @handle(BetControlHandlers, (handle, status: boolean) => handle.updateStatusBetAmountPopup())
    onCloseBetControl() {}

    @handle(BetControlHandlers, (handle) => handle.changeBetLevel(false))
    protected onClickDecreaseBetLevel() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeBetLevel(true))
    protected onClickIncreaseBetLevel() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeCoinValue(false))
    protected onClickDecreaseCoinValue() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeCoinValue(true))
    protected onClickIncreaseCoinValue() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBet() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBet() {
        this.playSoundClick();
    }

    @render(BetControlStore, (store) => store.interactableBetLevel)
    private updateLevelButtonStatus(interactableBetLevel: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.betIncrease].interactable = interactableBetLevel.increase;
        this.nodeButtons[OrderButtonNode.betDecrease].interactable = interactableBetLevel.decrease;
    }

    @render(BetControlStore, (store) => store.interactableCoinValue)
    private updateCoinButtonStatus(interactableCoinValue: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.coinIncrease].interactable = interactableCoinValue.increase;
        this.nodeButtons[OrderButtonNode.coinDecrease].interactable = interactableCoinValue.decrease;
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    private updateTotalBetButtonStatus(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.totalIncrease].interactable = interactableTotalBet.increase;
        this.nodeButtons[OrderButtonNode.totalDecrease].interactable = interactableTotalBet.decrease;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
