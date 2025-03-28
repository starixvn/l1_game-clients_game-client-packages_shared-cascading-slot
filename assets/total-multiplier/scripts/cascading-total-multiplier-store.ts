import inversify from "inversify";
import mobx from "mobx";
import { CascadingFreespinsStore } from "../../freespins/scripts/cascading-freespins-store";
const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierStore {
    @inject(CascadingFreespinsStore) private readonly freespinStore: CascadingFreespinsStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    totalMultiplier = 0;
    winMultiplier = false;

    get needShowTotalMultiplier() {
        return (
            (this.freespinStore.isFreeSpin && this.totalMultiplier > 0 && this.winMultiplier) ||
            (this.freespinStore.isFreeSpin && this.totalMultiplier > 0)
        );
    }
}
