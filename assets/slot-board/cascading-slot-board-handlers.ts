import gc from "@sg/game-client-base";
import inversify from "inversify";

import { SymbolBoard } from "../cascading-slot-utils";
import { CascadingSlotBoardStore } from "./cascading-slot-board-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotBoardHandlers implements gc.Shared.IHandler<void> {
    @inject(CascadingSlotBoardStore) protected readonly boardStore: CascadingSlotBoardStore;
    handle() {}
    handleResult(data: SymbolBoard) {
        this.boardStore.symbolsBoard = { symbols: data.symbols, multipliers: data.multipliers, tumbles: data.tumbles };
    }
}
