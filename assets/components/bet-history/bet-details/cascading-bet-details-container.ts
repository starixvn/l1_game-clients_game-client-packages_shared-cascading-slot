import gc from "@sg/game-client-base";
import { _decorator, Node } from "cc";
import { NodeContainer } from "db://shared-components/shared/common-components/node-container/node-container";
import Observer from "observer";
import { CascadingTicketDetail } from "./cascading-ticket-detail";
import { cascadingSlotLogger } from "../../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { handle, render } = Observer;

@ccclass
export class CascadingBetDetailsContainer extends NodeContainer {
    wrapperNode: Node = null;
    table: CascadingTicketDetail = null;

    @render(gc.BetHistory.BetDetailHistoryStore, (store) => store.model, { fireImmediately: false })
    showBetDetailPopup(model: gc.BetHistory.BetDetailModel) {
        cascadingSlotLogger.info("[CASCADING_BET_DETAILS_CONTAINER] showBetDetailPopup called", {
            model,
            hasModel: !!model,
            wrapperNodeExists: !!this.wrapperNode,
            wrapperNodeActive: this.wrapperNode?.active,
            hasTable: !!this.table,
            timestamp: new Date().toISOString()
        });

        if (!this.wrapperNode?.active) {
            cascadingSlotLogger.info("[CASCADING_BET_DETAILS_CONTAINER] Creating wrapper node", {
                willCreateNode: true,
                timestamp: new Date().toISOString()
            });

            this.wrapperNode = this.createNode();
            this.table = this.wrapperNode.getComponent(CascadingTicketDetail);

            cascadingSlotLogger.info("[CASCADING_BET_DETAILS_CONTAINER] Wrapper node created", {
                wrapperNodeCreated: !!this.wrapperNode,
                tableComponentFound: !!this.table,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_BET_DETAILS_CONTAINER] Showing bet detail", {
            model,
            hasTable: !!this.table,
            timestamp: new Date().toISOString()
        });

        this.table.showBetDetail(model);

        cascadingSlotLogger.info("[CASCADING_BET_DETAILS_CONTAINER] showBetDetailPopup completed", {
            model,
            timestamp: new Date().toISOString()
        });
    }
}
