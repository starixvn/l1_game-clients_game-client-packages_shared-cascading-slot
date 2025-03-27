import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }
    // totalTumbleWin = { totalWin: 0, isAnimated: false };
    totalWin: number = 0;
    totalTumbleWin = 0;
    multiplier = 0;

    freeSpins = 0;

    // get isShowTotalWin() {
    //     return this.totalTumbleWin.totalWin > 0;
    // }
}
