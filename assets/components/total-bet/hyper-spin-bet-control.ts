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
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] onLoad called", {
            hasNode: !!this.node,
            hasNumberOfSpinsContent: !!this.numberOfSpinsContent,
            hasPrfNoOfRound: !!this.prfNoOfRound,
            timestamp: new Date().toISOString()
        });
    }

    start() {
        // Initialize content rounds in start() - runs after onLoad when component is fully initialized
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] start called", {
            hasNode: !!this.node,
            hasNumberOfSpinsContent: !!this.numberOfSpinsContent,
            hasPrfNoOfRound: !!this.prfNoOfRound,
            timestamp: new Date().toISOString()
        });

        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store && store.roundsList && Array.isArray(store.roundsList) && store.roundsList.length > 0) {
                    cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] start - initializing content rounds", {
                        roundsList: store.roundsList,
                        roundsListLength: store.roundsList.length,
                        timestamp: new Date().toISOString()
                    });
                    this.initContentRounds(store.roundsList);
                } else {
                    cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] start - store or roundsList not available", {
                        hasStore: !!store,
                        hasRoundsList: !!store?.roundsList,
                        isArray: Array.isArray(store?.roundsList),
                        roundsListLength: store?.roundsList?.length,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                cascadingSlotLogger.error("[HYPER_SPIN_BET_CONTROL] start - error accessing store:", error);
            }
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] start - container not available", {
                timestamp: new Date().toISOString()
            });
        }
    }

    @render(HyperSpinStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        console.log("HyperSpinBetControl initContentRounds called");
        console.log("roundsList", roundsList);
        // Validate inputs
        if (!roundsList || !Array.isArray(roundsList) || roundsList.length === 0) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initContentRounds - invalid roundsList", {
                roundsList: roundsList,
                isArray: Array.isArray(roundsList),
                length: roundsList?.length,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.numberOfSpinsContent) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initContentRounds - numberOfSpinsContent is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.prfNoOfRound) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initContentRounds - prfNoOfRound prefab is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] initContentRounds called", {
            roundsList: roundsList,
            roundsListLength: roundsList.length,
            nodeChildrenBefore: this.numberOfSpinsContent.children?.length,
            hasPrefab: !!this.prfNoOfRound,
            timestamp: new Date().toISOString()
        });

        this.numberOfSpinsContent.destroyAllChildren();
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] All children destroyed from numberOfSpinsContent", {
            nodeChildrenAfterDestroy: this.numberOfSpinsContent.children?.length
        });

        roundsList.forEach((round, idx) => {
            console.log("round", round);
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            console.log("roundNumber", roundNumber);
            console.log("roundNumber value", roundNumber?.value);
            if (roundNumber) {
                roundNumber.setValue(round);
                console.log("roundNumber value set", roundNumber.value);
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Created round number node", {
                    index: idx,
                    round: round,
                    componentName: roundNumber.constructor.name,
                    nodeName: node.name,
                    componentType: "HyperSpinRoundNumber"
                });
            } else {
                cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Failed to get HyperSpinRoundNumber component from instantiated node", {
                    index: idx,
                    round,
                    nodeName: node.name,
                    availableComponents: node.getComponentsInChildren(Component).map(c => c.constructor.name)
                });
            }

            this.numberOfSpinsContent.addChild(node);

            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Child node added to numberOfSpinsContent", {
                index: idx,
                round: round,
                totalChildrenNow: this.numberOfSpinsContent.children.length,
                nodeName: node.name
            });
        });

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Finished initContentRounds", {
            finalChildren: this.numberOfSpinsContent.children?.length,
            timestamp: new Date().toISOString()
        });

        // Ensure default selection (100) is applied after initialization
        // Get current selectedRoundOnPopup from store and render selection
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store && store.selectedRoundOnPopup) {
                    const defaultSelectedRound = store.selectedRoundOnPopup;
                    cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Applying default selection after initialization", {
                        defaultSelectedRound,
                        timestamp: new Date().toISOString()
                    });
                    this.renderSelectedRounds(defaultSelectedRound);
                } else {
                    // Fallback to 100 if store value is not available
                    cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Store value not available, using default 100", {
                        timestamp: new Date().toISOString()
                    });
                    this.renderSelectedRounds(100);
                }
            } catch (error) {
                cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Error accessing store for default selection, using 100", {
                    error,
                    timestamp: new Date().toISOString()
                });
                // Fallback to 100 if store access fails
                this.renderSelectedRounds(100);
            }
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Container not available, using default 100", {
                timestamp: new Date().toISOString()
            });
            // Fallback to 100 if container is not available
            this.renderSelectedRounds(100);
        }
    }

    @render(HyperSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderSelectedRounds called", {
            noOfRounds: noOfRounds,
            numberOfSpinsContentChildren: this.numberOfSpinsContent.children.length,
            timestamp: new Date().toISOString()
        });

        this.numberOfSpinsContent.children.forEach((child, idx) => {
            const roundNumber = child.getComponent(HyperSpinRoundNumber);
            if (!roundNumber) {
                cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Child node missing HyperSpinRoundNumber component", {
                    idx,
                    childName: child.name,
                    availableComponents: child.getComponentsInChildren(Component).map(c => c.constructor.name)
                });
                return;
            }
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderSelectedRounds per node", {
                idx,
                nodeName: child.name,
                roundValue: roundNumber.value,
                isSelected: selectedBg
            });
        });

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Finished renderSelectedRounds", {
            finalChildren: this.numberOfSpinsContent.children.length,
            targetSelectedRound: noOfRounds,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Initialize hyper-spin records content by creating record items for each spin
     * This method destroys all children and recreates them (used for initial setup or reset)
     */
    private initHyperSpinRecords(spins: HyperSpinBatchData['spins']) {
        if (!spins || !Array.isArray(spins) || spins.length === 0) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initHyperSpinRecords - invalid spins array", {
                spins: spins,
                isArray: Array.isArray(spins),
                length: spins?.length,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.hyperSpinRecordBodyContentNode) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initHyperSpinRecords - hyperSpinRecordBodyContentNode is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.prfHyperSpinRecordBodyItem) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] initHyperSpinRecords - prfHyperSpinRecordBodyItem prefab is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] initHyperSpinRecords called", {
            spinsCount: spins.length,
            nodeChildrenBefore: this.hyperSpinRecordBodyContentNode.children?.length,
            hasPrefab: !!this.prfHyperSpinRecordBodyItem,
            timestamp: new Date().toISOString()
        });

        this.hyperSpinRecordBodyContentNode.destroyAllChildren();
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] All children destroyed from hyperSpinRecordBodyContentNode", {
            nodeChildrenAfterDestroy: this.hyperSpinRecordBodyContentNode.children?.length
        });

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

                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Set spin data for record item", {
                    index: idx,
                    spinId: spin.spinId,
                    spinWinAmount: spinData.spinWinAmount,
                    spinBalance: spinData.spinBalance,
                    spinWinMultiplier: spinData.spinWinMultiplier,
                    componentName: recordBodyItem.constructor.name,
                    nodeName: node.name
                });
            } else {
                cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Failed to get HyperSpinRecordBodyItem component from instantiated node", {
                    index: idx,
                    spin: spin,
                    nodeName: node.name,
                    availableComponents: node.getComponentsInChildren(Component).map(c => c.constructor.name)
                });
            }

            // 4. Append to parent (same pattern as prfNoOfRound)
            this.hyperSpinRecordBodyContentNode.addChild(node);

            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Child node added to hyperSpinRecordBodyContentNode", {
                index: idx,
                spinId: spin.spinId,
                totalChildrenNow: this.hyperSpinRecordBodyContentNode.children.length,
                nodeName: node.name
            });
        });

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Finished initHyperSpinRecords", {
            finalChildren: this.hyperSpinRecordBodyContentNode.children?.length,
            totalSpinsProcessed: spins.length,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Append new spin records incrementally without destroying existing records
     * This method only adds new spins that haven't been rendered yet
     */
    private appendNewSpinRecords(spins: HyperSpinBatchData['spins']) {
        if (!spins || !Array.isArray(spins)) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] appendNewSpinRecords - invalid spins array", {
                spins: spins,
                isArray: Array.isArray(spins),
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.hyperSpinRecordBodyContentNode) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] appendNewSpinRecords - hyperSpinRecordBodyContentNode is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.prfHyperSpinRecordBodyItem) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] appendNewSpinRecords - prfHyperSpinRecordBodyItem prefab is null", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const currentChildrenCount = this.hyperSpinRecordBodyContentNode.children?.length || 0;
        const newSpinsCount = spins.length - currentChildrenCount;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] appendNewSpinRecords called", {
            totalSpinsCount: spins.length,
            currentChildrenCount: currentChildrenCount,
            newSpinsCount: newSpinsCount,
            hasPrefab: !!this.prfHyperSpinRecordBodyItem,
            timestamp: new Date().toISOString()
        });

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

                    cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Set spin data for new record item", {
                        index: actualIndex,
                        spinId: spin.spinId,
                        spinWinAmount: spinData.spinWinAmount,
                        spinBalance: spinData.spinBalance,
                        spinWinMultiplier: spinData.spinWinMultiplier,
                        componentName: recordBodyItem.constructor.name,
                        nodeName: node.name
                    });
                } else {
                    cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] Failed to get HyperSpinRecordBodyItem component from instantiated node", {
                        index: actualIndex,
                        spin: spin,
                        nodeName: node.name,
                        availableComponents: node.getComponentsInChildren(Component).map(c => c.constructor.name)
                    });
                }

                // 4. Append to parent (same pattern as prfNoOfRound)
                this.hyperSpinRecordBodyContentNode.addChild(node);

                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] New child node appended to hyperSpinRecordBodyContentNode", {
                    index: actualIndex,
                    spinId: spin.spinId,
                    totalChildrenNow: this.hyperSpinRecordBodyContentNode.children.length,
                    nodeName: node.name
                });
            });

            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Finished appendNewSpinRecords", {
                newSpinsAdded: newSpinsCount,
                finalChildren: this.hyperSpinRecordBodyContentNode.children?.length,
                timestamp: new Date().toISOString()
            });
        } else if (newSpinsCount < 0) {
            // If spins array is shorter than current children, reset and rebuild
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Spins array is shorter than current children, resetting", {
                spinsLength: spins.length,
                currentChildrenCount: currentChildrenCount,
                timestamp: new Date().toISOString()
            });
            this.initHyperSpinRecords(spins);
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] No new spins to append", {
                spinsLength: spins.length,
                currentChildrenCount: currentChildrenCount,
                timestamp: new Date().toISOString()
            });
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

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderHyperSpinRecords called", {
            hasBatchData: !!data?.batchData,
            spinsLength: data?.spinsLength,
            spinsCount: spins?.length,
            hyperSpinRecordBodyContentNodeChildren: this.hyperSpinRecordBodyContentNode?.children?.length,
            hasSpinsArray: !!spins,
            timestamp: new Date().toISOString()
        });

        if (spins && Array.isArray(spins)) {
            const currentChildrenCount = this.hyperSpinRecordBodyContentNode?.children?.length || 0;

            // If no children exist yet, initialize all records
            // Otherwise, append only new spins incrementally
            if (currentChildrenCount === 0) {
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] No existing records, initializing all", {
                    spinsCount: spins.length,
                    timestamp: new Date().toISOString()
                });
                this.initHyperSpinRecords(spins);
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Existing records found, appending new spins incrementally", {
                    currentChildrenCount: currentChildrenCount,
                    spinsCount: spins.length,
                    newSpinsToAdd: spins.length - currentChildrenCount,
                    timestamp: new Date().toISOString()
                });
                this.appendNewSpinRecords(spins);
            }
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderHyperSpinRecords - no spins to render", {
                spins: spins,
                isArray: Array.isArray(spins),
                timestamp: new Date().toISOString()
            });

            // Clear records if no spins
            if (this.hyperSpinRecordBodyContentNode) {
                this.hyperSpinRecordBodyContentNode.destroyAllChildren();
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Cleared hyper-spin records due to empty spins array", {
                    timestamp: new Date().toISOString()
                });
            }
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Finished renderHyperSpinRecords", {
            finalChildren: this.hyperSpinRecordBodyContentNode?.children?.length,
            spinsProcessed: spins?.length || 0,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.dialogOpenEvent?.name)
    private setCurrentDialog(dialogName: string) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] setCurrentDialog called", {
            dialogName,
            previousDialogName: this.currentDialogName,
            hasDialogName: !!dialogName,
            timestamp: new Date().toISOString()
        });

        this.currentDialogName = dialogName;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] setCurrentDialog completed", {
            currentDialogName: this.currentDialogName,
            timestamp: new Date().toISOString()
        });
    }

    @render(HyperSpinStore, (store) => store.isOpenHyperSpinBetControlPopup)
    private setIsOpenHyperSpinBetControlPopup(isOpenHyperSpinBetControlPopup: boolean) {
        console.warn("🎰 HYPER-SPIN BET CONTROL: setIsOpenHyperSpinBetControlPopup called", {
            isOpenHyperSpinBetControlPopup,
            previousIsOpenBetAmountPopup: this.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] setIsOpenHyperSpinBetControlPopup called", {
            isOpenHyperSpinBetControlPopup,
            previousIsOpenBetAmountPopup: this.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });

        this.isOpenBetAmountPopup = isOpenHyperSpinBetControlPopup;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] setIsOpenHyperSpinBetControlPopup completed", {
            isOpenBetAmountPopup: this.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });
    }

    @render(HyperSpinStore, (store) => {
        return {
            isOpenHyperSpinBetControlPopup: store.isOpenHyperSpinBetControlPopup,
            roundsList: store.roundsList
        }
    })
    handleDialogVisibility(data: { isOpenHyperSpinBetControlPopup: boolean; roundsList: number[] }) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility called", {
            isOpenHyperSpinBetControlPopup: data.isOpenHyperSpinBetControlPopup,
            roundsList: data.roundsList,
            hasNode: !!this.node,
            currentNodeActive: this.node.active,
            willSetActive: true,
            timestamp: new Date().toISOString()
        });

        // Handle hyper spin bet control visibility
        this.node.active = data.isOpenHyperSpinBetControlPopup;

        // Initialize content rounds when component becomes active (fallback if @render didn't fire)
        if (data.isOpenHyperSpinBetControlPopup) {
            const childrenCount = this.numberOfSpinsContent?.children?.length || 0;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - checking if initialization needed", {
                isOpenHyperSpinBetControlPopup: data.isOpenHyperSpinBetControlPopup,
                roundsList: data.roundsList,
                hasNumberOfSpinsContent: !!this.numberOfSpinsContent,
                childrenCount: childrenCount,
                willCheckContainer: true,
                timestamp: new Date().toISOString()
            });

            this.initContentRounds(data.roundsList);
            // this.renderSelectedRounds(data.selectedRoundOnPopup);
            if (childrenCount === 0) {
                const container = (this as any).container;
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - container check", {
                    hasContainer: !!container,
                    timestamp: new Date().toISOString()
                });

                if (container) {
                    try {
                        const store = container.get(HyperSpinStore);
                        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - store check", {
                            hasStore: !!store,
                            hasRoundsList: !!data.roundsList,
                            roundsListLength: data.roundsList?.length,
                            isArray: Array.isArray(store?.roundsList),
                            timestamp: new Date().toISOString()
                        });

                        if (store && data.roundsList && Array.isArray(data.roundsList) && data.roundsList.length > 0) {
                            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - initializing content rounds", {
                                roundsList: data.roundsList,
                                roundsListLength: store.roundsList.length,
                                timestamp: new Date().toISOString()
                            });
                            this.initContentRounds(data.roundsList);
                        } else {
                            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - store or roundsList invalid", {
                                hasStore: !!store,
                                hasRoundsList: !!data.roundsList,
                                roundsListLength: data.roundsList?.length,
                                timestamp: new Date().toISOString()
                            });
                        }
                    } catch (error) {
                        cascadingSlotLogger.error("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - error accessing store:", error);
                    }
                } else {
                    cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - container not available", {
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility - skipping initialization, children already exist", {
                    childrenCount: childrenCount,
                    timestamp: new Date().toISOString()
                });
            }
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] handleDialogVisibility completed", {
            status,
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
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
                cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] Bet Control dialog event", {
                    dialogName: dialogOpenEvent?.name,
                    expectedDialog: DialogName.HYPER_SPIN,
                    isOpenBetAmountPopup: this.isOpenBetAmountPopup,
                    isHyperSpinActive: cascadingUIStore?.isHyperSpinActive,
                    isInHyperSpin,
                    willClosePopup: dialogOpenEvent?.name !== DialogName.HYPER_SPIN && this.isOpenBetAmountPopup && !isInHyperSpin,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] Bet Control - no container available");
            }
        } catch (error) {
            cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] Bet Control - error accessing container", error);
        }

        // Only close the popup if we're not in hyper-spin mode
        if (dialogOpenEvent?.name !== DialogName.HYPER_SPIN && this.isOpenBetAmountPopup && !isInHyperSpin) {
            cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] Bet Control - closing popup");
            this.node.active = false;
            this.onCloseHyperSpinBetControl();
        } else if (isInHyperSpin) {
            cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] Bet Control - keeping popup open (in hyper-spin mode)");
        }
    }


    @handle(HyperSpinHandler, (handle) => handle.onClickPlayButton())
    onClickPlayButton() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinBetControl.onClickPlayButton() - Play button clicked", {
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.pauseHyperSpinBatch())
    onClickPauseButton() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinBetControl.onClickPauseButton() - Pause button clicked", {
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });
        this.playSoundClick();
    }

    @render(HyperSpinStore, (store) => ({
        isHyperSpin: store.isHyperSpin,
        isPaused: store.currentBatchData?.summary.hyperSpinStatus === "Paused"
    }))
    updatePlayHyperSpinButton(data: { isHyperSpin: boolean; isPaused: boolean }) {
        const { isHyperSpin, isPaused } = data;

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] updatePlayHyperSpinButton called", {
            isHyperSpin,
            isPaused,
            hasSprIconPlay: !!this.sprIconPlay,
            hasSprIconBgPlay: !!this.sprIconBgPlay,
            hasSprIconPause: !!this.sprIconPause,
            hasSprIconBgPause: !!this.sprIconBgPause,
            currentPlayIconActive: this.sprIconPlay?.node?.active,
            currentPauseIconActive: this.sprIconPause?.node?.active,
            willSetPlayIcon: true,
            willSetPauseIcon: true,
            timestamp: new Date().toISOString()
        });

        // Control play icon and background together
        // Show play button when not hyper-spinning OR when hyper-spinning but paused (resume)
        const showPlayButton = !isHyperSpin || (isHyperSpin && isPaused);
        if (this.sprIconPlay) {
            this.sprIconPlay.node.active = showPlayButton;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Play icon active set", {
                showPlayButton,
                isHyperSpin,
                isPaused,
                playIconActive: this.sprIconPlay.node.active,
                timestamp: new Date().toISOString()
            });
        }

        if (this.sprIconBgPlay) {
            this.sprIconBgPlay.node.active = showPlayButton;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Play background icon active set", {
                showPlayButton,
                isHyperSpin,
                isPaused,
                playBgIconActive: this.sprIconBgPlay.node.active,
                timestamp: new Date().toISOString()
            });
        }

        // Control pause icon and background together
        // Show pause button only when hyper-spinning AND not paused
        const showPauseButton = isHyperSpin && !isPaused;
        if (this.sprIconPause) {
            this.sprIconPause.node.active = showPauseButton;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Pause icon active set", {
                showPauseButton,
                isHyperSpin,
                isPaused,
                pauseIconActive: this.sprIconPause.node.active,
                timestamp: new Date().toISOString()
            });
        }

        if (this.sprIconBgPause) {
            this.sprIconBgPause.node.active = showPauseButton;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Pause background icon active set", {
                showPauseButton,
                isHyperSpin,
                isPaused,
                pauseBgIconActive: this.sprIconBgPause.node.active,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] updatePlayHyperSpinButton completed", {
            isHyperSpin,
            isPaused,
            showPlayButton,
            showPauseButton,
            finalPlayIconActive: this.sprIconPlay?.node?.active,
            finalPlayBgIconActive: this.sprIconBgPlay?.node?.active,
            finalPauseIconActive: this.sprIconPause?.node?.active,
            finalPauseBgIconActive: this.sprIconBgPause?.node?.active,
            timestamp: new Date().toISOString()
        });
    }

    @handle(HyperSpinHandler, (handle) => handle.toggleStopOnFeature())
    onClickStopOnFeature() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] onClickStopOnFeature called", {
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });
        console.log("onClickStopOnFeature called");
        this.playSoundClick();
    }

    @render(HyperSpinStore, (store) => store.stopOnFeature)
    updateStopOnFeatureButton(stopOnFeature: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] updateStopOnFeatureButton called", {
            stopOnFeature,
            hasSprIconStopOnFeatureOff: !!this.sprIconStopOnFeatureOff,
            hasSprIconStopOnFeatureOn: !!this.sprIconStopOnFeatureOn,
            currentOffIconActive: this.sprIconStopOnFeatureOff?.node?.active,
            currentOnIconActive: this.sprIconStopOnFeatureOn?.node?.active,
            willSetOffIcon: true,
            willSetOnIcon: true,
            timestamp: new Date().toISOString()
        });

        if (!this.sprIconStopOnFeatureOff && !this.sprIconStopOnFeatureOn) {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] updateStopOnFeatureButton - Both sprite icons are null! Please assign sprIconStopOnFeatureOff and sprIconStopOnFeatureOn in the prefab.", {
                stopOnFeature,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (this.sprIconStopOnFeatureOff) {
            this.sprIconStopOnFeatureOff.node.active = !stopOnFeature;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Stop on feature off icon active set", {
                stopOnFeature,
                offIconActive: this.sprIconStopOnFeatureOff.node.active,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] sprIconStopOnFeatureOff is null", {
                timestamp: new Date().toISOString()
            });
        }

        if (this.sprIconStopOnFeatureOn) {
            this.sprIconStopOnFeatureOn.node.active = stopOnFeature;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Stop on feature on icon active set", {
                stopOnFeature,
                onIconActive: this.sprIconStopOnFeatureOn.node.active,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] sprIconStopOnFeatureOn is null", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] updateStopOnFeatureButton completed", {
            stopOnFeature,
            finalOffIconActive: this.sprIconStopOnFeatureOff?.node?.active,
            finalOnIconActive: this.sprIconStopOnFeatureOn?.node?.active,
            timestamp: new Date().toISOString()
        });
    }


    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBet(customEventData?: string) {
        // Check if customEventData indicates this is a total-bet-per-round button
        if (customEventData === "total-bet-per-round") {
            cascadingSlotLogger.info("[TOTAL_BET] Detected total-bet-per-round decrease button via customEventData");
            this.onClickDecreaseTotalBetPerRound();
            return;
        }

        // Check if this button is in the total-bet-per-round section
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            cascadingSlotLogger.info("[TOTAL_BET] Detected total-bet-per-round decrease button, routing to correct handler");
            this.onClickDecreaseTotalBetPerRound();
            return;
        }
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Decrease total bet clicked");
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBet(customEventData?: string) {
        // Check if customEventData indicates this is a total-bet-per-round button
        if (customEventData === "total-bet-per-round") {
            cascadingSlotLogger.info("[TOTAL_BET] Detected total-bet-per-round increase button via customEventData");
            this.onClickIncreaseTotalBetPerRound();
            return;
        }

        // Check if this button is in the total-bet-per-round section
        const isTotalBetPerRoundButton = this.isTotalBetPerRoundButton();
        if (isTotalBetPerRoundButton) {
            cascadingSlotLogger.info("[TOTAL_BET] Detected total-bet-per-round increase button, routing to correct handler");
            this.onClickIncreaseTotalBetPerRound();
            return;
        }
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Increase total bet clicked");
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setTotalBetFromSlider(progress))
    private handleTotalBetSliderChange(progress: number) {
        // This method is called by the @handle decorator
        cascadingSlotLogger.info("[TOTAL_BET] Slider change handled", { progress });
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
            cascadingSlotLogger.info("[TOTAL_BET] Slider changed", { progress: slider.progress });
            this.handleTotalBetSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            cascadingSlotLogger.info("[TOTAL_BET] Button clicked via slider handler", {
                customEventData,
                isIncrease,
                isDecrease,
                sliderType: typeof slider,
                hasProgress: slider?.progress !== undefined
            });

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
                        cascadingSlotLogger.error("[TOTAL_BET] Error calling handler:", error);
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
                        cascadingSlotLogger.error("[TOTAL_BET] Error calling handler:", error);
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
                cascadingSlotLogger.warn("[TOTAL_BET] Button clicked but customEventData not set. Please update prefab:", {
                    message: "Set customEventData to 'increase' for increase button and 'decrease' for decrease button in the ClickEvent configuration",
                    currentHandler: "onTotalBetChange",
                    recommendedHandlers: ["onClickIncreaseTotalBet", "onClickDecreaseTotalBet"]
                });
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
                    cascadingSlotLogger.info("[TOTAL_BET] Found total-bet-per-round container", { nodeName: node.name, depth });
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
        cascadingSlotLogger.info("[TOTAL_BET] Button detection", {
            hasTotalBetPerRoundButtons,
            hasTotalBetPerRoundLabel,
            foundInHierarchy: found,
            nodeName: this.node.name,
            result
        });

        return result;
    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinBetControl())
    onCloseHyperSpinBetControl() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Close button clicked");
        this.playSoundClick();
    }

    onClickControlToggle() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Control toggle button clicked");
        this.playSoundClick();

        if (this.hyperSpinControlsNode) {
            const newActiveState = !this.hyperSpinControlsNode.active;
            this.hyperSpinControlsNode.active = newActiveState;
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Toggled hyper-spin-controls visibility", {
                newActiveState,
                nodeName: this.hyperSpinControlsNode.name
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_BET_CONTROL] hyperSpinControlsNode is null, cannot toggle");
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.showHyperSpinBetControl())
    onClickTotalBetPerRoundLabel() {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] Total bet per round label clicked");
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRound() {
        cascadingSlotLogger.info("[TOTAL_BET] Decrease button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(BetControlStore);
                if (store) {
                    // Access totalBet to trigger MobX reaction
                    const value = store.totalBet;
                    cascadingSlotLogger.info("[TOTAL_BET] After decrease, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[TOTAL_BET] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRound() {
        cascadingSlotLogger.info("[TOTAL_BET] Increase button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(BetControlStore);
                if (store) {
                    // Access totalBet to trigger MobX reaction
                    const value = store.totalBet;
                    cascadingSlotLogger.info("[TOTAL_BET] After increase, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[TOTAL_BET] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBetPerRoundSlider() {
        cascadingSlotLogger.info("[TOTAL_BET] Slider decrease button clicked");
        // Call the same handler as regular decrease button
        this.onClickDecreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBetPerRoundSlider() {
        cascadingSlotLogger.info("[TOTAL_BET] Slider increase button clicked");
        // Call the same handler as regular increase button
        this.onClickIncreaseTotalBetPerRound();
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(false))
    onClickDecreaseHyperSpinRounds() {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Decrease button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access selectedRoundOnPopup to trigger MobX reaction
                    const value = store.selectedRoundOnPopup;
                    cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] After decrease, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[HYPER_SPIN_ROUNDS] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeHyperSpinRounds(true))
    onClickIncreaseHyperSpinRounds() {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Increase button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access selectedRoundOnPopup to trigger MobX reaction
                    const value = store.selectedRoundOnPopup;
                    cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] After increase, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[HYPER_SPIN_ROUNDS] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnProfitFromSlider(progress))
    private handleStopOnProfitSliderChange(progress: number) {
        // This method is called by the @handle decorator
        cascadingSlotLogger.info("[STOP_ON_PROFIT] Slider change handled", { progress });
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(true))
    onClickIncreaseStopOnProfit() {
        cascadingSlotLogger.info("[STOP_ON_PROFIT] Increase button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnProfit to trigger MobX reaction
                    const value = store.stopOnProfit;
                    cascadingSlotLogger.info("[STOP_ON_PROFIT] After increase, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_PROFIT] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnProfit(false))
    onClickDecreaseStopOnProfit() {
        cascadingSlotLogger.info("[STOP_ON_PROFIT] Decrease button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnProfit to trigger MobX reaction
                    const value = store.stopOnProfit;
                    cascadingSlotLogger.info("[STOP_ON_PROFIT] After decrease, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_PROFIT] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle, progress: number) => handle.setStopOnLossFromSlider(progress))
    private handleStopOnLossSliderChange(progress: number) {
        // This method is called by the @handle decorator
        cascadingSlotLogger.info("[STOP_ON_LOSS] Slider change handled", { progress });
        return progress;
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(true))
    onClickIncreaseStopOnLoss() {
        cascadingSlotLogger.info("[STOP_ON_LOSS] Increase button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnLoss to trigger MobX reaction
                    const value = store.stopOnLoss;
                    cascadingSlotLogger.info("[STOP_ON_LOSS] After increase, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_LOSS] Error accessing store:", error);
            }
        }
    }

    @handle(HyperSpinHandler, (handle) => handle.changeStopOnLoss(false))
    onClickDecreaseStopOnLoss() {
        cascadingSlotLogger.info("[STOP_ON_LOSS] Decrease button clicked");
        this.playSoundClick();
        // Force update the display after change
        const container = (this as any).container;
        if (container) {
            try {
                const store = container.get(HyperSpinStore);
                if (store) {
                    // Access stopOnLoss to trigger MobX reaction
                    const value = store.stopOnLoss;
                    cascadingSlotLogger.info("[STOP_ON_LOSS] After decrease, value:", value);
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_LOSS] Error accessing store:", error);
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
        cascadingSlotLogger.info("[STOP_ON_PROFIT] updateStopOnProfitDisplay", { stopOnProfit, maxStopOnProfit });
        // Get min/max from store (these are computed properties that depend on totalBet)
        const minStopOnProfit = 0; // Always 0
        const finalMaxStopOnProfit = maxStopOnProfit ?? this.getMaxStopOnProfit(); // Use passed value or calculate

        // Update button states
        this.updateStopOnProfitButtonStates(stopOnProfit, minStopOnProfit, finalMaxStopOnProfit);

        // Update label with null check
        if (this.stopOnProfitLabel) {
            this.stopOnProfitLabel.string = gc.FormatUtils.numberWithCommas(stopOnProfit, 2, true);
        } else {
            cascadingSlotLogger.warn("[STOP_ON_PROFIT] stopOnProfitLabel is null");
        }

        // Find the slider - try multiple methods (only search for stop-on-profit slider)
        let slider: Slider = null;

        // Method 1: Try stopOnProfitSliderCtrl if assigned
        if (this.stopOnProfitSliderCtrl) {
            slider = this.stopOnProfitSliderCtrl.getComponent(Slider);
            if (slider) {
                cascadingSlotLogger.info("[STOP_ON_PROFIT] Found slider via stopOnProfitSliderCtrl");
            }
        }

        // Method 2: Try to find slider node by name (specific to stop-on-profit)
        if (!slider) {
            const sliderNode = this.node.getChildByName("stop-on-profit-slider");
            if (sliderNode) {
                slider = sliderNode.getComponent(Slider);
                if (slider) {
                    cascadingSlotLogger.info("[STOP_ON_PROFIT] Found slider via node name");
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
                    cascadingSlotLogger.info("[STOP_ON_PROFIT] Found slider by searching profit container");
                }
            }
        }

        if (slider) {
            this.updateSliderProgress(slider, stopOnProfit, minStopOnProfit, finalMaxStopOnProfit);
        } else {
            cascadingSlotLogger.warn("[STOP_ON_PROFIT] Could not find slider component. stopOnProfitSliderCtrl:", !!this.stopOnProfitSliderCtrl);
        }
    }

    private updateStopOnProfitButtonStates(stopOnProfit: number, minStopOnProfit: number, maxStopOnProfit: number) {
        // Update decrease button - enabled when stopOnProfit > minStopOnProfit (0)
        const canDecrease = stopOnProfit > minStopOnProfit;
        if (this.stopOnProfitDecreaseBtn) {
            this.stopOnProfitDecreaseBtn.interactable = canDecrease;
            cascadingSlotLogger.info("[STOP_ON_PROFIT] Decrease button state", { canDecrease, stopOnProfit, minStopOnProfit });
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
                cascadingSlotLogger.info("[STOP_ON_PROFIT] Decrease button found and updated", { canDecrease });
            }
        }

        // Update increase button - enabled when stopOnProfit < maxStopOnProfit
        const canIncrease = stopOnProfit < maxStopOnProfit;
        if (this.stopOnProfitIncreaseBtn) {
            this.stopOnProfitIncreaseBtn.interactable = canIncrease;
            cascadingSlotLogger.info("[STOP_ON_PROFIT] Increase button state", { canIncrease, stopOnProfit, maxStopOnProfit });
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
                cascadingSlotLogger.info("[STOP_ON_PROFIT] Increase button found and updated", { canIncrease });
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
        cascadingSlotLogger.info("[STOP_ON_PROFIT] Slider calculation", {
            stopOnProfit,
            maxStopOnProfit,
            sliderPercentage: `${sliderPercentage}%`,
            willUpdate: progressDiff > 0.0001
        });

        // Update slider progress - always update to ensure it's in sync
        if (progressDiff > 0.0001) {
            slider.progress = clampedProgress;
            cascadingSlotLogger.info("[STOP_ON_PROFIT] Slider progress updated", {
                from: currentProgress,
                to: clampedProgress
            });
        } else {
            cascadingSlotLogger.info("[STOP_ON_PROFIT] Slider progress already at target value", {
                currentProgress,
                clampedProgress
            });
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
                    cascadingSlotLogger.info("[STOP_ON_PROFIT] getMaxStopOnProfit debug", {
                        maxStopOnProfit,
                        maxWinPerRound,
                        currentTotalBet,
                        configStoreExists: !!store.configStore,
                        gameConfigsExists: !!store.configStore?.gameConfigs
                    });
                    return maxStopOnProfit;
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_PROFIT] Error accessing store through container:", error);
            }
        }

        cascadingSlotLogger.warn("[STOP_ON_PROFIT] getMaxStopOnProfit returning 0 - container not available");
        return 0;
    }

    onStopOnProfitSliderChange(slider: Slider | Event | any, customEventData?: string) {
        // This is called when the slider is dragged OR when buttons are clicked (prefab connects buttons here)
        // If slider is a Slider object, it's from the slider drag
        // If it's an Event or undefined, it's from a button click
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            // Slider drag event - slider is a Slider component with valid progress
            cascadingSlotLogger.info("[STOP_ON_PROFIT] Slider changed", { progress: slider.progress });
            this.handleStopOnProfitSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            // If not set, we need to update the prefab to set it
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            cascadingSlotLogger.info("[STOP_ON_PROFIT] Button clicked via slider handler", {
                customEventData,
                isIncrease,
                isDecrease,
                sliderType: typeof slider,
                hasProgress: slider?.progress !== undefined
            });

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
                        cascadingSlotLogger.error("[STOP_ON_PROFIT] Error calling handler:", error);
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
                        cascadingSlotLogger.error("[STOP_ON_PROFIT] Error calling handler:", error);
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
                // For now, we'll show a warning and do nothing
                // The prefab should be updated to:
                // 1. Set customEventData to "increase" for increase button
                // 2. Set customEventData to "decrease" for decrease button
                // OR connect buttons directly to onClickIncreaseStopOnProfit/onClickDecreaseStopOnProfit
                cascadingSlotLogger.warn("[STOP_ON_PROFIT] Button clicked but customEventData not set. Please update prefab:", {
                    message: "Set customEventData to 'increase' for increase button and 'decrease' for decrease button in the ClickEvent configuration",
                    currentHandler: "onStopOnProfitSliderChange",
                    recommendedHandlers: ["onClickIncreaseStopOnProfit", "onClickDecreaseStopOnProfit"]
                });
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
        cascadingSlotLogger.info("[STOP_ON_LOSS] updateStopOnLossDisplay", { stopOnLoss, maxStopOnLoss });
        // Get min/max from store (these are computed properties that depend on userBalance)
        const minStopOnLoss = 0; // Always 0
        const finalMaxStopOnLoss = maxStopOnLoss ?? this.getMaxStopOnLoss(); // Use passed value or calculate

        // Update button states
        this.updateStopOnLossButtonStates(stopOnLoss, minStopOnLoss, finalMaxStopOnLoss);

        // Update label with null check
        if (this.stopOnLossLabel) {
            this.stopOnLossLabel.string = gc.FormatUtils.numberWithCommas(stopOnLoss, 2, true);
        } else {
            cascadingSlotLogger.warn("[STOP_ON_LOSS] stopOnLossLabel is null");
        }

        // Find the slider - try multiple methods (only search for stop-on-loss slider)
        let slider: Slider = null;

        // Method 1: Try stopOnLossSliderCtrl if assigned
        if (this.stopOnLossSliderCtrl) {
            slider = this.stopOnLossSliderCtrl.getComponent(Slider);
            if (slider) {
                cascadingSlotLogger.info("[STOP_ON_LOSS] Found slider via stopOnLossSliderCtrl");
            }
        }

        // Method 2: Try to find slider node by name (specific to stop-on-loss)
        if (!slider) {
            const sliderNode = this.node.getChildByName("stop-on-loss-slider");
            if (sliderNode) {
                slider = sliderNode.getComponent(Slider);
                if (slider) {
                    cascadingSlotLogger.info("[STOP_ON_LOSS] Found slider via node name");
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
                    cascadingSlotLogger.info("[STOP_ON_LOSS] Found slider by searching loss container");
                }
            }
        }

        if (slider) {
            this.updateStopOnLossSliderProgress(slider, stopOnLoss, minStopOnLoss, finalMaxStopOnLoss);
        } else {
            cascadingSlotLogger.warn("[STOP_ON_LOSS] Could not find slider component. stopOnLossSliderCtrl:", !!this.stopOnLossSliderCtrl);
        }
    }

    private updateStopOnLossButtonStates(stopOnLoss: number, minStopOnLoss: number, maxStopOnLoss: number) {
        // Update decrease button - enabled when stopOnLoss > minStopOnLoss (0)
        const canDecrease = stopOnLoss > minStopOnLoss;
        if (this.stopOnLossDecreaseBtn) {
            this.stopOnLossDecreaseBtn.interactable = canDecrease;
            cascadingSlotLogger.info("[STOP_ON_LOSS] Decrease button state", { canDecrease, stopOnLoss, minStopOnLoss });
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
                cascadingSlotLogger.info("[STOP_ON_LOSS] Decrease button found and updated", { canDecrease });
            }
        }

        // Update increase button - enabled when stopOnLoss < maxStopOnLoss
        const canIncrease = stopOnLoss < maxStopOnLoss;
        if (this.stopOnLossIncreaseBtn) {
            this.stopOnLossIncreaseBtn.interactable = canIncrease;
            cascadingSlotLogger.info("[STOP_ON_LOSS] Increase button state", { canIncrease, stopOnLoss, maxStopOnLoss });
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
                cascadingSlotLogger.info("[STOP_ON_LOSS] Increase button found and updated", { canIncrease });
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
        cascadingSlotLogger.info("[STOP_ON_LOSS] Slider calculation", {
            stopOnLoss,
            maxStopOnLoss,
            sliderPercentage: `${sliderPercentage}%`,
            willUpdate: progressDiff > 0.0001
        });

        // Update slider progress - always update to ensure it's in sync
        if (progressDiff > 0.0001) {
            slider.progress = clampedProgress;
            cascadingSlotLogger.info("[STOP_ON_LOSS] Slider progress updated", {
                from: currentProgress,
                to: clampedProgress
            });
        } else {
            cascadingSlotLogger.info("[STOP_ON_LOSS] Slider progress already at target value", {
                currentProgress,
                clampedProgress
            });
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
                    cascadingSlotLogger.info("[STOP_ON_LOSS] getMaxStopOnLoss debug", {
                        maxStopOnLoss,
                        userBalance,
                        cascadingUIStoreExists: !!store.cascadingUIStore
                    });
                    return maxStopOnLoss;
                }
            } catch (error) {
                cascadingSlotLogger.error("[STOP_ON_LOSS] Error accessing store through container:", error);
            }
        }

        cascadingSlotLogger.warn("[STOP_ON_LOSS] getMaxStopOnLoss returning 0 - container not available");
        return 0;
    }

    onStopOnLossSliderChange(slider: Slider | Event | any, customEventData?: string) {
        // This is called when the slider is dragged OR when buttons are clicked (prefab connects buttons here)
        // If slider is a Slider object, it's from the slider drag
        // If it's an Event or undefined, it's from a button click
        if (slider && typeof slider.progress === "number" && !isNaN(slider.progress)) {
            // Slider drag event - slider is a Slider component with valid progress
            cascadingSlotLogger.info("[STOP_ON_LOSS] Slider changed", { progress: slider.progress });
            this.handleStopOnLossSliderChange(slider.progress);
        } else {
            // Button click event - determine which button based on customEventData
            // The prefab should set customEventData to "increase" or "decrease"
            // If not set, we need to update the prefab to set it
            const isIncrease = customEventData === "increase";
            const isDecrease = customEventData === "decrease";

            cascadingSlotLogger.info("[STOP_ON_LOSS] Button clicked via slider handler", {
                customEventData,
                isIncrease,
                isDecrease,
                sliderType: typeof slider,
                hasProgress: slider?.progress !== undefined
            });

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
                        cascadingSlotLogger.error("[STOP_ON_LOSS] Error calling handler:", error);
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
                        cascadingSlotLogger.error("[STOP_ON_LOSS] Error calling handler:", error);
                    }
                }
            } else {
                // The prefab needs to be updated to set customEventData
                // For now, we'll show a warning and do nothing
                // The prefab should be updated to:
                // 1. Set customEventData to "increase" for increase button
                // 2. Set customEventData to "decrease" for decrease button
                // OR connect buttons directly to onClickIncreaseStopOnLoss/onClickDecreaseStopOnLoss
                cascadingSlotLogger.warn("[STOP_ON_LOSS] Button clicked but customEventData not set. Please update prefab:", {
                    message: "Set customEventData to 'increase' for increase button and 'decrease' for decrease button in the ClickEvent configuration",
                    currentHandler: "onStopOnLossSliderChange",
                    recommendedHandlers: ["onClickIncreaseStopOnLoss", "onClickDecreaseStopOnLoss"]
                });
            }
        }
    }



    @render(BetControlStore, (store) => store.totalBet)
    private renderHyperSpinTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[TOTAL_BET] renderHyperSpinTotalBet called", {
            totalBet,
            hasLabel: !!this.totalBetPerRoundLabel,
            hasNode: !!this.node,
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });

        this.updateTotalBetPerRoundDisplay(totalBet);

        cascadingSlotLogger.info("[TOTAL_BET] renderHyperSpinTotalBet completed", {
            totalBet,
            timestamp: new Date().toISOString()
        });
    }


    private updateTotalBetPerRoundDisplay(totalBet: number) {
        const formattedValue = gc.FormatUtils.numberWithCommas(totalBet, 2, true);

        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = formattedValue;
            cascadingSlotLogger.info("[TOTAL_BET] Label updated", { value: this.totalBetPerRoundLabel.string });
        } else {
            cascadingSlotLogger.warn("[TOTAL_BET] totalBetPerRoundLabel is null - trying to find label node");
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
                cascadingSlotLogger.info("[TOTAL_BET] Found label node, updating");
                foundLabel.string = formattedValue;
            } else {
                cascadingSlotLogger.warn("[TOTAL_BET] Could not find label node");
            }
        }

        // Sync totalBetPerRoundSliderLabel with the same value
        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = formattedValue;
            cascadingSlotLogger.info("[TOTAL_BET] Slider label synced", { value: this.totalBetPerRoundSliderLabel.string });
        } else {
            cascadingSlotLogger.warn("[TOTAL_BET] totalBetPerRoundSliderLabel is null");
        }
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    private updateTotalBetPerRoundButtonStatus(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        cascadingSlotLogger.info("[TOTAL_BET] updateTotalBetButtonStatus called", {
            interactableTotalBet,
            hasDecreaseBtn: !!this.totalBetPerRoundDecreaseBtn,
            hasIncreaseBtn: !!this.totalBetPerRoundIncreaseBtn,
            hasSliderDecreaseBtn: !!this.totalBetPerRoundSliderDecreaseBtn,
            hasSliderIncreaseBtn: !!this.totalBetPerRoundSliderIncreaseBtn,
            currentDecreaseInteractable: this.totalBetPerRoundDecreaseBtn?.interactable,
            currentIncreaseInteractable: this.totalBetPerRoundIncreaseBtn?.interactable,
            timestamp: new Date().toISOString()
        });

        // Update regular decrease button
        if (this.totalBetPerRoundDecreaseBtn) {
            cascadingSlotLogger.info("[TOTAL_BET] Setting decrease button interactable", {
                from: this.totalBetPerRoundDecreaseBtn.interactable,
                to: interactableTotalBet.decrease,
                timestamp: new Date().toISOString()
            });

            this.totalBetPerRoundDecreaseBtn.interactable = interactableTotalBet.decrease;
        } else {
            cascadingSlotLogger.info("[TOTAL_BET] Decrease button not available", {
                timestamp: new Date().toISOString()
            });
        }

        // Update slider decrease button - same behavior as regular button
        if (this.totalBetPerRoundSliderDecreaseBtn) {
            cascadingSlotLogger.info("[TOTAL_BET] Setting slider decrease button interactable", {
                from: this.totalBetPerRoundSliderDecreaseBtn.interactable,
                to: interactableTotalBet.decrease,
                timestamp: new Date().toISOString()
            });

            this.totalBetPerRoundSliderDecreaseBtn.interactable = interactableTotalBet.decrease;
        }

        // Update regular increase button
        if (this.totalBetPerRoundIncreaseBtn) {
            cascadingSlotLogger.info("[TOTAL_BET] Setting increase button interactable", {
                from: this.totalBetPerRoundIncreaseBtn.interactable,
                to: interactableTotalBet.increase,
                timestamp: new Date().toISOString()
            });

            this.totalBetPerRoundIncreaseBtn.interactable = interactableTotalBet.increase;
        } else {
            cascadingSlotLogger.info("[TOTAL_BET] Increase button not available", {
                timestamp: new Date().toISOString()
            });
        }

        // Update slider increase button - same behavior as regular button
        if (this.totalBetPerRoundSliderIncreaseBtn) {
            cascadingSlotLogger.info("[TOTAL_BET] Setting slider increase button interactable", {
                from: this.totalBetPerRoundSliderIncreaseBtn.interactable,
                to: interactableTotalBet.increase,
                timestamp: new Date().toISOString()
            });

            this.totalBetPerRoundSliderIncreaseBtn.interactable = interactableTotalBet.increase;
        }

        cascadingSlotLogger.info("[TOTAL_BET] updateTotalBetPerRoundButtonStatus completed", {
            finalDecreaseInteractable: this.totalBetPerRoundDecreaseBtn?.interactable,
            finalIncreaseInteractable: this.totalBetPerRoundIncreaseBtn?.interactable,
            finalSliderDecreaseInteractable: this.totalBetPerRoundSliderDecreaseBtn?.interactable,
            finalSliderIncreaseInteractable: this.totalBetPerRoundSliderIncreaseBtn?.interactable,
            timestamp: new Date().toISOString()
        });
    }


    /**
     * Update HyperSpin rounds label display
     * Shows remaining/total format during execution (e.g., "8/10")
     * Label is only visible when hyper spin is playing
     */
    @render(HyperSpinStore, (store) => ({ selectedRoundOnPopup: store.selectedRoundOnPopup, isHyperSpin: store.isHyperSpin, roundsHyperSpin: store.roundsHyperSpin }))
    updateHyperSpinRoundsLabel(data: { selectedRoundOnPopup: number; isHyperSpin: boolean; roundsHyperSpin: number }) {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] updateHyperSpinRoundsLabel called", {
            data,
            hasLabel: !!this.hyperSpinRoundsLabel,
            hasNode: !!this.node,
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });

        if (this.hyperSpinRoundsLabel) {
            // Only show label when hyper spin is playing
            this.hyperSpinRoundsLabel.node.active = data.isHyperSpin;
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Label visibility set", {
                isHyperSpin: data.isHyperSpin,
                labelActive: this.hyperSpinRoundsLabel.node.active,
                timestamp: new Date().toISOString()
            });

            let displayText: string;

            if (data.isHyperSpin && data.roundsHyperSpin > 0) {
                // During hyper-spin execution, show remaining/total format
                const remaining = data.roundsHyperSpin;
                const total = data.selectedRoundOnPopup;
                displayText = `${remaining}`;
                cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Label updated to remaining/total format", {
                    displayText,
                    remaining,
                    total,
                    isHyperSpin: data.isHyperSpin,
                    timestamp: new Date().toISOString()
                });
            } else {
                // During configuration, show just the selected number
                displayText = data.selectedRoundOnPopup.toString();
                cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Label updated to configuration format", {
                    displayText,
                    selectedRoundOnPopup: data.selectedRoundOnPopup,
                    isHyperSpin: data.isHyperSpin,
                    timestamp: new Date().toISOString()
                });
            }

            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Setting label string", {
                from: this.hyperSpinRoundsLabel.string,
                to: displayText,
                timestamp: new Date().toISOString()
            });

            this.hyperSpinRoundsLabel.string = displayText;

            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Label updated successfully", {
                finalString: this.hyperSpinRoundsLabel.string,
                labelActive: this.hyperSpinRoundsLabel.node.active,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Label not available, skipping update", {
                hasLabel: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] updateHyperSpinRoundsLabel completed", {
            data,
            finalLabelString: this.hyperSpinRoundsLabel?.string,
            finalLabelActive: this.hyperSpinRoundsLabel?.node?.active,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update hyper total win value from batch data
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateHyperTotalWinValue(totalWin: string) {
        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WIN] updateHyperTotalWinValue called", {
            totalWin,
            hasLabel: !!this.hyperTotalWinValue,
            timestamp: new Date().toISOString()
        });

        if (this.hyperTotalWinValue) {
            const previousValue = this.hyperTotalWinValue.string;
            const displayValue = totalWin || "0.00";

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WIN] Setting hyper total win value", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });

            this.hyperTotalWinValue.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WIN] Hyper total win value updated successfully", {
                finalValue: this.hyperTotalWinValue.string,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_TOTAL_WIN] hyperTotalWinValue label not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WIN] updateHyperTotalWinValue completed", {
            totalWin,
            finalValue: this.hyperTotalWinValue?.string,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update totalWinningsLabel and playerTotalWinningsLabel with hyper-spin batch totalWin
     * Both labels use the same totalWin value from batch data
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateTotalWinningsLabels(totalWin: string) {
        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WINNINGS] updateTotalWinningsLabels called", {
            totalWin,
            hasTotalWinningsLabel: !!this.totalWinningsLabel,
            hasPlayerTotalWinningsLabel: !!this.playerTotalWinningsLabel,
            timestamp: new Date().toISOString()
        });

        const displayValue = totalWin || "0.00";

        // Update totalWinningsLabel
        if (this.totalWinningsLabel) {
            const previousValue = this.totalWinningsLabel.string;
            this.totalWinningsLabel.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WINNINGS] Setting totalWinningsLabel", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_TOTAL_WINNINGS] totalWinningsLabel not available", {
                timestamp: new Date().toISOString()
            });
        }

        // Update playerTotalWinningsLabel to follow totalWinningsLabel (same value)
        if (this.playerTotalWinningsLabel) {
            const previousValue = this.playerTotalWinningsLabel.string;
            this.playerTotalWinningsLabel.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WINNINGS] Setting playerTotalWinningsLabel (following totalWinningsLabel)", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_TOTAL_WINNINGS] playerTotalWinningsLabel not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_WINNINGS] updateTotalWinningsLabels completed", {
            totalWin,
            finalTotalWinningsLabel: this.totalWinningsLabel?.string,
            finalPlayerTotalWinningsLabel: this.playerTotalWinningsLabel?.string,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update lblTotalBetValue with hyper-spin batch total bet
     */
    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalBet)
    private updateLblTotalBetValue(totalBet: string) {
        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_BET] updateLblTotalBetValue called", {
            totalBet,
            hasLabel: !!this.lblTotalBetValue,
            timestamp: new Date().toISOString()
        });

        if (this.lblTotalBetValue) {
            const previousValue = this.lblTotalBetValue.string;
            const displayValue = totalBet || "0.00";

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_BET] Setting lblTotalBetValue", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });

            this.lblTotalBetValue.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_BET] lblTotalBetValue updated successfully", {
                finalValue: this.lblTotalBetValue.string,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_TOTAL_BET] lblTotalBetValue label not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_TOTAL_BET] updateLblTotalBetValue completed", {
            totalBet,
            finalValue: this.lblTotalBetValue?.string,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update startingBalanceLabel with hyper-spin batch starting balance or current user balance
     */
    @render(HyperSpinStore, (store) => ({
        batchStartingBalance: store.currentBatchData?.summary?.startingBalance,
        hasBatchData: !!store.currentBatchData
    }))
    private updateStartingBalanceLabel(data: { batchStartingBalance: string; hasBatchData: boolean }) {
        cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] updateStartingBalanceLabel called", {
            data,
            hasLabel: !!this.startingBalanceLabel,
            timestamp: new Date().toISOString()
        });

        if (this.startingBalanceLabel) {
            const previousValue = this.startingBalanceLabel.string;
            let displayValue: string;

            if (data.hasBatchData && data.batchStartingBalance) {
                // Show batch starting balance when batch exists
                displayValue = data.batchStartingBalance;
                cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] Using batch starting balance", {
                    batchStartingBalance: data.batchStartingBalance,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Show current user balance when no batch or batch balance not set
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
                cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] Using current user balance", {
                    currentBalance,
                    formattedBalance: displayValue,
                    timestamp: new Date().toISOString()
                });
            }


            cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] Setting startingBalanceLabel", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });

            this.startingBalanceLabel.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] startingBalanceLabel updated successfully", {
                finalValue: this.startingBalanceLabel.string,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_STARTING_BALANCE] startingBalanceLabel not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_STARTING_BALANCE] updateStartingBalanceLabel completed", {
            finalValue: this.startingBalanceLabel?.string,
            timestamp: new Date().toISOString()
        });
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
        cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] updateEndBalanceLabel called", {
            data,
            hasLabel: !!this.endBalanceLabel,
            timestamp: new Date().toISOString()
        });

        if (this.endBalanceLabel) {
            const previousValue = this.endBalanceLabel.string;
            let displayValue: string;

            if (data.hasBatchData && data.batchStatus === "Ready" && data.batchEndBalance && data.batchEndBalance !== "0.00") {
                // Show batch end balance when batch is completed (status is "Ready" and endBalance is set)
                displayValue = data.batchEndBalance;
                cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] Using batch end balance", {
                    batchEndBalance: data.batchEndBalance,
                    batchStatus: data.batchStatus,
                    timestamp: new Date().toISOString()
                });
            } else {
                // Show current user balance when no batch, batch in progress, or batch not completed
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
                cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] Using current user balance", {
                    currentBalance,
                    formattedBalance: displayValue,
                    batchStatus: data.batchStatus,
                    timestamp: new Date().toISOString()
                });
            }

            cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] Setting endBalanceLabel", {
                from: previousValue,
                to: displayValue,
                timestamp: new Date().toISOString()
            });

            this.endBalanceLabel.string = displayValue;

            cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] endBalanceLabel updated successfully", {
                finalValue: this.endBalanceLabel.string,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_END_BALANCE] endBalanceLabel not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_END_BALANCE] updateEndBalanceLabel completed", {
            finalValue: this.endBalanceLabel?.string,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Update HyperSpin rounds button interactability
     */
    @render(HyperSpinStore, (store) => ({
        canDecrease: store.roundsList.indexOf(store.selectedRoundOnPopup) > 0,
        canIncrease: store.roundsList.indexOf(store.selectedRoundOnPopup) < store.roundsList.length - 1
    }))
    updateHyperSpinRoundsButtonsInteractable({ canDecrease, canIncrease }: { canDecrease: boolean; canIncrease: boolean }) {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] updateHyperSpinRoundsButtonsInteractable called", {
            canDecrease,
            canIncrease,
            hasDecreaseBtn: !!this.hyperSpinRoundsDecreaseBtn,
            hasIncreaseBtn: !!this.hyperSpinRoundsIncreaseBtn,
            currentDecreaseInteractable: this.hyperSpinRoundsDecreaseBtn?.interactable,
            currentIncreaseInteractable: this.hyperSpinRoundsIncreaseBtn?.interactable,
            timestamp: new Date().toISOString()
        });

        if (this.hyperSpinRoundsDecreaseBtn) {
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Setting decrease button interactable", {
                from: this.hyperSpinRoundsDecreaseBtn.interactable,
                to: canDecrease,
                timestamp: new Date().toISOString()
            });

            this.hyperSpinRoundsDecreaseBtn.interactable = canDecrease;
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Decrease button not available", {
                timestamp: new Date().toISOString()
            });
        }

        if (this.hyperSpinRoundsIncreaseBtn) {
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Setting increase button interactable", {
                from: this.hyperSpinRoundsIncreaseBtn.interactable,
                to: canIncrease,
                timestamp: new Date().toISOString()
            });

            this.hyperSpinRoundsIncreaseBtn.interactable = canIncrease;
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Increase button not available", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] Button interactability updated", {
            canDecrease,
            canIncrease,
            finalDecreaseInteractable: this.hyperSpinRoundsDecreaseBtn?.interactable,
            finalIncreaseInteractable: this.hyperSpinRoundsIncreaseBtn?.interactable,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_ROUNDS] updateHyperSpinRoundsButtonsInteractable completed", {
            canDecrease,
            canIncrease,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Sync balance label from CascadingUIStore
     * Matches the behavior of cascading-slot-game.ts setBalance method
     */
    @render(CascadingUIStore, (store) => ({ balance: store.userBalance, changedBalance: store.changeUserBalance }))
    private renderBalance(data: { balance: number; changedBalance: boolean }) {
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderBalance called - Syncing balance label", {
            data,
            balance: data?.balance,
            changedBalance: data?.changedBalance,
            balanceLabelExists: !!this.balanceLabel,
            timestamp: new Date().toISOString()
        });

        if (!data || !data.changedBalance) {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderBalance - No data or balance not changed, skipping", {
                hasData: !!data,
                changedBalance: data?.changedBalance,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const value = data.balance;
        if (value === undefined || value === null) {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderBalance - Balance value is invalid, skipping", {
                value,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const formattedBalance = gc.FormatUtils.truncateFixedDecimals(value, 2).toString();
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderBalance - Setting balance label", {
            value,
            formattedBalance,
            timestamp: new Date().toISOString()
        });
        this.balanceLabel && (this.balanceLabel.string = formattedBalance);
        cascadingSlotLogger.info("[HYPER_SPIN_BET_CONTROL] renderBalance completed", {
            value,
            formattedBalance,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Render total bet value and update slider display
     * Default value: current Total Bet value
     * Number format: number with thousand separator and up to 2 decimals
     */
    @render(BetControlStore, (store) => ({ totalBet: store.totalBet, currentTotalBetIndex: store.currentTotalBetIndex, totalBetUnique: store.totalBetUnique }))
    private renderTotalBet(data: { totalBet: number; currentTotalBetIndex: number; totalBetUnique: any[] }) {
        cascadingSlotLogger.info("[TOTAL_BET] renderTotalBet called", {
            totalBet: data.totalBet,
            currentTotalBetIndex: data.currentTotalBetIndex,
            totalBetUniqueLength: data.totalBetUnique?.length,
            timestamp: new Date().toISOString()
        });

        if (data.totalBetUnique && data.totalBetUnique.length > 0) {
            this.updateTotalBetDisplay(data.totalBet, data.currentTotalBetIndex, data.totalBetUnique);
        } else {
            cascadingSlotLogger.warn("[TOTAL_BET] renderTotalBet - totalBetUnique is empty, skipping update");
        }
    }

    /**
     * Update total bet display including slider and label
     * @param totalBet - Current total bet value
     * @param currentIndex - Current index in totalBetUnique array
     * @param totalBetUnique - Array of unique total bet values
     */
    private updateTotalBetDisplay(totalBet: number, currentIndex: number, totalBetUnique: any[]) {
        cascadingSlotLogger.info("[TOTAL_BET] updateTotalBetDisplay called", {
            totalBet,
            currentIndex,
            totalBetUniqueLength: totalBetUnique.length
        });

        // Format value with thousand separator and up to 2 decimals
        const formattedValue = gc.FormatUtils.numberWithCommas(totalBet, 2, true);
        cascadingSlotLogger.info("[TOTAL_BET] Formatted value", { totalBet, formattedValue });

        // Find the slider - try multiple methods
        let slider: Slider = null;

        // Method 1: Try to find slider node by name
        const sliderNode = this.node.getChildByName("total-bet-slider");
        if (sliderNode) {
            slider = sliderNode.getComponent(Slider);
            if (slider) {
                cascadingSlotLogger.info("[TOTAL_BET] Found slider via node name");
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
                cascadingSlotLogger.info("[TOTAL_BET] Found slider by searching children");
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

            cascadingSlotLogger.info("[TOTAL_BET] Slider calculation", {
                totalBet,
                minBet,
                maxBet,
                currentIndex,
                sliderPercentage: `${(clampedProgress * 100).toFixed(2)}%`,
                willUpdate: progressDiff > 0.0001
            });

            if (progressDiff > 0.0001) {
                slider.progress = clampedProgress;
                cascadingSlotLogger.info("[TOTAL_BET] Slider progress updated", {
                    from: currentProgress,
                    to: clampedProgress
                });
            }
        } else {
            cascadingSlotLogger.warn("[TOTAL_BET] Could not find slider component");
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
            cascadingSlotLogger.info("[TOTAL_BET] Label updated", { value: totalBetLabel.string });
        } else {
            cascadingSlotLogger.info("[TOTAL_BET] Total bet slider label not found (this is optional)");
        }

        // Also update totalBetPerRoundSliderLabel and totalBetPerRoundLabel when total bet changes
        if (this.totalBetPerRoundSliderLabel) {
            this.totalBetPerRoundSliderLabel.string = formattedValue;
            cascadingSlotLogger.info("[TOTAL_BET] totalBetPerRoundSliderLabel updated", { value: this.totalBetPerRoundSliderLabel.string });
        }

        if (this.totalBetPerRoundLabel) {
            this.totalBetPerRoundLabel.string = formattedValue;
            cascadingSlotLogger.info("[TOTAL_BET] totalBetPerRoundLabel updated", { value: this.totalBetPerRoundLabel.string });
        }
    }
}


