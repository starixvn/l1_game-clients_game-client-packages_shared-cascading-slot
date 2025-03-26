import inversify from "inversify";
import mobx from "mobx";
import { SymbolBoard } from "../cascading-slot-utils";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotBoardStore {
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
}
