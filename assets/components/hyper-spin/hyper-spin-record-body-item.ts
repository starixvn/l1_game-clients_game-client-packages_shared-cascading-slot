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
    }) {

        // 2.1: assign spin.spinId to lbl-spin-value
        if (this.lblSpinValue) {
            this.lblSpinValue.string = spinData.spinId.toString();
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

        // 2.5: activate winningBgNode if this is a winning record
        if (this.winningBgNode) {
            this.winningBgNode.active = spinData.spinWinAmountRaw > 0;
        }
    }
}
