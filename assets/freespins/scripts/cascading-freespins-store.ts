import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingFreespinsStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    totalFreeSpins = 0;
    betLevel = 0;
    coinValue = 0;
    betMultiplier = 0;

    get isFreeSpinJoinGame() {
        return this.totalFreeSpins > 0;
    }
}
