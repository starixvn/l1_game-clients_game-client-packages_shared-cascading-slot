import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingHistoryItem } from "./cascading-history-item";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Initializing CascadingBetHistoryTable class');

const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass
export class CascadingBetHistoryTable extends ObserverComponent {
    @property(Node)
    header: Node = null;

    @property(Node)
    body: Node = null;

    getHistoryItemComponent(node: Node) {
        return node.getComponent(CascadingHistoryItem);
    }

    buildBodyRow(bodyItemPrefab: Prefab, betHistoryLog: gc.BetHistory.BetHistoryLog, index: number, fractionalOddsFormat = false): Node {
        const bodyItem = instantiate(bodyItemPrefab);
        this.getHistoryItemComponent(bodyItem)?.setData({
            betHistoryLog,
            index,
            fractionalOddsFormat,
        });
        return bodyItem;
    }

    showBetHistory(model: any) {
        const { data, headerPrefab, bodyItemPrefab } = model;
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Showing bet history table:', {
            hasData: !!data,
            hasHeaderPrefab: !!headerPrefab,
            hasBodyItemPrefab: !!bodyItemPrefab,
            betLogsCount: data?.betLogs?.length || 0,
            fractionalOddsFormat: data?.fractionalOddsFormat ?? false
        });

        this.clearOldTable();
        const fractionalOddsFormat = data?.fractionalOddsFormat ?? false;
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Instantiating header prefab');
        this.header.addChild(instantiate(headerPrefab));

        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Building body rows for bet logs');
        data.betLogs.forEach((betLogItem, index) => {
            const bodyRow = this.buildBodyRow(bodyItemPrefab, betLogItem, index, fractionalOddsFormat);
            this.body.addChild(bodyRow);
            cascadingSlotLogger.info(`[CASCADING_BET_HISTORY_TABLE] Added body row ${index + 1}/${data.betLogs.length}`);
        });

        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Bet history table display completed');
    }

    clearOldTable() {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Clearing old table content');
        this.header.destroyAllChildren();
        this.body.destroyAllChildren();
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Old table content cleared');
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Close button clicked');
        const dialogs = this.getComponentsInChildren(Dialog);
        cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Found dialogs:', { count: dialogs.length });

        if (dialogs.length > 0) {
            cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Hiding dialog component');
            dialogs[0].hide();
        } else {
            cascadingSlotLogger.info('[CASCADING_BET_HISTORY_TABLE] Destroying table node');
            this.node.destroy();
        }
    }
}



