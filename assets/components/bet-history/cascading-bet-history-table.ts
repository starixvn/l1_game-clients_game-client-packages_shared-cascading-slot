import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingHistoryItem } from "./cascading-history-item";
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
        this.clearOldTable();
        const fractionalOddsFormat = data?.fractionalOddsFormat ?? false;
        this.header.addChild(instantiate(headerPrefab));
        data.betLogs.forEach((betLogItem, index) => {
            this.body.addChild(this.buildBodyRow(bodyItemPrefab, betLogItem, index, fractionalOddsFormat));
        });
    }

    clearOldTable() {
        this.header.destroyAllChildren();
        this.body.destroyAllChildren();
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        const dialogs = this.getComponentsInChildren(Dialog);

        if (dialogs.length > 0) {
            dialogs[0].hide();
        } else {
            this.node.destroy();
        }
    }
}
