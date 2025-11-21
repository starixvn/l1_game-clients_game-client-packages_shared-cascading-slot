import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";

import { cascadingSlotLogger } from "../../cascading-slot-logger";

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

    /**
     * Find label by name pattern (fallback if @property is not assigned in prefab)
     */
    private findLabelByName(namePatterns: string[]): Label | null {
        if (!this.node) return null;

        const findLabel = (node: Node): Label | null => {
            // Check if node name matches any pattern
            for (const pattern of namePatterns) {
                if (node.name && node.name.includes(pattern)) {
                    const label = node.getComponent(Label);
                    if (label) {
                        return label;
                    }
                }
            }
            // Search children recursively
            for (let i = 0; i < node.children.length; i++) {
                const found = findLabel(node.children[i]);
                if (found) return found;
            }
            return null;
        };

        return findLabel(this.node);
    }

    /**
     * Set the spin record data
     * Follows the same pattern as HyperSpinRoundNumber.setValue
     */
    setSpinData(spinData: {
        spinId: string | number;
        spinWinAmount: string;
        spinBalance: string;
        spinWinMultiplier: string;
    }) {

        // 2.1: assign spin.spinId to lbl-spin-value
        const lblSpinValue = this.lblSpinValue || this.findLabelByName(["lbl-spin-value", "spin-value", "spin"]);
        if (lblSpinValue) {
            lblSpinValue.string = spinData.spinId.toString();
        } else {
        }

        // 2.2: assign spin.spinWinAmount to lbl-win-value
        const lblWinValue = this.lblWinValue || this.findLabelByName(["lbl-win-value", "win-value", "win"]);
        if (lblWinValue) {
            lblWinValue.string = spinData.spinWinAmount;
        } else {
        }

        // 2.3: assign spin.spinBalance to lbl-balance
        const lblBalance = this.lblBalance || this.findLabelByName(["lbl-balance", "balance"]);
        if (lblBalance) {
            lblBalance.string = spinData.spinBalance;
        } else {
        }

        // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
        const lblMultiplierValue = this.lblMultiplierValue || this.findLabelByName(["lbl-multiplier-value", "multiplier-value", "multiplier"]);
        if (lblMultiplierValue) {
            lblMultiplierValue.string = spinData.spinWinMultiplier;
        } else {
        }

    }

    onLoad() {
        super.onLoad();
    }
}
