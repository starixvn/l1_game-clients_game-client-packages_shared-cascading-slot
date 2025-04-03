import gc from "@sg/game-client-base";
import inversify from "inversify";
const { injectable, inject } = inversify;

import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingUIStore } from "../main-ui";
import { CascadingSlotBoardHandlers } from "../slot-board";
import { CascadingSlotTumblesHandlers } from "../tumbles/scripts/cascading-slot-tumbles-handlers";
import { CascadingSlotTumblesStore } from "../tumbles/scripts/cascading-slot-tumbles-store";
import { CascadingSlotSettlementStore } from "./cascading-slot-settlement-store";

@injectable()
export class CascadingSlotSettlementHandlers implements gc.Shared.IMultipleHandlers {
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(CascadingSlotBoardHandlers) protected readonly boardHandler: CascadingSlotBoardHandlers;
    @inject(CascadingSlotTumblesHandlers) protected readonly tumblesHandler: CascadingSlotTumblesHandlers;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;

    handleFinish(data: any) {
        const { result, tumbles, totalFreeSpins } = data;
        this.settlementStore.finishData = data;
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingSlotFinish.eventName,
            handle: this.handleFinish,
        },
    ];
}
