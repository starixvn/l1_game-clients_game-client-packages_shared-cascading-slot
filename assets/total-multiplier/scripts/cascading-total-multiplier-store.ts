import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotSettlementStore } from "../../settlements";
const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierStore {
    @inject(CascadingSlotSettlementStore) private readonly settlementStore: CascadingSlotSettlementStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    totalMultiplier = 0;
    isShowTotalMultiplierTimeline = false;

    get needShowTotalMultiplier() {
        return (
            this.settlementStore.finishData?.totalMultiplier > 0 &&
            this.settlementStore.finishData?.win > 0 &&
            this.settlementStore.finishData?.multiplier > 0 &&
            this.settlementStore.finishData?.isFreeSpin
        );
    }
}
