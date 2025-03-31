import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotState } from "../cascading-slot-state";
import { SymbolBoard } from "../cascading-slot-utils";
import { CascadingUIStore } from "../main-ui";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotBoardStore {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    private _symbolsBoard = null;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    get symbolsBoard() {
        return this._symbolsBoard;
    }

    set symbolsBoard(symbolsBoard: SymbolBoard) {
        this._symbolsBoard = symbolsBoard;
    }

    get hideSymbolPreview() {
        return this.uiStore.cascadingState === CascadingSlotState.SPINNING;
    }
}
