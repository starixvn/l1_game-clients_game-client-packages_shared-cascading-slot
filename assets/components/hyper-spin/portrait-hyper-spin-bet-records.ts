import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Prefab, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { HyperSpinStore, HyperSpinBatchData } from "../../stores/hyper-spin-store";
import HyperSpinRecordBodyItem from "../hyper-spin/hyper-spin-record-body-item";

const { ccclass, menu, property } = _decorator;
const { render } = Observer;

@ccclass("HyperSpinBetRecords")
@menu('UI/HyperSpinBetRecords')
export class HyperSpinBetRecords extends ObserverComponent {
    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @property(Prefab)
    prfHyperSpinRecordBodyItem: Prefab = null;

    @property(Node)
    hyperSpinRecordBodyContentNode: Node = null;

    @property(Label)
    startingBalanceLabel: Label = null;

    @property(Label)
    endBalanceLabel: Label = null;

    @property(Label)
    hyperTotalWinValue: Label = null;

    @property(Label)
    lblTotalBetValue: Label = null;

    @property(Label)
    lblHyperSpinStatus: Label = null;

    @property(Node)
    endBalanceNode: Node = null;

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
            const node = instantiate(this.prfHyperSpinRecordBodyItem);
            const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

            if (recordBodyItem) {
                const spinData = {
                    spinId: spin.spinId,
                    spinWinAmount: spin.spinWinAmount || "0.00",
                    spinWinAmountRaw: spin.spinWinAmountRaw || 0,
                    spinBalance: spin.spinBalance || "0.00",
                    spinWinMultiplier: spin.spinWinMultiplier || "0.00x"
                };

                recordBodyItem.setSpinData(spinData);
            }

            this.hyperSpinRecordBodyContentNode.addChild(node);
        });
    }

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

        if (newSpinsCount > 0) {
            const spinsToAdd = spins.slice(currentChildrenCount);

            spinsToAdd.forEach((spin, idx) => {
                const node = instantiate(this.prfHyperSpinRecordBodyItem);
                const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

                if (recordBodyItem) {
                    const spinData = {
                        spinId: spin.spinId,
                        spinWinAmount: spin.spinWinAmount || "0.00",
                        spinWinAmountRaw: spin.spinWinAmountRaw || 0,
                        spinBalance: spin.spinBalance || "0.00",
                        spinWinMultiplier: spin.spinWinMultiplier || "0.00x"
                    };

                    recordBodyItem.setSpinData(spinData);

                }

                this.hyperSpinRecordBodyContentNode.addChild(node);
            });

        } else if (newSpinsCount < 0) {
            this.initHyperSpinRecords(spins);
        }
    }

    @render(HyperSpinStore, (store) => {
        const spinsLength = store.spinsLength;
        const batchData = store.currentBatchData;
        return batchData ? { batchData, spinsLength } : null;
    })
    private renderHyperSpinRecords(data: { batchData: HyperSpinBatchData; spinsLength: number } | null) {
        const spins = data?.batchData?.spins;

        if (spins && Array.isArray(spins)) {
            const currentChildrenCount = this.hyperSpinRecordBodyContentNode?.children?.length || 0;

            if (currentChildrenCount === 0) {
                this.initHyperSpinRecords(spins);
            } else {
                this.appendNewSpinRecords(spins);
            }
        } else {
            if (this.hyperSpinRecordBodyContentNode) {
                this.hyperSpinRecordBodyContentNode.destroyAllChildren();
            }
        }
    }


    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalWin)
    private updateHyperTotalWinValue(totalWin: string) {
        if (this.hyperTotalWinValue) {
            const displayValue = totalWin || "0.00";

            this.hyperTotalWinValue.string = displayValue;
        }
    }


    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.totalBet)
    private updateLblTotalBetValue(totalBet: string) {
        if (this.lblTotalBetValue) {
            const displayValue = totalBet || "0.00";

            this.lblTotalBetValue.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        batchStartingBalance: store.currentBatchData?.summary?.startingBalance,
        hasBatchData: !!store.currentBatchData
    }))
    private updateStartingBalanceLabel(data: { batchStartingBalance: string; hasBatchData: boolean }) {
        if (this.startingBalanceLabel) {
            let displayValue: string;

            if (data.hasBatchData && data.batchStartingBalance) {
                displayValue = data.batchStartingBalance;
            } else {
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.startingBalanceLabel.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        batchEndBalance: store.currentBatchData?.summary?.endBalance,
        hasBatchData: !!store.currentBatchData,
        batchStatus: store.currentBatchData?.summary?.hyperSpinStatus
    }))
    private updateEndBalanceLabel(data: { batchEndBalance: string; hasBatchData: boolean; batchStatus: string }) {
        if (this.endBalanceLabel) {
            let displayValue: string;

            if (data.hasBatchData && data.batchStatus === "Ready" && data.batchEndBalance && data.batchEndBalance !== "0.00") {
                displayValue = data.batchEndBalance;
            } else {
                const container = (this as any).container;
                const currentBalance = container?.get(CascadingUIStore)?.userBalance ?? 0;
                displayValue = gc.FormatUtils.numberWithCommas(currentBalance, 2, true);
            }

            this.endBalanceLabel.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => store.currentBatchData?.summary?.hyperSpinStatus)
    private updateHyperSpinStatusLabel(hyperSpinStatus: string) {
        if (this.lblHyperSpinStatus) {
            const displayValue = hyperSpinStatus?.toUpperCase() || "";
            this.lblHyperSpinStatus.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        batchStatus: store.currentBatchData?.summary?.hyperSpinStatus,
        batchEndBalance: store.currentBatchData?.summary?.endBalance,
        hasBatchData: !!store.currentBatchData
    }))
    private updateEndBalanceNodeVisibility(data: { batchStatus: string; batchEndBalance: string; hasBatchData: boolean }) {
        if (this.endBalanceNode) {
            // Show endBalanceNode only when batch is completed (Ready status) and endBalance is set
            const shouldShow = data.hasBatchData &&
                data.batchStatus === "Ready" &&
                data.batchEndBalance &&
                data.batchEndBalance !== "0.00";
            this.endBalanceNode.active = shouldShow;
        }
    }

}

