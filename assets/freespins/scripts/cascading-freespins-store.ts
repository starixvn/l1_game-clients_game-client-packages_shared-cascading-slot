import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingFreespinsStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    totalFreeSpins = 0;

    get isFreeSpin() {
        return this.totalFreeSpins > 0;
    }
}
