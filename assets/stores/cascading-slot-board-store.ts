import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { SymbolBoard } from "../cascading-slot-utils";
import { CascadingUIStore } from "./cascading-ui-store";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotBoardStore {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    private _symbolsBoard = null;
    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_STORE] constructor called", {
            willMakeAutoObservable: true,
            hasUIStore: !!this.uiStore,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                _symbolsBoard: this._symbolsBoard,
                uiStoreInjected: !!this.uiStore
            },
            timestamp: new Date().toISOString()
        });
    }

    get symbolsBoard() {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_STORE] get symbolsBoard accessed", {
            hasSymbolsBoard: !!this._symbolsBoard,
            symbolsBoardType: typeof this._symbolsBoard,
            timestamp: new Date().toISOString()
        });
        return this._symbolsBoard;
    }

    set symbolsBoard(symbolsBoard: SymbolBoard) {
        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_STORE] set symbolsBoard called", {
            symbolsBoard,
            hasSymbolsBoard: !!symbolsBoard,
            previousSymbolsBoard: !!this._symbolsBoard,
            willUpdateSymbolsBoard: true,
            timestamp: new Date().toISOString()
        });

        this._symbolsBoard = symbolsBoard;

        cascadingSlotLogger.info("[CASCADING_SLOT_BOARD_STORE] symbolsBoard set", {
            newSymbolsBoard: !!this._symbolsBoard,
            symbolsBoardSet: true,
            timestamp: new Date().toISOString()
        });
    }
}
