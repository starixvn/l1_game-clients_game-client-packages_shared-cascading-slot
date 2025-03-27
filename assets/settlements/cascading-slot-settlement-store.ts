import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotSettlementStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    private _finishData = null;

    get finishData() {
        return this._finishData;
    }

    set finishData(data: any) {
        this._finishData = data;
    }
}
