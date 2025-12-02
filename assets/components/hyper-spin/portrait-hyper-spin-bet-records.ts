import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { DetailRecord, HyperSpinBatchData, HyperSpinSingleSpinData, HyperSpinStore } from "../../stores/hyper-spin-store";
import HyperSpinRecordBodyItem from "../hyper-spin/hyper-spin-record-body-item";

const { ccclass, menu, property } = _decorator;
const { render } = Observer;

@ccclass("HyperSpinBetRecords")
@menu('UI/HyperSpinBetRecords')
export class HyperSpinBetRecords extends ObserverComponent {
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
        if (!spins || spins.length === 0) {
            return;
        }

        console.trace('initHyperSpinRecords');
        this.hyperSpinRecordBodyContentNode.destroyAllChildren();

        // For decreasing sort order, render cascade records first, then main records
        // This ensures cascade records appear below their parent when sorted in reverse
        spins.forEach((spin) => {
            // Then render main spin record
            this.renderSpinRecord(spin);
        });
    }

    private renderSpinRecord(spin: HyperSpinSingleSpinData) {
        const node = instantiate(this.prfHyperSpinRecordBodyItem);
        const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

        if (recordBodyItem) {
            const spinData = {
                spinId: spin.spinId,
                spinWinAmount: spin.totalWin || 0,
                spinBalance: spin.balanceBefore || 0,
                spinWinMultiplier: spin.totalMultiplier || 0,
                isCascadeRecord: false // Main spin records are not cascade records
            };

            recordBodyItem.setSpinData(spinData);
        }

        this.hyperSpinRecordBodyContentNode.addChild(node);
    }

    private renderCascadeRecord(parentSpinId: string | number, cascadeRecord: DetailRecord) {
        // const node = instantiate(this.prfHyperSpinRecordBodyItem);
        // const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

        // if (recordBodyItem) {
        //     // For cascade records, show step number and cascade win data
        //     const spinData = {
        //         spinId: `↳ ${cascadeRecord.step}`, // Arrow + step number
        //         spinWinAmount: cascadeRecord.winAmountFormatted,
        //         spinWinAmountRaw: cascadeRecord.winAmount,
        //         spinBalance: "-", // No balance change for cascade steps
        //         spinWinMultiplier: cascadeRecord.multiplierFormatted,
        //         isCascadeRecord: true // Mark as cascade record for special styling
        //     };

        //     recordBodyItem.setSpinData(spinData);
        // }

        // this.hyperSpinRecordBodyContentNode.addChild(node);
    }

    @render(HyperSpinStore, (store) => store.spinBatchData)
    private renderHyperSpinRecords(data: HyperSpinBatchData) {
        if (!data) {
            return;
        }

        const spins = data?.spins;
        if (spins) {
            // Always re-initialize for now since the structure is more complex
            // with cascade records mixed in. Could be optimized later.
            this.initHyperSpinRecords(spins);
        }
    }


    @render(HyperSpinStore, (store) => store.spinBatchData?.summary?.totalWin)
    private updateHyperTotalWinValue(totalWin: string) {
        if (this.hyperTotalWinValue) {
            const displayValue = totalWin || "0.00";

            this.hyperTotalWinValue.string = displayValue;
        }
    }


    @render(HyperSpinStore, (store) => store.spinBatchData?.summary?.totalBet)
    private updateLblTotalBetValue(totalBet: string) {
        if (this.lblTotalBetValue) {
            const displayValue = totalBet || "0.00";

            this.lblTotalBetValue.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        batchStartingBalance: store.spinBatchData?.summary?.startingBalance,
        hasBatchData: !!store.spinBatchData
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
        batchEndBalance: store.spinBatchData?.summary?.endBalance,
        hasBatchData: !!store.spinBatchData,
        batchStatus: store.spinBatchData?.summary?.hyperSpinStatus
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

    @render(HyperSpinStore, (store) => store.spinBatchData?.summary?.hyperSpinStatus)
    private updateHyperSpinStatusLabel(hyperSpinStatus: string) {
        if (this.lblHyperSpinStatus) {
            const displayValue = hyperSpinStatus?.toUpperCase() || "";
            this.lblHyperSpinStatus.string = displayValue;
        }
    }

    @render(HyperSpinStore, (store) => ({
        batchStatus: store.spinBatchData?.summary?.hyperSpinStatus,
        batchEndBalance: store.spinBatchData?.summary?.endBalance,
        hasBatchData: !!store.spinBatchData
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

