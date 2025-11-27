import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Prefab, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { HyperSpinStore, HyperSpinBatchData, HyperSpinSingleSpinData, CascadeRecord } from "../../stores/hyper-spin-store";
import HyperSpinRecordBodyItem from "../hyper-spin/hyper-spin-record-body-item";

// Mock data flag - set to true to use mock data for testing
const USE_MOCK_DATA = true;

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

        // For decreasing sort order, render cascade records first, then main records
        // This ensures cascade records appear below their parent when sorted in reverse
        spins.forEach((spin, idx) => {
            // First render cascade records (they will appear below parent in reverse sort)
            // Only render for winning spins that have winTag and cascade records
            if (spin.cascadeRecords && spin.cascadeRecords.length > 0 && spin.winTag) {
                spin.cascadeRecords.forEach((cascadeRecord) => {
                    this.renderCascadeRecord(spin.spinId, cascadeRecord);
                });
            }

            // Then render main spin record
            this.renderSpinRecord(spin);
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

        // For simplicity, if the counts don't match, re-initialize everything
        // In a more complex implementation, we could track which records are cascade records
        // and only append the new ones. For now, we'll re-init when there are changes.
        const expectedCount = this.calculateExpectedRecordCount(spins);
        if (expectedCount !== currentChildrenCount) {
            this.initHyperSpinRecords(spins);
        }
    }

    private calculateExpectedRecordCount(spins: HyperSpinBatchData['spins']): number {
        let count = 0;
        spins.forEach(spin => {
            count++; // Main spin record
            if (spin.cascadeRecords && spin.cascadeRecords.length > 0 && spin.winTag) {
                count += spin.cascadeRecords.length; // Cascade records only for winning spins with winTag
            }
        });
        return count;
    }

    private renderSpinRecord(spin: HyperSpinSingleSpinData) {
        const node = instantiate(this.prfHyperSpinRecordBodyItem);
        const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

        if (recordBodyItem) {
            const spinData = {
                spinId: spin.spinId,
                spinWinAmount: spin.spinWinAmount || "0.00",
                spinWinAmountRaw: spin.spinWinAmountRaw || 0,
                spinBalance: spin.spinBalance || "0.00",
                spinWinMultiplier: spin.spinWinMultiplier || "0.00x",
                isCascadeRecord: false, // Main spin records are not cascade records
                winTag: spin.winTag // Pass winTag for sprite activation
            };

            recordBodyItem.setSpinData(spinData);
        }

        this.hyperSpinRecordBodyContentNode.addChild(node);
    }

    private renderCascadeRecord(parentSpinId: string | number, cascadeRecord: CascadeRecord) {
        const node = instantiate(this.prfHyperSpinRecordBodyItem);
        const recordBodyItem = node.getComponent(HyperSpinRecordBodyItem);

        if (recordBodyItem) {
            // For cascade records, show step number and cascade win data
            const spinData = {
                spinId: `↳ ${cascadeRecord.step}`, // Arrow + step number
                spinWinAmount: cascadeRecord.winAmountFormatted,
                spinWinAmountRaw: cascadeRecord.winAmount,
                spinBalance: "-", // No balance change for cascade steps
                spinWinMultiplier: cascadeRecord.multiplierFormatted,
                isCascadeRecord: true // Mark as cascade record for special styling
            };

            recordBodyItem.setSpinData(spinData);
        }

        this.hyperSpinRecordBodyContentNode.addChild(node);
    }

    @render(HyperSpinStore, (store) => {
        const spinsLength = store.spinsLength;
        const batchData = store.currentBatchData;
        return USE_MOCK_DATA ? { useMockData: true, store } : (batchData ? { batchData, spinsLength } : null);
    })
    private renderHyperSpinRecords(data: { batchData?: HyperSpinBatchData; spinsLength?: number; useMockData?: boolean; store?: HyperSpinStore } | null) {
        if (USE_MOCK_DATA && data?.useMockData && data?.store) {
            // Use mock data for testing
            this.loadMockData(data.store);
        } else {
            const spins = data?.batchData?.spins;

            if (spins && Array.isArray(spins)) {
                // Always re-initialize for now since the structure is more complex
                // with cascade records mixed in. Could be optimized later.
                this.initHyperSpinRecords(spins);
            } else {
                if (this.hyperSpinRecordBodyContentNode) {
                    this.hyperSpinRecordBodyContentNode.destroyAllChildren();
                }
            }
        }
    }

    private loadMockData(store: HyperSpinStore) {
        // Get mock data from the store instance passed by the render decorator
        const mockData = store.getMockBatchData();

        if (mockData && mockData.spins) {
            console.warn("🎭 [MOCK_DATA] Loading mock hyper-spin batch data", {
                totalSpins: mockData.spins.length,
                totalBet: mockData.summary.totalBet,
                totalWin: mockData.summary.totalWin,
                spinsWithCascades: mockData.spins.filter(s => s.cascadeRecords && s.cascadeRecords.length > 0).length,
                spinsWithWinTags: mockData.spins.filter(s => s.winTag).length,
                freeSpins: mockData.spins.filter(s => s.isFreeSpin).length
            });

            // Log some example spins for verification
            const examples = mockData.spins.slice(0, 5).map((spin, i) => ({
                spinId: spin.spinId,
                winAmount: spin.spinWinAmount,
                winTag: spin.winTag,
                hasCascades: !!(spin.cascadeRecords && spin.cascadeRecords.length > 0),
                isFreeSpin: spin.isFreeSpin
            }));
            console.warn("🎭 [MOCK_DATA] Example spins:", examples);

            this.initHyperSpinRecords(mockData.spins);
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

