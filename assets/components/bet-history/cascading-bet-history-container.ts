import gc from "@sg/game-client-base";
const { MainPlayerStore } = gc.Player;
import { _decorator, Node, Prefab } from "cc";
import { InGameMenuEvents } from "db://shared-components/game/in-game-menu/scripts/stores/in-game-menu-events";
import { InGameMenuStore } from "db://shared-components/game/in-game-menu/scripts/stores/in-game-menu-store";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";
import { CascadingBetHistoryTable } from "./cascading-bet-history-table";
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

    xMode = 1;

    @handle(gc.BetHistory.BetHistoryHandlers.BetHistoryCallServiceHandler, (handler) => handler.handle(1))
    hanldeShowBetHistory() {}

    @render(InGameMenuStore, (store) => store.event, { fireImmediately: false })
    openBetHistory({ event }: { event: InGameMenuEvents }) {
        if (event === InGameMenuEvents.OPEN_HISTORY) {
            this.hanldeShowBetHistory();
        }
    }

    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: false })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        if (!this.wrapperNode?.active) {
            this.wrapperNode = this.createNode();
            this.table = this.wrapperNode.getComponent(CascadingBetHistoryTable);
        }

        this.table.showBetHistory({
            data: betHistoryModel,
            headerPrefab: this.headerPrefab,
            bodyItemPrefab: this.bodyItemPrefab,
            xMode: this.xMode,
        });
    }

    @render(MainPlayerStore, (store) => store.xMode)
    setXMode(value: number) {
        this.xMode = value;
    }

    @render(gc.Dialogs.DialogsStore, (store) => store.forceClosed, { fireImmediately: false })
    popupVisibility(forceClosed: any) {
        forceClosed && this.wrapperNode?.destroy();
    }
}
