import inversify from "inversify";
import mobx from "mobx";
import { Tumble } from "../game-messages-cascading";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    private _tumbles = [];
    public tumble = null;
    public isShowTumbleWinFrame = false;

    set tumbles(tumbles: Tumble[]) {
        this._tumbles = tumbles;
    }

    get tumbles() {
        return this._tumbles;
    }
}
