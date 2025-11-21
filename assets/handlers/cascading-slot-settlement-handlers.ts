import gc from "@sg/game-client-base";
import inversify from "inversify";
const { injectable, inject } = inversify;

import { SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingSlotBoardHandlers } from "./cascading-slot-board-handlers";
import { CascadingSlotTumblesHandlers } from "./cascading-slot-tumbles-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";

@injectable()
export class CascadingSlotSettlementHandlers implements gc.Shared.IMultipleHandlers {
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(CascadingSlotBoardHandlers) protected readonly boardHandler: CascadingSlotBoardHandlers;
    @inject(CascadingSlotTumblesHandlers) protected readonly tumblesHandler: CascadingSlotTumblesHandlers;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;

    constructor() {
    }

    handleFinish(data: any) {

        const { roundId } = data;

        this.uiHandler.handleBottomMessage(SlotNotification.SPINNING);

        // Check for free spins in service message and warn
        const { freeSpins, totalFreeSpins, isFreeSpin } = data || {};
        if (freeSpins > 0 || totalFreeSpins > 0 || isFreeSpin) {
            console.warn("🎰 FREESPIN FROM SERVICE: Free spins received in settlement message", {
                freeSpins: freeSpins || 0,
                totalFreeSpins: totalFreeSpins || 0,
                isFreeSpin: !!isFreeSpin,
                roundId: data?.roundId,
                source: "server_settlement_message",
                messageType: GameServiceMessageCascading.CascadingSlotFinish.eventName,
                timestamp: new Date().toISOString()
            });
        }

        this.settlementStore.finishData = data;

        this.uiStore.roundId = roundId;

    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingSlotFinish.eventName,
            handle: this.handleFinish,
        },
    ];
}
