import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Slider, Sprite, Prefab, Node, Button } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { HyperSpinStore } from "../../stores/hyper-spin-store";
import { BetControlStore } from "../../stores/bet-control-store";
import { SliderCtrl } from "./slider-ctrl";
import HyperSpinRoundNumber from "../hyper-spin/hyper-spin-round-number";

const { ccclass, menu, property } = _decorator;
const { observer, render, handle } = Observer;

type SliderEventType = Slider | Event | any;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

@ccclass("HyperSpinBetControl")
@menu('UI/HyperSpinBetControl')
export class HyperSpinBetControl extends ObserverComponent {
    @property(SliderCtrl)
    stopOnProfitSliderCtrl: SliderCtrl = null;

    @property(SliderCtrl)
    stopOnLossSliderCtrl: SliderCtrl = null;

    @property(SliderCtrl)
    totalBetSliderCtrl: SliderCtrl = null;

    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @property(Node)
    numberOfSpinsContent: Node = null;

    @property(Label)
    stopOnProfitLabel: Label = null;

    @property(Label)
    stopOnLossLabel: Label = null;

    @property(StatusButton)
    stopOnProfitDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    stopOnProfitIncreaseBtn: StatusButton = null;

    @property(StatusButton)
    stopOnLossDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    stopOnLossIncreaseBtn: StatusButton = null;

    @property(Label)
    totalBetPerRoundLabel: Label = null;

    @property(StatusButton)
    totalBetPerRoundDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    totalBetPerRoundIncreaseBtn: StatusButton = null;

    @property(StatusButton)
    totalBetPerRoundSliderDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    totalBetPerRoundSliderIncreaseBtn: StatusButton = null;

    @property(Label)
    totalBetPerRoundSliderLabel: Label = null;

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
    sprIconStopOnFeatureOff: Sprite = null;

    @property(Sprite)
    sprIconStopOnFeatureOn: Sprite = null;

    @property(Sprite)
    sprIconSettingsOff: Sprite = null;

    @property(Sprite)
    sprIconSettingsOn: Sprite = null;

    @property(Node)
    hyperSpinControlsNode: Node = null;

    private currentDialogName: string = null;
    private isOpenBetAmountPopup = false;

    @render(HyperSpinStore, (store) => {
        return {
            roundsList: store.roundsList,
            selectedRoundOnPopup: store.selectedRoundOnPopup
        }
    })
    initContentRounds(data: { roundsList: number[]; selectedRoundOnPopup: number }) {
        const { roundsList, selectedRoundOnPopup } = data;

        this.numberOfSpinsContent.destroyAllChildren();

        roundsList.forEach((round, idx) => {
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            if (roundNumber) {
                roundNumber.setValue(round);
            }

            this.numberOfSpinsContent.addChild(node);

        });

        this.renderSelectedRounds(selectedRoundOnPopup);
    }

    @render(HyperSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.numberOfSpinsContent.children.forEach((child, idx) => {
            const roundNumber = child.getComponent(HyperSpinRoundNumber);
            if (!roundNumber) {
                return;
            }
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
        });
    }

    @render(CascadingUIStore, (store) => store.dialogOpenEvent?.name)
    private setCurrentDialog(dialogName: string) {
        this.currentDialogName = dialogName;
    }

    @render(HyperSpinStore, (store) => store.isOpenHyperSpinBetControlPopup)
    private setIsOpenHyperSpinBetControlPopup(isOpenHyperSpinBetControlPopup: boolean) {
        this.isOpenBetAmountPopup = isOpenHyperSpinBetControlPopup;
    }

    @render(HyperSpinStore, (store) => {
        return {
            isOpenHyperSpinBetControlPopup: store.isOpenHyperSpinBetControlPopup,
            roundsList: store.roundsList,
            selectedRoundOnPopup: store.selectedRoundOnPopup
        }
    })
    handleDialogVisibility(data: { isOpenHyperSpinBetControlPopup: boolean; roundsList: number[]; selectedRoundOnPopup: number }) {
        this.node.active = data.isOpenHyperSpinBetControlPopup;

        if (data.isOpenHyperSpinBetControlPopup) {
            this.initContentRounds({ roundsList: data.roundsList, selectedRoundOnPopup: data.selectedRoundOnPopup });
        }
    }

    @render(CascadingUIStore, (store) => store.dialogOpenEvent, { fireImmediately: false })
    private renderDialogOpenEvent(dialogOpenEvent: { name: string }) {
        const container = (this as any).container;
        let isInHyperSpin = false;
        try {
            if (container) {
                const cascadingUIStore = container.get(CascadingUIStore);
                isInHyperSpin = cascadingUIStore?.isHyperSpinActive || false;
            }
        } catch (error) {
        }

        if (dialogOpenEvent?.name !== DialogName.HYPER_SPIN && this.isOpenBetAmountPopup && !isInHyperSpin) {
            this.node.active = false;
            this.onCloseHyperSpinBetControl();
        }
    }

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

    @render(HyperSpinStore, (store) => store.stopOnFeature)
    updateStopOnFeatureButton(stopOnFeature: boolean) {
        if (!this.sprIconStopOnFeatureOff && !this.sprIconStopOnFeatureOn) {
            return;
        }

        if (this.sprIconStopOnFeatureOff) {
            this.sprIconStopOnFeatureOff.node.active = !stopOnFeature;
        }

        if (this.sprIconStopOnFeatureOn) {
            this.sprIconStopOnFeatureOn.node.active = stopOnFeature;
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
        if (this.hyperSpinControlsNode) {
            this.hyperSpinControlsNode.active = isSettingsOpen;
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBet() {
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            this.onClickDecreaseTotalBetPerRound();
            return;
        }
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBet() {
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            this.onClickIncreaseTotalBetPerRound();
            return;
        }
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setTotalBetFromSlider(progress))
    private handleTotalBetSliderChange(progress: number) {
        return progress;
    }

    onTotalBetChange(slider: SliderEventType) {
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            this.handleTotalBetSliderChange(slider.progress);
        }
    }

    private isTotalBetPerRoundButton(): boolean {
        const hasTotalBetPerRoundButtons = !!(this.totalBetPerRoundDecreaseBtn || this.totalBetPerRoundIncreaseBtn);
        const hasTotalBetPerRoundLabel = !!this.totalBetPerRoundLabel;

        return hasTotalBetPerRoundButtons && hasTotalBetPerRoundLabel;
    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinBetControl())
    onCloseHyperSpinBetControl() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.toggleSettings())
    onClickControlToggle() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRound() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRound() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRoundSlider() {
        this.onClickDecreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRoundSlider() {
        this.onClickIncreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnProfitFromSlider(progress))
    private handleStopOnProfitSliderChange(progress: number) {
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(true))
    onClickIncreaseStopOnProfit() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(false))
    onClickDecreaseStopOnProfit() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnLossFromSlider(progress))
    private handleStopOnLossSliderChange(progress: number) {
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(true))
    onClickIncreaseStopOnLoss() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(false))
    onClickDecreaseStopOnLoss() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(HyperSpinStore, (store) => ({
        formattedStopOnProfit: store.formattedStopOnProfit,
        sliderProgress: store.stopOnProfitSliderProgress,
        interactable: store.interactableStopOnProfit
    }))
    private renderStopOnProfit(data: {
        formattedStopOnProfit: string;
        sliderProgress: number;
        interactable: { increase: boolean; decrease: boolean };
    }) {
        this.updateStopOnProfitDisplay(data);
    }

    private updateStopOnProfitDisplay(data: {
        formattedStopOnProfit: string;
        sliderProgress: number;
        interactable: { increase: boolean; decrease: boolean };
    }) {
        if (this.stopOnProfitLabel) {
            this.stopOnProfitLabel.string = data.formattedStopOnProfit;
        }

        if (this.stopOnProfitDecreaseBtn) {
            this.stopOnProfitDecreaseBtn.interactable = data.interactable.decrease;
        }
        if (this.stopOnProfitIncreaseBtn) {
            this.stopOnProfitIncreaseBtn.interactable = data.interactable.increase;
        }

        if (this.stopOnProfitSliderCtrl) {
            const currentProgress = this.stopOnProfitSliderCtrl.progress;
            const progressDiff = Math.abs(currentProgress - data.sliderProgress);
            if (progressDiff > 0.0001) {
                this.stopOnProfitSliderCtrl.progress = data.sliderProgress;
            }
        }
    }

    onStopOnProfitSliderChange(slider: Slider | Event | any) {
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            this.handleStopOnProfitSliderChange(slider.progress);
        }
    }

    @render(HyperSpinStore, (store) => ({
        formattedStopOnLoss: store.formattedStopOnLoss,
        sliderProgress: store.stopOnLossSliderProgress,
        interactable: store.interactableStopOnLoss
    }))
    private renderStopOnLoss(data: {
        formattedStopOnLoss: string;
        sliderProgress: number;
        interactable: { increase: boolean; decrease: boolean };
    }) {
        this.updateStopOnLossDisplay(data);
    }

    private updateStopOnLossDisplay(data: {
        formattedStopOnLoss: string;
        sliderProgress: number;
        interactable: { increase: boolean; decrease: boolean };
    }) {
        if (this.stopOnLossLabel) {
            this.stopOnLossLabel.string = data.formattedStopOnLoss;
        }

        if (this.stopOnLossDecreaseBtn) {
            this.stopOnLossDecreaseBtn.interactable = data.interactable.decrease;
        }
        if (this.stopOnLossIncreaseBtn) {
            this.stopOnLossIncreaseBtn.interactable = data.interactable.increase;
        }

        if (this.stopOnLossSliderCtrl) {
            const currentProgress = this.stopOnLossSliderCtrl.progress;
            const progressDiff = Math.abs(currentProgress - data.sliderProgress);
            if (progressDiff > 0.0001) {
                this.stopOnLossSliderCtrl.progress = data.sliderProgress;
            }
        }
    }

    onStopOnLossSliderChange(slider: Slider | Event | any) {
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            this.handleStopOnLossSliderChange(slider.progress);
        }
    }

    @render(BetControlStore, (store) => store.formattedTotalBet)
    private renderHyperSpinTotalBet(formattedTotalBet: string) {
        this.updateTotalBetPerRoundDisplay(formattedTotalBet);
    }

    private updateTotalBetPerRoundDisplay(formattedValue: string) {
        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = formattedValue;
        }

        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = formattedValue;
        }
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    private updateTotalBetPerRoundButtonStatus(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        if (this.totalBetPerRoundDecreaseBtn) {
            this.totalBetPerRoundDecreaseBtn.interactable = interactableTotalBet.decrease;
        }

        if (this.totalBetPerRoundSliderDecreaseBtn) {
            this.totalBetPerRoundSliderDecreaseBtn.interactable = interactableTotalBet.decrease;
        }

        if (this.totalBetPerRoundIncreaseBtn) {
            this.totalBetPerRoundIncreaseBtn.interactable = interactableTotalBet.increase;
        }

        if (this.totalBetPerRoundSliderIncreaseBtn) {
            this.totalBetPerRoundSliderIncreaseBtn.interactable = interactableTotalBet.increase;
        }
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

    @handle(HyperSpinHandler, (handle) => handle.toggleStopOnFeature())
    onClickStopOnFeature() {
        this.playSoundClick();
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

    @render(BetControlStore, (store) => ({
        formattedTotalBet: store.formattedTotalBet,
        sliderProgress: store.totalBetSliderProgress
    }))
    private renderTotalBet(data: { formattedTotalBet: string; sliderProgress: number }) {
        this.updateTotalBetDisplay(data);
    }

    private updateTotalBetDisplay(data: { formattedTotalBet: string; sliderProgress: number }) {
        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = data.formattedTotalBet;
        }

        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = data.formattedTotalBet;
        }

        if (this.totalBetSliderCtrl) {
            const currentProgress = this.totalBetSliderCtrl.progress;
            const progressDiff = Math.abs(currentProgress - data.sliderProgress);
            if (progressDiff > 0.0001) {
                this.totalBetSliderCtrl.progress = data.sliderProgress;
            }
        }
    }
}
