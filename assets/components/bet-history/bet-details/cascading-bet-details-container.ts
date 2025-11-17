import gc from "@sg/game-client-base";
const { MainPlayerStore } = gc.Player;
import { _decorator, Node } from "cc";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";
import { CascadingTicketDetail } from "./cascading-ticket-detail";

const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export class CascadingBetDetailsContainer extends NodeContainer {
    wrapperNode: Node = null;
    table: CascadingTicketDetail = null;
    xMode = 1;

    @render(gc.BetHistory.BetDetailHistoryStore, (store) => store.model, { fireImmediately: false })
    showBetDetailPopup(model: gc.BetHistory.BetDetailModel) {
        if (!this.wrapperNode?.active) {
            this.wrapperNode = this.createNode();
            this.table = this.wrapperNode.getComponent(CascadingTicketDetail);
        }

        this.table.showBetDetail({...model, xMode: this.xMode});
    }

    @render(MainPlayerStore, (store) => store.xMode)
    setXMode(value: number) {
        this.xMode = value;
    }
}
