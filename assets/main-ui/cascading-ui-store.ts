import inversify from "inversify";
const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    totalTumbleWin: number = 0;
    totalWin: number = 0;
    multiplier = 0;
    totalMultiplier = 0;

    freeSpins = 0;

    get isShowTotalWin() {
        return this.totalTumbleWin > 0;
    }
}
