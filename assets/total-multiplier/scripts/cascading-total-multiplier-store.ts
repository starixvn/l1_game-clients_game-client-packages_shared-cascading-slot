import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotSettlementStore } from "../../settlements";
const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierStore {
    constructor(@inject(CascadingSlotSettlementStore) private readonly settlementStore: CascadingSlotSettlementStore) {
        mobx.makeAutoObservable(this);
    }

    totalMultiplier = 0;

    get needShowTotalMultiplier() {
        return (
            this.settlementStore.finishData.totalMultiplier > 0 &&
            this.settlementStore.finishData.win > 0 &&
            this.settlementStore.finishData.multiplier > 0 &&
            this.settlementStore.finishData.isFreeSpin
        );
    }
}
