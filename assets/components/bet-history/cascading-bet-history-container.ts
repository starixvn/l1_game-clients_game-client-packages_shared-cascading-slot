import gc from "@sg/game-client-base";
import { _decorator, Node, Prefab } from "cc";
import { InGameMenuEvents } from "db://shared-components/game/in-game-menu/scripts/stores/in-game-menu-events";
import { InGameMenuStore } from "db://shared-components/game/in-game-menu/scripts/stores/in-game-menu-store";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";
import { CascadingBetHistoryTable } from "./cascading-bet-history-table";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Initializing CascadingBetHistoryContainer class');

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export class CascadingBetHistoryContainer extends NodeContainer {
    wrapperNode: Node = null;
    table: CascadingBetHistoryTable = null;

    @property(Prefab)
    headerPrefab: Prefab = null;

    @property(Prefab)
    bodyItemPrefab: Prefab = null;

    @handle(gc.BetHistory.BetHistoryHandlers.BetHistoryCallServiceHandler, (handler) => handler.handle(1))
    hanldeShowBetHistory() {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Handling bet history service call');
    }

    @render(InGameMenuStore, (store) => store.event, { fireImmediately: false })
    openBetHistory({ event }: { event: InGameMenuEvents }) {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Open bet history event received:', { event, isOpenHistory: event === InGameMenuEvents.OPEN_HISTORY });
        if (event === InGameMenuEvents.OPEN_HISTORY) {
            this.hanldeShowBetHistory();
        }
    }

    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: false })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Showing bet history:', {
            hasWrapperNode: !!this.wrapperNode,
            wrapperNodeActive: this.wrapperNode?.active,
            hasTable: !!this.table,
            hasHeaderPrefab: !!this.headerPrefab,
            hasBodyItemPrefab: !!this.bodyItemPrefab,
            betHistoryModel: betHistoryModel
        });

        if (!this.wrapperNode?.active) {
            cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Creating new wrapper node and table component');
            this.wrapperNode = this.createNode();
            this.table = this.wrapperNode.getComponent(CascadingBetHistoryTable);
        }

        this.table.showBetHistory({
            data: betHistoryModel,
            headerPrefab: this.headerPrefab,
            bodyItemPrefab: this.bodyItemPrefab,
        });

        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Bet history display initiated');
    }

    @render(gc.Dialogs.DialogsStore, (store) => store.forceClosed, { fireImmediately: false })
    popupVisibility(forceClosed: any) {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Popup visibility change:', { forceClosed, hasWrapperNode: !!this.wrapperNode });
        if (forceClosed && this.wrapperNode) {
            cascadingSlotLogger.info('[CASCADING_BET_HISTORY_CONTAINER] Destroying wrapper node due to force close');
            this.wrapperNode.destroy();
        }
    }
}



