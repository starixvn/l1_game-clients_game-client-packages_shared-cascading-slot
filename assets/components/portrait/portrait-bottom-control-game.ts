import { _decorator, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitBottomControlGame extends ObserverComponent {
    @property(Node)
    nodeFreeSpinsSections: Node = null;

    @property(Label)
    labelFreeSpinsCount: Label = null;

    @property(Node)
    nodeLastFreeSpin: Node = null;

    @render(CascadingUIStore, (store) => store.showFreeSpinsSectionsPortrait)
    setShowFreeSpinsSectionsPortrait(showFreeSpinsSectionsPortrait: boolean) {
        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] setShowFreeSpinsSectionsPortrait called", {
            showFreeSpinsSectionsPortrait,
            hasNodeFreeSpinsSections: !!this.nodeFreeSpinsSections,
            currentActive: this.nodeFreeSpinsSections?.active,
            willSetActive: true,
            timestamp: new Date().toISOString()
        });

        if (showFreeSpinsSectionsPortrait) {
            cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Showing free spins sections", {
                timestamp: new Date().toISOString()
            });
            this.nodeFreeSpinsSections.active = true;
        } else {
            cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Hiding free spins sections", {
                timestamp: new Date().toISOString()
            });
            this.nodeFreeSpinsSections.active = false;
        }

        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Free spins sections visibility set", {
            showFreeSpinsSectionsPortrait,
            finalActive: this.nodeFreeSpinsSections.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.freespinCountMsgBottom)
    setFreeSpinsCount(freespinCountMsgBottom: number) {
        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] setFreeSpinsCount called", {
            freespinCountMsgBottom,
            hasNodeFreeSpinsSections: !!this.nodeFreeSpinsSections,
            hasLabelFreeSpinsCount: !!this.labelFreeSpinsCount,
            hasNodeLastFreeSpin: !!this.nodeLastFreeSpin,
            willFindChildNode: true,
            willSetNodeStates: true,
            willSetLabelText: true,
            timestamp: new Date().toISOString()
        });

        const nodeRemainingFreeSpins = this.nodeFreeSpinsSections.getChildByName("remaining-freespins");
        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Found remaining freespins node", {
            hasNodeRemainingFreeSpins: !!nodeRemainingFreeSpins,
            nodeName: nodeRemainingFreeSpins?.name,
            timestamp: new Date().toISOString()
        });

        if (freespinCountMsgBottom === 0) {
            cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Free spins count is 0, showing last free spin", {
                willActivateLastFreeSpin: true,
                willDeactivateRemaining: true,
                timestamp: new Date().toISOString()
            });
            this.nodeLastFreeSpin.active = true;
            nodeRemainingFreeSpins.active = false;
        } else {
            cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Free spins count > 0, showing remaining freespins", {
                freespinCountMsgBottom,
                willDeactivateLastFreeSpin: true,
                willActivateRemaining: true,
                timestamp: new Date().toISOString()
            });
            this.nodeLastFreeSpin.active = false;
            nodeRemainingFreeSpins.active = true;
        }

        this.labelFreeSpinsCount.string = freespinCountMsgBottom.toString();
        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] Free spins count label set", {
            labelText: freespinCountMsgBottom.toString(),
            finalLastFreeSpinActive: this.nodeLastFreeSpin.active,
            finalRemainingActive: nodeRemainingFreeSpins.active,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[PORTRAIT_BOTTOM_CONTROL_GAME] setFreeSpinsCount completed", {
            freespinCountMsgBottom,
            timestamp: new Date().toISOString()
        });
    }
}



