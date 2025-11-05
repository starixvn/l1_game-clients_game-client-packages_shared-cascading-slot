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
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] constructor called", {
            hasSettlementStore: !!this.settlementStore,
            hasBoardHandler: !!this.boardHandler,
            hasTumblesHandler: !!this.tumblesHandler,
            hasTumblesStore: !!this.tumblesStore,
            hasUIStore: !!this.uiStore,
            hasUIHandler: !!this.uiHandler,
            timestamp: new Date().toISOString()
        });
    }

    handleFinish(data: any) {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] handleFinish called", {
            data,
            hasData: !!data,
            roundId: data?.roundId,
            hasSettlementStore: !!this.settlementStore,
            hasUIHandler: !!this.uiHandler,
            hasUIStore: !!this.uiStore,
            willHandleBottomMessage: true,
            willSetFinishData: true,
            willSetRoundId: true,
            timestamp: new Date().toISOString()
        });

        const { roundId } = data;

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] Extracted roundId", {
            roundId,
            timestamp: new Date().toISOString()
        });

        this.uiHandler.handleBottomMessage(SlotNotification.SPINNING);
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] Bottom message handled", {
            message: SlotNotification.SPINNING,
            timestamp: new Date().toISOString()
        });

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
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] Finish data set in store", {
            finishDataSet: true,
            hasFreeSpins: !!(freeSpins > 0 || totalFreeSpins > 0 || isFreeSpin),
            timestamp: new Date().toISOString()
        });

        this.uiStore.roundId = roundId;
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] Round ID set in UI store", {
            roundId,
            roundIdSet: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_HANDLERS] handleFinish completed", {
            roundId,
            timestamp: new Date().toISOString()
        });
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingSlotFinish.eventName,
            handle: this.handleFinish,
        },
    ];
}
