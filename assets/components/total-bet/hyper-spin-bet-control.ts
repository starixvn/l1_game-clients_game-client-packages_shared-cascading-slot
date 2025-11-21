import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Slider, Sprite, Prefab, Node, Component } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";
import { DialogName } from "../../cascading-slot-utils";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { HyperSpinStore } from "../../stores/hyper-spin-store";
import { BetControlStore } from "../../stores/bet-control-store";
import { SliderCtrl } from "./slider-ctrl";
import HyperSpinRoundNumber from "../hyper-spin/hyper-spin-round-number";
import HyperSpinRecordBodyItem from "../hyper-spin/hyper-spin-record-body-item";
import { HyperSpinBatchData } from "../../stores/hyper-spin-store";

const { ccclass, menu, property } = _decorator;
const { observer, render, handle } = Observer;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

@ccclass("HyperSpinBetControl")
@menu('UI/HyperSpinBetControl')
export class HyperSpinBetControl extends ObserverComponent {
    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @property(Node)
    numberOfSpinsContent: Node = null;

    @property(Prefab)
    prfHyperSpinRecordBodyItem: Prefab = null;

    @property(Node)
    hyperSpinRecordBodyContentNode: Node = null;

    @property(Label)
    startingBalanceLabel: Label = null;

    @property(Label)
    endBalanceLabel: Label = null;

    @property(Label)
    stopOnProfitLabel: Label = null;

    @property(Label)
    stopOnLossLabel: Label = null;

    @property(SliderCtrl)
    stopOnProfitSliderCtrl: SliderCtrl = null;

    @property(SliderCtrl)
    stopOnLossSliderCtrl: SliderCtrl = null;

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

    @property(Label)
    hyperTotalWinValue: Label = null;

    @property(Label)
    lblTotalBetValue: Label = null;

    @property(StatusButton)
    hyperSpinRoundsDecreaseBtn: StatusButton = null;

    @property(StatusButton)
    hyperSpinRoundsIncreaseBtn: StatusButton = null;

    @property(Label)
    balanceLabel: Label = null;

    // @property(Label)
    // totalBetLabel: Label = null;

    @property(Label)
    totalWinningsLabel: Label = null;

    @property(Label)
    playerTotalWinningsLabel: Label = null;

    @property(Sprite)
    sprIconPlay: Sprite = null;

    @property(Sprite)
    sprIconBgPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Sprite)
    sprIconBgPause: Sprite = null;

    @property(Sprite)
    sprIconStopOnFeatureOff: Sprite = null;

    @property(Sprite)
    sprIconStopOnFeatureOn: Sprite = null;

    @property(StatusButton)
    controlToggleButton: StatusButton = null;

    @property(Node)
    hyperSpinControlsNode: Node = null;

    private currentDialogName: string = null;
    private isOpenBetAmountPopup: boolean = false;

    onLoad() {
        super.onLoad();
    }

    start() {
        // Initialize content rounds in start() - runs after onLoad when component is fully initialized

        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store && store.roundsList && Array.isArray(store.roundsList) && store.roundsList.length > 0) {
                    this.initContentRounds(store.roundsList);
                } else {
                }
            } catch (error) {
            }
        } else {
        }
    }

    @render(HyperSpinStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        // Validate inputs
        if (!roundsList || !Array.isArray(roundsList) || roundsList.length === 0) {
            return;
        }

        if (!this.numberOfSpinsContent) {
            return;
        }

        if (!this.prfNoOfRound) {
            return;
        }

        this.numberOfSpinsContent.destroyAllChildren();

        roundsList.forEach((round, idx) => {
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            if (roundNumber) {
                roundNumber.setValue(round);
            } else {
            }

            this.numberOfSpinsContent.addChild(node);

        });

        // Ensure default selection (100) is applied after initialization
        // Get current selectedRoundOnPopup from store and render selection
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store && store.selectedRoundOnPopup) {
                    const defaultSelectedRound = store.selectedRoundOnPopup;
                    this.renderSelectedRounds(defaultSelectedRound);
                } else {
                    // Fallback to 100 if store value is not available
                    this.renderSelectedRounds(100);
                }
            } catch (error) {
                // Fallback to 100 if store access fails
                this.renderSelectedRounds(100);
            }
        } else {
            // Fallback to 100 if container is not available
            this.renderSelectedRounds(100);
        }
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

    /**
     * Initialize hyper-spin records content by creating record items for each spin
     * This method destroys all children and recreates them (used for initial setup or reset)
     */
    private initHyperSpinRecords(spins: HyperSpinBatchData['spins']) {
        if (!spins || !Array.isArray(spins) || spins.length === 0) {
            return;
        }

        if (!this.hyperSpinRecordBodyContentNode) {
            return;
        }

        if (!this.prfHyperSpinRecordBodyItem) {
            return;
        }

        this.hyperSpinRecordBodyContentNode.destroyAllChildren();

        spins.forEach((spin, idx) => {
            // 1. Instantiate prefab (same pattern as prfNoOfRound)
            const node = instantiate(this.prfHyperSpinRecordBodyItem);

            // 2. Get component (same pattern as prfNoOfRound)
            const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

            if (recordBodyItem) {
                // 3. Assign data (same pattern as prfNoOfRound.setValue)
                // Map spin data to the component
                // 2.1: assign spin.spinId to lbl-spin-value
                // 2.2: assign spin.spinWinAmount to lbl-win-value
                // 2.3: assign spin.spinBalance to lbl-balance
                // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
                const spinData = {
                    spinId: spin.spinId as string | number,
                    spinWinAmount: spin.spinWinAmount || "0.00",
                    spinBalance: spin.spinBalance || "0.00",
                    spinWinMultiplier: spin.spinWinMultiplier || "0.00x"
                };

                recordBodyItem.setSpinData(spinData);

            } else {
            }

            // 4. Append to parent (same pattern as prfNoOfRound)
            this.hyperSpinRecordBodyContentNode.addChild(node);

        });

    }

    /**
     * Append new spin records incrementally without destroying existing records
     * This method only adds new spins that haven't been rendered yet
     */
    private appendNewSpinRecords(spins: HyperSpinBatchData['spins']) {
        if (!spins || !Array.isArray(spins)) {
            return;
        }

        if (!this.hyperSpinRecordBodyContentNode) {
            return;
        }

        if (!this.prfHyperSpinRecordBodyItem) {
            return;
        }

        const currentChildrenCount = this.hyperSpinRecordBodyContentNode.children?.length || 0;
        const newSpinsCount = spins.length - currentChildrenCount;

        // Only append new spins that haven't been rendered yet
        if (newSpinsCount > 0) {
            // Get the spins that need to be added (the ones after the current children count)
            const spinsToAdd = spins.slice(currentChildrenCount);

            spinsToAdd.forEach((spin, idx) => {
                const actualIndex = currentChildrenCount + idx;

                // 1. Instantiate prefab (same pattern as prfNoOfRound)
                const node = instantiate(this.prfHyperSpinRecordBodyItem);

                // 2. Get component (same pattern as prfNoOfRound)
                const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

                if (recordBodyItem) {
                    // 3. Assign data (same pattern as prfNoOfRound.setValue)
                    // Map spin data to the component
                    // 2.1: assign spin.spinId to lbl-spin-value
                    // 2.2: assign spin.spinWinAmount to lbl-win-value
                    // 2.3: assign spin.spinBalance to lbl-balance
                    // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
                    const spinData = {
                        spinId: spin.spinId as string | number,
                        spinWinAmount: spin.spinWinAmount || "0.00",
                        spinBalance: spin.spinBalance || "0.00",
                        spinWinMultiplier: spin.spinWinMultiplier || "0.00x"
                    };

                    recordBodyItem.setSpinData(spinData);

                } else {
                }

                // 4. Append to parent (same pattern as prfNoOfRound)
                this.hyperSpinRecordBodyContentNode.addChild(node);

            });

        } else if (newSpinsCount < 0) {
            // If spins array is shorter than current children, reset and rebuild
            this.initHyperSpinRecords(spins);
        } else {
        }
    }

    /**
     * Render hyper-spin records when the batch data spins change
     * Uses observer pattern similar to TotalBet/TotalWin updates
     * Appends new records incrementally instead of recreating all records
     * Observes spinsLength computed property to detect when spins are added
     */
    @render(HyperSpinStore, (store) => {
        // Access spinsLength computed property and currentBatchData to ensure MobX tracks changes
        const spinsLength = store.spinsLength;
        const batchData = store.currentBatchData;
        return batchData ? { batchData, spinsLength } : null;
    })
    private renderHyperSpinRecords(data: { batchData: HyperSpinBatchData; spinsLength: number } | null) {
        const spins = data?.batchData?.spins;

        if (spins && Array.isArray(spins)) {
            const currentChildrenCount = this.hyperSpinRecordBodyContentNode?.children?.length || 0;

            // If no children exist yet, initialize all records
            // Otherwise, append only new spins incrementally
            if (currentChildrenCount === 0) {
                this.initHyperSpinRecords(spins);
            } else {
                this.appendNewSpinRecords(spins);
            }
        } else {

            // Clear records if no spins
            if (this.hyperSpinRecordBodyContentNode) {
                this.hyperSpinRecordBodyContentNode.destroyAllChildren();
            }
        }

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
            roundsList: store.roundsList
        }
    })
    handleDialogVisibility(data: { isOpenHyperSpinBetControlPopup: boolean; roundsList: number[] }) {

        // Handle hyper spin bet control visibility
        this.node.active = data.isOpenHyperSpinBetControlPopup;

        // Initialize content rounds when component becomes active (fallback if @render didn't fire)
        if (data.isOpenHyperSpinBetControlPopup) {
            const childrenCount = this.numberOfSpinsContent?.children?.length || 0;

            this.initContentRounds(data.roundsList);
            // this.renderSelectedRounds(data.selectedRoundOnPopup);
            if (childrenCount === 0) {
                const container = (this as any).container;

                if (container) {
                    try {
                        const store = container.get(HyperSpinStore);

                        if (store && data.roundsList && Array.isArray(data.roundsList) && data.roundsList.length > 0) {
                            this.initContentRounds(data.roundsList);
                        } else {
                        }
                    } catch (error) {
                    }
                } else {
                }
            } else {
            }
        }

    }

    @render(CascadingUIStore, (store) => store.dialogOpenEvent, { fireImmediately: false })
    private renderDialogOpenEvent(dialogOpenEvent: { name: string }) {
        // Handle dialog close events - hide bet control when HYPER_SPIN dialog closes
        // But keep it open during hyper-spin execution for progress monitoring
        const container = (this as any).container;
        let isInHyperSpin = false;
        try {
            if (container) {
                const cascadingUIStore = container.get(CascadingUIStore);
                isInHyperSpin = cascadingUIStore?.isHyperSpinActive || false;
            } else {
            }
        } catch (error) {
        }

        // Only close the popup if we're not in hyper-spin mode
        if (dialogOpenEvent?.name !== DialogName.HYPER_SPIN && this.isOpenBetAmountPopup && !isInHyperSpin) {
            this.node.active = false;
            this.onCloseHyperSpinBetControl();
        } else if (isInHyperSpin) {
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

        // Control play icon and background together
        // Show play button when not hyper-spinning OR when hyper-spinning but paused (resume)
        const showPlayButton = !isHyperSpin || (isHyperSpin && isPaused);
        if (this.sprIconPlay) {
            this.sprIconPlay.node.active = showPlayButton;
        }

        if (this.sprIconBgPlay) {
            this.sprIconBgPlay.node.active = showPlayButton;
        }

        // Control pause icon and background together
        // Show pause button only when hyper-spinning AND not paused
        const showPauseButton = isHyperSpin && !isPaused;
        if (this.sprIconPause) {
            this.sprIconPause.node.active = showPauseButton;
        }

        if (this.sprIconBgPause) {
            this.sprIconBgPause.node.active = showPauseButton;
        }

    }

    @handle(HyperSpinHandler, (handle) => handle.toggleStopOnFeature())
    onClickStopOnFeature() {
        this.playSoundClick();
    }

    @render(HyperSpinStore, (store) => store.stopOnFeature)
    updateStopOnFeatureButton(stopOnFeature: boolean) {

        if (!this.sprIconStopOnFeatureOff && !this.sprIconStopOnFeatureOn) {
            return;
        }

        if (this.sprIconStopOnFeatureOff) {
            this.sprIconStopOnFeatureOff.node.active = !stopOnFeature;
        } else {
        }

        if (this.sprIconStopOnFeatureOn) {
            this.sprIconStopOnFeatureOn.node.active = stopOnFeature;
        } else {
        }

    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBet(customEventData?: string) {
        // Check if customEventData indicates this is a total-bet-per-round button
        if (customEventData === "total-bet-per-round") {
            this.onClickDecreaseTotalBetPerRound();
            return;
        }

        // Check if this button is in the total-bet-per-round section
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            this.onClickDecreaseTotalBetPerRound();
            return;
        }
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBet(customEventData?: string) {
        // Check if customEventData indicates this is a total-bet-per-round button
        if (customEventData === "total-bet-per-round") {
            this.onClickIncreaseTotalBetPerRound();
            return;
        }

        // Check if this button is in the total-bet-per-round section
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            this.onClickIncreaseTotalBetPerRound();
            return;
        }
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setTotalBetFromSlider(progress))
    private handleTotalBetSliderChange(progress: number) {
        // This method is called by the @handle decorator
        return progress;
    }

    /**
     * Handle total bet slider change
     * Called when the slider is dragged or when buttons are clicked
     * @param slider - The slider component or event
     * @param customEventData - Optional custom event data to identify button clicks
     */
    onTotalBetChange(slider: Slider | Event | any, customEventData?: string) {
        // This is called when the slider is dragged OR when buttons are clicked (prefab connects buttons here)
        // If slider is a Slider object, it's from the slider drag
        // If it's an Event or undefined, it's from a button click
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            // Slider drag event - slider is a Slider component with valid progress
            this.handleTotalBetSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            if (isIncrease) {
                // Call handler directly for increase
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeTotalBet(true);
                        }
                    } catch (error) {
                    }
                }
            } else if (isDecrease) {
                // Call handler directly for decrease
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeTotalBet(false);
                        }
                    } catch (error) {
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
            }
        }
    }

    /**
     * Check if the current button click is from a total-bet-per-round button
     * by checking if we have total-bet-per-round buttons assigned and checking node hierarchy
     */
    private isTotalBetPerRoundButton(): boolean {
        // First, check if total-bet-per-round buttons are assigned
        const hasTotalBetPerRoundButtons = !!(this.totalBetPerRoundDecreaseBtn || this.totalBetPerRoundIncreaseBtn);
        const hasTotalBetPerRoundLabel = !!this.totalBetPerRoundLabel;

        // Search for total-bet-per-round container in children (buttons would be children/grandchildren)
        const findTotalBetPerRoundContainer = (node: any, depth: number = 0): boolean => {
            if (depth > 20) return false; // Prevent infinite loops

            if (!node) return false;

            if (node.name) {
                // Check if this node is the total-bet-per-round container
                if (node.name === "total-bet-per-round" || (node.name.includes("total-bet-per-round") && !node.name.includes("total-bet-value") && !node.name.includes("bet-value"))) {
                    return true;
                }
            }

            // Check children recursively
            if (node.children && node.children.length > 0) {
                for (let i = 0; i < node.children.length; i++) {
                    if (findTotalBetPerRoundContainer(node.children[i], depth + 1)) {
                        return true;
                    }
                }
            }

            return false;
        };

        // Search in children of this component's node
        const found = findTotalBetPerRoundContainer(this.node);

        const result = found || (hasTotalBetPerRoundButtons && hasTotalBetPerRoundLabel);

        return result;
    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinBetControl())
    onCloseHyperSpinBetControl() {
        this.playSoundClick();
    }

    onClickControlToggle() {
        this.playSoundClick();

        if (this.hyperSpinControlsNode) {
            const newActiveState = !this.hyperSpinControlsNode.active;
            this.hyperSpinControlsNode.active = newActiveState;
        } else {
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.showHyperSpinBetControl())
    onClickTotalBetPerRoundLabel() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRound() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(BetControlStore);
                if (store) {
                    // Access totalBet to trigger MobX reaction
                    const value = store.totalBet;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRound() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(BetControlStore);
                if (store) {
                    // Access totalBet to trigger MobX reaction
                    const value = store.totalBet;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRoundSlider() {
        // Call the same handler as regular decrease button
        this.onClickDecreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRoundSlider() {
        // Call the same handler as regular increase button
        this.onClickIncreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(false))
    onClickDecreaseHyperSpinRounds() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access selectedRoundOnPopup to trigger MobX reaction
                    const value = store.selectedRoundOnPopup;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(true))
    onClickIncreaseHyperSpinRounds() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access selectedRoundOnPopup to trigger MobX reaction
                    const value = store.selectedRoundOnPopup;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnProfitFromSlider(progress))
    private handleStopOnProfitSliderChange(progress: number) {
        // This method is called by the @handle decorator
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(true))
    onClickIncreaseStopOnProfit() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnProfit to trigger MobX reaction
                    const value = store.stopOnProfit;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(false))
    onClickDecreaseStopOnProfit() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnProfit to trigger MobX reaction
                    const value = store.stopOnProfit;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnLossFromSlider(progress))
    private handleStopOnLossSliderChange(progress: number) {
        // This method is called by the @handle decorator
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(true))
    onClickIncreaseStopOnLoss() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnLoss to trigger MobX reaction
                    const value = store.stopOnLoss;
                }
            } catch (error) {
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(false))
    onClickDecreaseStopOnLoss() {
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnLoss to trigger MobX reaction
                    const value = store.stopOnLoss;
                }
            } catch (error) {
            }
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }

    @render(HyperSpinStore, (store) => ({ stopOnProfit: store.stopOnProfit, maxStopOnProfit: store.maxStopOnProfit }))
    private renderStopOnProfit(data: { stopOnProfit: number; maxStopOnProfit: number }) {
        this.updateStopOnProfitDisplay(data.stopOnProfit, data.maxStopOnProfit);
    }

    private getCurrentStopOnProfit(): number {
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    return store.stopOnProfit;
                }
            } catch (error) {
                // Ignore error
            }
        }
        return 0;
    }

    private updateStopOnProfitDisplay(stopOnProfit: number, maxStopOnProfit?: number) {
        // Get min/max from store (these are computed properties that depend on totalBet)
        const minStopOnProfit = 0; // Always 0
        const finalMaxStopOnProfit = maxStopOnProfit ?? this.getMaxStopOnProfit(); // Use passed value or calculate

        // Update button states
        this.updateStopOnProfitButtonStates(stopOnProfit, minStopOnProfit, finalMaxStopOnProfit);

        // Update label with null check
        if (this.stopOnProfitLabel) {
            this.stopOnProfitLabel.string = gc.FormatUtils.numberWithCommas(stopOnProfit, 2, true);
        } else {
        }

        // Find the slider - try multiple methods (only search for stop-on-profit slider)
        let slider: Slider = null;

        // Method 1: Try stopOnProfitSliderCtrl if assigned
        if (this.stopOnProfitSliderCtrl) {
            slider = this.stopOnProfitSliderCtrl.getComponent(Slider);
            if (slider) {
            }
        }

        // Method 2: Try to find slider node by name (specific to stop-on-profit)
        if (!slider) {
            const sliderNode = this.node.getChildByName("stop-on-profit-slider");
            if (sliderNode) {
                slider = sliderNode.getComponent(Slider);
                if (slider) {
                }
            }
        }

        // Method 3: Search within stop-on-profit container only (find parent container first)
        if (!slider) {
            // First, try to find the parent container for stop-on-profit
            const findProfitContainer = (node: any): any => {
                if (node.name && (node.name.includes("stop-on-profit") || node.name === "stop-on-profit")) {
                    return node;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findProfitContainer(node.children[i]);
                    if (found) return found;
                }
                return null;
            };
            const profitContainer = findProfitContainer(this.node);
            if (profitContainer) {
                // Now search for slider only within this container
                const findSliderInContainer = (node: any): Slider => {
                    const sliderComp = node.getComponent(Slider);
                    if (sliderComp) {
                        return sliderComp;
                    }
                    for (let i = 0; i < node.children.length; i++) {
                        const found = findSliderInContainer(node.children[i]);
                        if (found) return found;
                    }
                    return null;
                };
                slider = findSliderInContainer(profitContainer);
                if (slider) {
                }
            }
        }

        if (slider) {
            this.updateSliderProgress(slider, stopOnProfit, minStopOnProfit, finalMaxStopOnProfit);
        } else {
        }
    }

    private updateStopOnProfitButtonStates(stopOnProfit: number, minStopOnProfit: number, maxStopOnProfit: number) {
        // Update decrease button - enabled when stopOnProfit > minStopOnProfit (0)
        const canDecrease = stopOnProfit > minStopOnProfit;
        if (this.stopOnProfitDecreaseBtn) {
            this.stopOnProfitDecreaseBtn.interactable = canDecrease;
        } else {
            // Try to find button by searching children if not assigned
            const findButtonByName = (node: any, name: string): StatusButton => {
                if (node.name === name || node.name.includes(name)) {
                    const btn = node.getComponent(StatusButton);
                    if (btn) return btn;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findButtonByName(node.children[i], name);
                    if (found) return found;
                }
                return null;
            };
            const decreaseBtn = findButtonByName(this.node, "decrease");
            if (decreaseBtn) {
                decreaseBtn.interactable = canDecrease;
            }
        }

        // Update increase button - enabled when stopOnProfit < maxStopOnProfit
        const canIncrease = stopOnProfit < maxStopOnProfit;
        if (this.stopOnProfitIncreaseBtn) {
            this.stopOnProfitIncreaseBtn.interactable = canIncrease;
        } else {
            // Try to find button by searching children if not assigned
            const findButtonByName = (node: any, name: string): StatusButton => {
                if (node.name === name || node.name.includes(name)) {
                    const btn = node.getComponent(StatusButton);
                    if (btn) return btn;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findButtonByName(node.children[i], name);
                    if (found) return found;
                }
                return null;
            };
            const increaseBtn = findButtonByName(this.node, "increase");
            if (increaseBtn) {
                increaseBtn.interactable = canIncrease;
            }
        }
    }

    private updateSliderProgress(slider: Slider, stopOnProfit: number, minStopOnProfit: number, maxStopOnProfit: number) {
        // Convert actual value to slider progress (0-1)
        const progress = maxStopOnProfit > minStopOnProfit ? (stopOnProfit - minStopOnProfit) / (maxStopOnProfit - minStopOnProfit) : 0;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const currentProgress = slider.progress;
        const progressDiff = Math.abs(currentProgress - clampedProgress);

        // Log the calculated slider percentage
        const sliderPercentage = (clampedProgress * 100).toFixed(2);

        // Update slider progress - always update to ensure it's in sync
        if (progressDiff > 0.0001) {
            slider.progress = clampedProgress;
        } else {
        }
    }

    private getMaxStopOnProfit(): number {
        // Fallback: Try container approach
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    const maxStopOnProfit = store.maxStopOnProfit;
                    const maxWinPerRound = store.configStore?.gameConfigs?.maxWinPerRound ?? 0;
                    const currentTotalBet = store.totalBet;
                    return maxStopOnProfit;
                }
            } catch (error) {
            }
        }

        return 0;
    }

    onStopOnProfitSliderChange(slider: Slider | Event | any, customEventData?: string) {
        // This is called when the slider is dragged OR when buttons are clicked (prefab connects buttons here)
        // If slider is a Slider object, it's from the slider drag
        // If it's an Event or undefined, it's from a button click
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            // Slider drag event - slider is a Slider component with valid progress
            this.handleStopOnProfitSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            // If not set, we need to update the prefab to set it
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            if (isIncrease) {
                // Call handler directly for increase
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeStopOnProfit(true);
                        }
                    } catch (error) {
                    }
                }
            } else if (isDecrease) {
                // Call handler directly for decrease
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeStopOnProfit(false);
                        }
                    } catch (error) {
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
                // For now, we'll show a warning and do nothing
                // The prefab should be updated to:
                // 1. Set customEventData to "increase" for increase button
                // 2. Set customEventData to "decrease" for decrease button
                // OR connect buttons directly to onClickIncreaseStopOnProfit/onClickDecreaseStopOnProfit
            }
        }
    }

    @render(HyperSpinStore, (store) => ({ stopOnLoss: store.stopOnLoss, maxStopOnLoss: store.maxStopOnLoss }))
    @render(BetControlStore, (store) => store.totalBet)
    private renderStopOnLoss(stopOnLossData: { stopOnLoss: number; maxStopOnLoss: number }, totalBet: number) {
        this.updateStopOnLossDisplay(stopOnLossData.stopOnLoss, stopOnLossData.maxStopOnLoss);
    }

    private getCurrentStopOnLoss(): number {
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    return store.stopOnLoss;
                }
            } catch (error) {
                // Ignore error
            }
        }
        return 0;
    }

    private updateStopOnLossDisplay(stopOnLoss: number, maxStopOnLoss?: number) {
        // Get min/max from store (these are computed properties that depend on userBalance)
        const minStopOnLoss = 0; // Always 0
        const finalMaxStopOnLoss = maxStopOnLoss ?? this.getMaxStopOnLoss(); // Use passed value or calculate

        // Update button states
        this.updateStopOnLossButtonStates(stopOnLoss, minStopOnLoss, finalMaxStopOnLoss);

        // Update label with null check
        if (this.stopOnLossLabel) {
            this.stopOnLossLabel.string = gc.FormatUtils.numberWithCommas(stopOnLoss, 2, true);
        } else {
        }

        // Find the slider - try multiple methods (only search for stop-on-loss slider)
        let slider: Slider = null;

        // Method 1: Try stopOnLossSliderCtrl if assigned
        if (this.stopOnLossSliderCtrl) {
            slider = this.stopOnLossSliderCtrl.getComponent(Slider);
            if (slider) {
            }
        }

        // Method 2: Try to find slider node by name (specific to stop-on-loss)
        if (!slider) {
            const sliderNode = this.node.getChildByName("stop-on-loss-slider");
            if (sliderNode) {
                slider = sliderNode.getComponent(Slider);
                if (slider) {
                }
            }
        }

        // Method 3: Search within stop-on-loss container only (find parent container first)
        if (!slider) {
            // First, try to find the parent container for stop-on-loss
            const findLossContainer = (node: any): any => {
                if (node.name && (node.name.includes("stop-on-loss") || node.name === "stop-on-loss")) {
                    return node;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findLossContainer(node.children[i]);
                    if (found) return found;
                }
                return null;
            };
            const lossContainer = findLossContainer(this.node);
            if (lossContainer) {
                // Now search for slider only within this container
                const findSliderInContainer = (node: any): Slider => {
                    const sliderComp = node.getComponent(Slider);
                    if (sliderComp) {
                        return sliderComp;
                    }
                    for (let i = 0; i < node.children.length; i++) {
                        const found = findSliderInContainer(node.children[i]);
                        if (found) return found;
                    }
                    return null;
                };
                slider = findSliderInContainer(lossContainer);
                if (slider) {
                }
            }
        }

        if (slider) {
            this.updateStopOnLossSliderProgress(slider, stopOnLoss, minStopOnLoss, finalMaxStopOnLoss);
        } else {
        }
    }

    private updateStopOnLossButtonStates(stopOnLoss: number, minStopOnLoss: number, maxStopOnLoss: number) {
        // Update decrease button - enabled when stopOnLoss > minStopOnLoss (0)
        const canDecrease = stopOnLoss > minStopOnLoss;
        if (this.stopOnLossDecreaseBtn) {
            this.stopOnLossDecreaseBtn.interactable = canDecrease;
        } else {
            // Try to find button by searching children if not assigned
            const findButtonByName = (node: any, name: string): StatusButton => {
                if (node.name === name || node.name.includes(name)) {
                    const btn = node.getComponent(StatusButton);
                    if (btn) return btn;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findButtonByName(node.children[i], name);
                    if (found) return found;
                }
                return null;
            };
            const decreaseBtn = findButtonByName(this.node, "decrease-stop-on-loss");
            if (decreaseBtn) {
                decreaseBtn.interactable = canDecrease;
            }
        }

        // Update increase button - enabled when stopOnLoss < maxStopOnLoss
        const canIncrease = stopOnLoss < maxStopOnLoss;
        if (this.stopOnLossIncreaseBtn) {
            this.stopOnLossIncreaseBtn.interactable = canIncrease;
        } else {
            // Try to find button by searching children if not assigned
            const findButtonByName = (node: any, name: string): StatusButton => {
                if (node.name === name || node.name.includes(name)) {
                    const btn = node.getComponent(StatusButton);
                    if (btn) return btn;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findButtonByName(node.children[i], name);
                    if (found) return found;
                }
                return null;
            };
            const increaseBtn = findButtonByName(this.node, "increase-stop-on-loss");
            if (increaseBtn) {
                increaseBtn.interactable = canIncrease;
            }
        }
    }

    private updateStopOnLossSliderProgress(slider: Slider, stopOnLoss: number, minStopOnLoss: number, maxStopOnLoss: number) {
        // Convert actual value to slider progress (0-1)
        const progress = maxStopOnLoss > minStopOnLoss ? (stopOnLoss - minStopOnLoss) / (maxStopOnLoss - minStopOnLoss) : 0;
        const clampedProgress = Math.max(0, Math.min(1, progress));
        const currentProgress = slider.progress;
        const progressDiff = Math.abs(currentProgress - clampedProgress);

        // Log the calculated slider percentage
        const sliderPercentage = (clampedProgress * 100).toFixed(2);

        // Update slider progress - always update to ensure it's in sync
        if (progressDiff > 0.0001) {
            slider.progress = clampedProgress;
        } else {
        }
    }

    private getMaxStopOnLoss(): number {
        // Fallback: Try container approach
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    const maxStopOnLoss = store.maxStopOnLoss;
                    const userBalance = store.cascadingUIStore?.userBalance ?? 0;
                    return maxStopOnLoss;
                }
            } catch (error) {
            }
        }

        return 0;
    }

    onStopOnLossSliderChange(slider: Slider | Event | any, customEventData?: string) {
        // This is called when the slider is dragged OR when buttons are clicked (prefab connects buttons here)
        // If slider is a Slider object, it's from the slider drag
        // If it's an Event or undefined, it's from a button click
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            // Slider drag event - slider is a Slider component with valid progress
            this.handleStopOnLossSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            // If not set, we need to update the prefab to set it
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            if (isIncrease) {
                // Call handler directly for increase
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeStopOnLoss(true);
                        }
                    } catch (error) {
                    }
                }
            } else if (isDecrease) {
                // Call handler directly for decrease
                const container = (this as any).container;
                if (container) {
                    try {
                        const handler = container.get(HyperSpinHandler);
                        if (handler) {
                            handler.changeStopOnLoss(false);
                        }
                    } catch (error) {
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
                // For now, we'll show a warning and do nothing
                // The prefab should be updated to:
                // 1. Set customEventData to "increase" for increase button
                // 2. Set customEventData to "decrease" for decrease button
                // OR connect buttons directly to onClickIncreaseStopOnLoss/onClickDecreaseStopOnLoss
            }
        }
    }

    @render(BetControlStore, (store) => store.totalBet)
    private renderHyperSpinTotalBet(totalBet: number) {

        this.updateTotalBetPerRoundDisplay(totalBet);

    }

    private updateTotalBetPerRoundDisplay(totalBet: number) {
        const formattedValue = gc.FormatUtils.numberWithCommas(totalBet, 2, true);

        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = formattedValue;
        } else {
            // Try to find the label by searching for it
            const findLabelNode = (node: any): Label => {
                if (node.name && (node.name.includes("total-bet-value") || node.name.includes("bet-value"))) {
                    const label = node.getComponent(Label);
                    if (label) return label;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findLabelNode(node.children[i]);
                    if (found) return found;
                }
                return null;
            };
            const foundLabel = findLabelNode(this.node);
            if (foundLabel) {
                foundLabel.string = formattedValue;
            } else {
            }
        }

        // Sync totalBetPerRoundSliderLabel with the same value
        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = formattedValue;
        } else {
        }
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    private updateTotalBetPerRoundButtonStatus(interactableTotalBet: { increase: boolean; decrease: boolean }) {

        // Update regular decrease button
        if (this.totalBetPerRoundDecreaseBtn) {

            this.totalBetPerRoundDecreaseBtn.interactable = interactableTotalBet.decrease;
        } else {
        }

        // Update slider decrease button - same behavior as regular button
        if (this.totalBetPerRoundSliderDecreaseBtn) {

            this.totalBetPerRoundSliderDecreaseBtn.interactable = interactableTotalBet.decrease;
        }

        // Update regular increase button
        if (this.totalBetPerRoundIncreaseBtn) {

            this.totalBetPerRoundIncreaseBtn.interactable = interactableTotalBet.increase;
        } else {
        }

        // Update slider increase button - same behavior as regular button
        if (this.totalBetPerRoundSliderIncreaseBtn) {

            this.totalBetPerRoundSliderIncreaseBtn.interactable = interactableTotalBet.increase;
        }

    }

    /**
     * Update HyperSpin rounds label display
     * Shows remaining/total format during execution (e.g., "8/10")
     * Label is only visible when hyper spin is playing
     */
    @render(HyperSpinStore, (store) => ({ selectedRoundOnPopup: store.selectedRoundOnPopup, isHyperSpin: store.isHyperSpin, roundsHyperSpin: store.roundsHyperSpin }))
    updateHyperSpinRoundsLabel(data: { selectedRoundOnPopup: number; isHyperSpin: boolean; roundsHyperSpin: number }) {

        if (this.hyperSpinRoundsLabel) {
            // Only show label when hyper spin is playing
            this.hyperSpinRoundsLabel.node.active = data.isHyperSpin;

            let displayText: string;

            if (data.isHyperSpin && data.roundsHyperSpin > 0) {
                // During hyper-spin execution, show remaining/total format
                const remaining = data.roundsHyperSpin;
                const total = data.selectedRoundOnPopup;
                displayText = `${remaining}`;
            } else {
                // During configuration, show just the selected number
                displayText = data.selectedRoundOnPopup.toString();
            }

            this.hyperSpinRoundsLabel.string = displayText;

        } else {
        }

    }

    /**
     * Update hyper total win value from batch data
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateHyperTotalWinValue(totalWin: string) {

        if (this.hyperTotalWinValue) {
            const previousValue = this.hyperTotalWinValue.string;
            const displayValue = totalWin || "0.00";

            this.hyperTotalWinValue.string = displayValue;

        } else {
        }

    }

    /**
     * Update totalWinningsLabel and playerTotalWinningsLabel with hyper-spin batch totalWin
     * Both labels use the same totalWin value from batch data
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateTotalWinningsLabels(totalWin: string) {

        const displayValue = totalWin || "0.00";

        // Update totalWinningsLabel
        if (this.totalWinningsLabel) {
            const previousValue = this.totalWinningsLabel.string;
            this.totalWinningsLabel.string = displayValue;

        } else {
        }

        // Update playerTotalWinningsLabel to follow totalWinningsLabel (same value)
        if (this.playerTotalWinningsLabel) {
            const previousValue = this.playerTotalWinningsLabel.string;
            this.playerTotalWinningsLabel.string = displayValue;

        } else {
        }

    }

    /**
     * Update lblTotalBetValue with hyper-spin batch total bet
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalBet)
    private updateLblTotalBetValue(totalBet: string) {

        if (this.lblTotalBetValue) {
            const previousValue = this.lblTotalBetValue.string;
            const displayValue = totalBet || "0.00";

            this.lblTotalBetValue.string = displayValue;

        } else {
        }

    }

    /**
     * Update startingBalanceLabel with hyper-spin batch starting balance or current user balance
     */
    @render(HyperSpinStore, (store) => ({
        batchStartingBalance: store.currentBatchData?.summary?.startingBalance,
        hasBatchData: !!store.currentBatchData
    }))
    private updateStartingBalanceLabel(data: { batchStartingBalance: string; hasBatchData: boolean }) {

        if (this.startingBalanceLabel) {
            const previousValue = this.startingBalanceLabel.string;
            let displayValue: string;

            if (data.hasBatchData && data.batchStartingBalance) {
                // Show batch starting balance when batch exists
                displayValue = data.batchStartingBalance;
            } else {
                // Show current user balance when no batch or batch balance not set
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.startingBalanceLabel.string = displayValue;

        } else {
        }

    }

    /**
     * Update endBalanceLabel with hyper-spin batch end balance or current user balance
     */
    @render(HyperSpinStore, (store) => ({
        batchEndBalance: store.currentBatchData?.summary?.endBalance,
        hasBatchData: !!store.currentBatchData,
        batchStatus: store.currentBatchData?.summary?.hyperSpinStatus
    }))
    private updateEndBalanceLabel(data: { batchEndBalance: string; hasBatchData: boolean; batchStatus: string }) {

        if (this.endBalanceLabel) {
            const previousValue = this.endBalanceLabel.string;
            let displayValue: string;

            if (data.hasBatchData && data.batchStatus === "Ready" && data.batchEndBalance && data.batchEndBalance !== "0.00") {
                // Show batch end balance when batch is completed (status is "Ready" and endBalance is set)
                displayValue = data.batchEndBalance;
            } else {
                // Show current user balance when no batch, batch in progress, or batch not completed
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.endBalanceLabel.string = displayValue;

        } else {
        }

    }

    /**
     * Update HyperSpin rounds button interactability
     */
    @render(HyperSpinStore, (store) => ({
        canDecrease: store.roundsList.indexOf(store.selectedRoundOnPopup) > 0,
        canIncrease: store.roundsList.indexOf(store.selectedRoundOnPopup) < store.roundsList.length - 1
    }))
    updateHyperSpinRoundsButtonsInteractable({ canDecrease, canIncrease }: { canDecrease: boolean; canIncrease: boolean }) {

        if (this.hyperSpinRoundsDecreaseBtn) {

            this.hyperSpinRoundsDecreaseBtn.interactable = canDecrease;
        } else {
        }

        if (this.hyperSpinRoundsIncreaseBtn) {

            this.hyperSpinRoundsIncreaseBtn.interactable = canIncrease;
        } else {
        }

    }

    /**
     * Sync balance label from CascadingUIStore
     * Matches the behavior of cascading-slot-game.ts setBalance method
     */
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

    /**
     * Render total bet value and update slider display
     * Default value: current Total Bet value
     * Number format: number with thousand separator and up to 2 decimals
     */
    @render(BetControlStore, (store) => ({ totalBet: store.totalBet, currentTotalBetIndex: store.currentTotalBetIndex, totalBetUnique: store.totalBetUnique }))
    private renderTotalBet(data: { totalBet: number; currentTotalBetIndex: number; totalBetUnique: any[] }) {

        if (data.totalBetUnique && data.totalBetUnique.length > 0) {
            this.updateTotalBetDisplay(data.totalBet, data.currentTotalBetIndex, data.totalBetUnique);
        } else {
        }
    }

    /**
     * Update total bet display including slider and label
     * @param totalBet - Current total bet value
     * @param currentIndex - Current index in totalBetUnique array
     * @param totalBetUnique - Array of unique total bet values
     */
    private updateTotalBetDisplay(totalBet: number, currentIndex: number, totalBetUnique: any[]) {

        // Format value with thousand separator and up to 2 decimals
        const formattedValue = gc.FormatUtils.numberWithCommas(totalBet, 2, true);

        // Find the slider - try multiple methods
        let slider: Slider = null;

        // Method 1: Try to find slider node by name
        const sliderNode = this.node.getChildByName("total-bet-slider");
        if (sliderNode) {
            slider = sliderNode.getComponent(Slider);
            if (slider) {
            }
        }

        // Method 2: Search for slider in children
        if (!slider) {
            const findSliderInNode = (node: any): Slider => {
                const sliderComp = node.getComponent(Slider);
                if (sliderComp) {
                    return sliderComp;
                }
                for (let i = 0; i < node.children.length; i++) {
                    const found = findSliderInNode(node.children[i]);
                    if (found) return found;
                }
                return null;
            };
            slider = findSliderInNode(this.node);
            if (slider) {
            }
        }

        // Update slider progress if found
        // Calculate progress based on min/max bet values, not index
        if (slider && totalBetUnique.length > 0) {
            // Extract min and max bet values from totalBetUnique array
            const betValues = totalBetUnique.map(item => +Object.keys(item)[0]);
            const minBet = Math.min(...betValues);
            const maxBet = Math.max(...betValues);

            // Calculate progress based on actual bet values
            const progress = maxBet > minBet ? (totalBet - minBet) / (maxBet - minBet) : 0;
            const clampedProgress = Math.max(0, Math.min(1, progress));

            const currentProgress = slider.progress;
            const progressDiff = Math.abs(currentProgress - clampedProgress);

            if (progressDiff > 0.0001) {
                slider.progress = clampedProgress;
            }
        } else {
        }

        // Update label if there's a total bet slider label
        // Note: You may need to add a @property for totalBetSliderLabel if it exists in your prefab
        const findTotalBetLabel = (node: any): Label => {
            if (node.name && (node.name.includes("total-bet-slider-label") || node.name.includes("total-bet-value"))) {
                const label = node.getComponent(Label);
                if (label) return label;
            }
            for (let i = 0; i < node.children.length; i++) {
                const found = findTotalBetLabel(node.children[i]);
                if (found) return found;
            }
            return null;
        };
        const totalBetLabel = findTotalBetLabel(this.node);
        if (totalBetLabel) {
            totalBetLabel.string = formattedValue;
        } else {
        }

        // Also update totalBetPerRoundSliderLabel and totalBetPerRoundLabel when total bet changes
        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = formattedValue;
        }

        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = formattedValue;
        }
    }
}

