import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";

const { ccclass, property } = _decorator;

@ccclass
export default class HyperSpinRecordBodyItem extends ObserverComponent {
    @property(Label)
    lblSpinValue: Label = null;

    @property(Label)
    lblWinValue: Label = null;

    @property(Label)
    lblBalance: Label = null;

    @property(Label)
    lblMultiplierValue: Label = null;

    @property(Node)
    winningBgNode: Node = null;

    @property(Node)
    cascadeArrowIcon: Node = null;

    @property(Node)
    cascadeRecordBgNode: Node = null; // Background for cascade records

    /**
     * Set the spin record data
     * Follows the same pattern as HyperSpinRoundNumber.setValue
     */
    setSpinData(spinData: {
        spinId: string | number;
        spinWinAmount: string;
        spinWinAmountRaw: number;
        spinBalance: string;
        spinWinMultiplier: string;
        isCascadeRecord?: boolean;
    }) {

        // Check if this is a cascade record
        const isCascadeRecord = spinData.isCascadeRecord === true;

        // 2.1: handle spinId display - show arrow icon for cascade records
        if (this.lblSpinValue) {
            if (isCascadeRecord) {
                // For cascade records, show the step identifier (e.g., "↳ 1")
                this.lblSpinValue.node.active = true;
                this.lblSpinValue.string = spinData.spinId.toString();
            } else {
                // For regular records, show the spin ID
                this.lblSpinValue.node.active = true;
                this.lblSpinValue.string = spinData.spinId.toString();
            }
        }

        // Show/hide cascade arrow icon (for down arrow icon)
        if (this.cascadeArrowIcon) {
            this.cascadeArrowIcon.active = false; // Not used in new structure
        }

        // Show/hide cascade record background
        if (this.cascadeRecordBgNode) {
            this.cascadeRecordBgNode.active = isCascadeRecord;
        }

        // 2.2: assign spin.spinWinAmount to lbl-win-value
        if (this.lblWinValue) {
            this.lblWinValue.string = spinData.spinWinAmount;
        }

        // 2.3: assign spin.spinBalance to lbl-balance
        if (this.lblBalance) {
            this.lblBalance.string = spinData.spinBalance;
        }

        // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
        if (this.lblMultiplierValue) {
            this.lblMultiplierValue.string = spinData.spinWinMultiplier;
        }

        // 2.5: activate winningBgNode for winning records (including cascade records as children of winning records)
        if (this.winningBgNode) {
            this.winningBgNode.active = spinData.spinWinAmountRaw > 0;
        }
    }
}
