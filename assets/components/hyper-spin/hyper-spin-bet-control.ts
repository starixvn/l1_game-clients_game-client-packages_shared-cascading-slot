import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node, Slider, Sprite } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { HyperSpinStore } from "../../stores/hyper-spin-store";

const { ccclass, menu, property } = _decorator;
const { observer, render, handle } = Observer;

type SliderEventType = Slider | Event | any;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

@ccclass("HyperSpinBetControl")
@menu('UI/HyperSpinBetControl')
export class HyperSpinBetControl extends ObserverComponent {
    @property(Label)
    hyperSpinRoundsLabel: Label = null;

    @property(StatusButton)
    hyperSpinRoundsDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    hyperSpinRoundsIncreaseBtn: StatusButton = null;

    @property(Label)
    balanceLabel: Label = null;

    @property(Label)
    totalWinningsLabel: Label = null;

    @property(Label)
    playerTotalWinningsLabel: Label = null;

    @property(Sprite)
    sprIconPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Sprite)
    sprIconSettingsOff: Sprite = null;

    @property(Sprite)
    sprIconSettingsOn: Sprite = null;

    @property(Node)
    settingNode: Node = null;


    @handle(HyperSpinHandler, (handle) => handle.onClickPlayButton())
    onClickPlayButton() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.pauseHyperSpinBatch())
    onClickPauseButton() {
        this.playSoundClick();
    }

    @render(HyperSpinStore, (store) => ({
        isHyperSpin: store.isHyperSpin,
        isPaused: store.currentBatchData?.summary.hyperSpinStatus === "Paused"
    }))
    updatePlayHyperSpinButton(data: { isHyperSpin: boolean; isPaused: boolean }) {
        const { isHyperSpin, isPaused } = data;

        const showPlayButton = !isHyperSpin || (isHyperSpin && isPaused);
        if (this.sprIconPlay) {
            this.sprIconPlay.node.active = showPlayButton;
            this.hyperSpinRoundsLabel.node.active = false;
        }

        const showPauseButton = isHyperSpin && !isPaused;
        if (this.sprIconPause) {
            this.sprIconPause.node.active = showPauseButton;
        }
    }

    @render(HyperSpinStore, (store) => ({
        isSettingsOpen: store.isSettingsOpen,
        hyperSpinStatus: store.currentBatchData?.summary.hyperSpinStatus
    }))
    updateSettingsButton(data: { isSettingsOpen: boolean; hyperSpinStatus: string }) {
        const { isSettingsOpen, hyperSpinStatus } = data;
        const isPlaying = hyperSpinStatus === "Playing";

        if (!this.sprIconSettingsOff && !this.sprIconSettingsOn) {
            return;
        }

        if (this.sprIconSettingsOff) {
            this.sprIconSettingsOff.node.active = !isSettingsOpen;
            const buttonOff = this.sprIconSettingsOff.node.getComponent(Button);
            if (buttonOff) {
                buttonOff.interactable = !isPlaying;
            }
        }

        if (this.sprIconSettingsOn) {
            this.sprIconSettingsOn.node.active = isSettingsOpen;
        }
    }

    @render(HyperSpinStore, (store) => store.isSettingsOpen)
    updateHyperSpinControlsVisibility(isSettingsOpen: boolean) {
        if (this.settingNode) {
            this.settingNode.active = isSettingsOpen;
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinBetControl())
    onCloseHyperSpinBetControl() {
        this.playSoundClick();
        this.node.destroy();
    }

    @handle(HyperSpinHandler, (handle) => handle.toggleSettings())
    onClickControlToggle() {
        this.playSoundClick();
    }


    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(HyperSpinStore, (store) => ({ selectedRoundOnPopup: store.selectedRoundOnPopup, isHyperSpin: store.isHyperSpin, roundsHyperSpin: store.roundsHyperSpin }))
    updateHyperSpinRoundsLabel(data: { selectedRoundOnPopup: number; isHyperSpin: boolean; roundsHyperSpin: number }) {
        if (this.hyperSpinRoundsLabel) {
            this.hyperSpinRoundsLabel.node.active = data.isHyperSpin;

            let displayText: string;

            if (data.isHyperSpin && data.roundsHyperSpin > 0) {
                const remaining = data.roundsHyperSpin;
                displayText = `${remaining}`;
            } else {
                displayText = data.selectedRoundOnPopup.toString();
            }

            this.hyperSpinRoundsLabel.string = displayText;
        }
    }

    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateTotalWinningsLabels(totalWin: string) {
        const displayValue = totalWin || "0.00";

        if (this.totalWinningsLabel) {
            this.totalWinningsLabel.string = displayValue;
        }

        if (this.playerTotalWinningsLabel) {
            this.playerTotalWinningsLabel.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        canDecrease: store.roundsList.indexOf(store.selectedRoundOnPopup) > 0,
        canIncrease: store.roundsList.indexOf(store.selectedRoundOnPopup) < store.roundsList.length - 1
    }))
    updateHyperSpinRoundsButtonsInteractable({ canDecrease, canIncrease }: { canDecrease: boolean; canIncrease: boolean }) {
        if (this.hyperSpinRoundsDecreaseBtn) {
            this.hyperSpinRoundsDecreaseBtn.interactable = canDecrease;
        }

        if (this.hyperSpinRoundsIncreaseBtn) {
            this.hyperSpinRoundsIncreaseBtn.interactable = canIncrease;
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(false))
    onClickDecreaseHyperSpinRounds() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(true))
    onClickIncreaseHyperSpinRounds() {
        this.playSoundClick();
    }

    @render(CascadingUIStore, (store) => ({ balance: store.userBalance, changedBalance: store.changeUserBalance }))
    private renderBalance(data: { balance: number; changedBalance: boolean }) {
        if (!data || !data.changedBalance) {
            return;
        }

        const value = data.balance;
        if (value === undefined || value === null) {
            return;
        }

        const formattedBalance = gc.FormatUtils.truncateFixedDecimals(value, 2).toString();
        this.balanceLabel && (this.balanceLabel.string = formattedBalance);
    }
}
