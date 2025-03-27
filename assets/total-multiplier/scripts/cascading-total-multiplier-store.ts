import inversify from "inversify";
import mobx from "mobx";
import { CascadingFreespinsStore } from "../../freespins/scripts/cascading-freespins-store";
import { CascadingSlotSettlementStore } from "../../settlements";
const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierStore {
    @inject(CascadingSlotSettlementStore) private readonly settlementStore: CascadingSlotSettlementStore;
    @inject(CascadingFreespinsStore) private readonly freespinStore: CascadingFreespinsStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    totalMultiplier = 0;
    isShowTotalMultiplierTimeline = false;

    get needShowTotalMultiplier() {
        return (
            (this.settlementStore.finishData?.totalMultiplier > 0 &&
                this.settlementStore.finishData?.win > 0 &&
                this.settlementStore.finishData?.multiplier > 0 &&
                this.settlementStore.finishData?.isFreeSpin) ||
            (this.freespinStore.isFreeSpin && this.totalMultiplier > 0)
        );
    }
}
