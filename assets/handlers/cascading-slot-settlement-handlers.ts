import gc from "@sg/game-client-base";
import inversify from "inversify";
const { injectable, inject } = inversify;

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingSlotBoardHandlers } from "./cascading-slot-board-handlers";
import { CascadingSlotTumblesHandlers } from "./cascading-slot-tumbles-handlers";

@injectable()
export class CascadingSlotSettlementHandlers implements gc.Shared.IMultipleHandlers {
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(CascadingSlotBoardHandlers) protected readonly boardHandler: CascadingSlotBoardHandlers;
    @inject(CascadingSlotTumblesHandlers) protected readonly tumblesHandler: CascadingSlotTumblesHandlers;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;

    handleFinish(data: any) {
        const { result, tumbles, totalFreeSpins, roundId } = data;
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
