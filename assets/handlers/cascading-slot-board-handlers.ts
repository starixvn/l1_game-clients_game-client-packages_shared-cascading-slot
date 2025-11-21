import gc from "@sg/game-client-base";
import inversify from "inversify";

import { cascadingSlotLogger } from "../cascading-slot-logger";
import { SymbolBoard } from "../cascading-slot-utils";
import { CascadingSlotBoardStore } from "../stores/cascading-slot-board-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotBoardHandlers implements gc.Shared.IHandler<void> {
    @inject(CascadingSlotBoardStore) protected readonly boardStore: CascadingSlotBoardStore;

    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_HANDLERS] constructor called", {
            hasBoardStore: !!this.boardStore,
            timestamp: new Date().toISOString()
        });
    }

    handle() {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_HANDLERS] handle called", {
            timestamp: new Date().toISOString()
        });
    }

    handleResult(data: SymbolBoard) {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_HANDLERS] handleResult called", {
            data,
            hasData: !!data,
            symbolsLength: data?.symbols?.length,
            multipliersLength: data?.multipliers?.length,
            tumblesLength: data?.tumbles?.length,
            hasBoardStore: !!this.boardStore,
            willSetSymbolsBoard: true,
            timestamp: new Date().toISOString()
        });

        this.boardStore.symbolsBoard = { symbols: data.symbols, multipliers: data.multipliers, tumbles: data.tumbles };

        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_HANDLERS] Symbols board set in store", {
            symbolsBoardSet: true,
            symbols: !!data.symbols,
            multipliers: !!data.multipliers,
            tumbles: !!data.tumbles,
            timestamp: new Date().toISOString()
        });
    }
}
