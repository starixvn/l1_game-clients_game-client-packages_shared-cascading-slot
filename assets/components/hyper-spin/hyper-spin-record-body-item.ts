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
                        cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] Found label dynamically", {
                            pattern,
                            nodeName: node.name,
                            timestamp: new Date().toISOString()
                        });
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
        cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] setSpinData called", {
            spinData,
            hasLabels: {
                lblSpinValue: !!this.lblSpinValue,
                lblWinValue: !!this.lblWinValue,
                lblBalance: !!this.lblBalance,
                lblMultiplierValue: !!this.lblMultiplierValue
            },
            hasNode: !!this.node,
            timestamp: new Date().toISOString()
        });

        // 2.1: assign spin.spinId to lbl-spin-value
        const lblSpinValue = this.lblSpinValue || this.findLabelByName(["lbl-spin-value", "spin-value", "spin"]);
        if (lblSpinValue) {
            lblSpinValue.string = spinData.spinId.toString();
            cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] Set spin ID", {
                spinId: spinData.spinId,
                labelString: lblSpinValue.string,
                labelName: lblSpinValue.node.name,
                wasFoundDynamically: !this.lblSpinValue,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_RECORD_BODY_ITEM] lblSpinValue not found", {
                spinId: spinData.spinId,
                timestamp: new Date().toISOString()
            });
        }

        // 2.2: assign spin.spinWinAmount to lbl-win-value
        const lblWinValue = this.lblWinValue || this.findLabelByName(["lbl-win-value", "win-value", "win"]);
        if (lblWinValue) {
            lblWinValue.string = spinData.spinWinAmount;
            cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] Set win amount", {
                winAmount: spinData.spinWinAmount,
                labelString: lblWinValue.string,
                labelName: lblWinValue.node.name,
                wasFoundDynamically: !this.lblWinValue,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_RECORD_BODY_ITEM] lblWinValue not found", {
                winAmount: spinData.spinWinAmount,
                timestamp: new Date().toISOString()
            });
        }

        // 2.3: assign spin.spinBalance to lbl-balance
        const lblBalance = this.lblBalance || this.findLabelByName(["lbl-balance", "balance"]);
        if (lblBalance) {
            lblBalance.string = spinData.spinBalance;
            cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] Set balance", {
                balance: spinData.spinBalance,
                labelString: lblBalance.string,
                labelName: lblBalance.node.name,
                wasFoundDynamically: !this.lblBalance,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_RECORD_BODY_ITEM] lblBalance not found", {
                balance: spinData.spinBalance,
                timestamp: new Date().toISOString()
            });
        }

        // 2.4: assign spin.spinWinMultiplier to lbl-multiplier-value
        const lblMultiplierValue = this.lblMultiplierValue || this.findLabelByName(["lbl-multiplier-value", "multiplier-value", "multiplier"]);
        if (lblMultiplierValue) {
            lblMultiplierValue.string = spinData.spinWinMultiplier;
            cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] Set multiplier", {
                multiplier: spinData.spinWinMultiplier,
                labelString: lblMultiplierValue.string,
                labelName: lblMultiplierValue.node.name,
                wasFoundDynamically: !this.lblMultiplierValue,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_RECORD_BODY_ITEM] lblMultiplierValue not found", {
                multiplier: spinData.spinWinMultiplier,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] setSpinData completed", {
            spinData,
            labelsFound: {
                lblSpinValue: !!lblSpinValue,
                lblWinValue: !!lblWinValue,
                lblBalance: !!lblBalance,
                lblMultiplierValue: !!lblMultiplierValue
            },
            timestamp: new Date().toISOString()
        });
    }

    onLoad() {
        super.onLoad();
        cascadingSlotLogger.info("[HYPER_SPIN_RECORD_BODY_ITEM] onLoad called", {
            hasNode: !!this.node,
            timestamp: new Date().toISOString()
        });
    }
}
