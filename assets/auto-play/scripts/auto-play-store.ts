import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotState } from "../../cascading-slot-state";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayStore {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    public roundsList = [10, 30, 50, 80, 100, 200, 500, 1000];
    public isOpenAutoplayPopup = false;
    public selectedRoundOnPopup = this.roundsList[0];
    public roundsAutoplay = 0;

    public isAutoplay = false;

    public triggerBet = null;

    get isTurnOnAutoPlay() {
        return this.isOpenAutoplayPopup || this.isAutoplay;
    }

    get disabledAutoPlay() {
        return this.uiStore.isTrialMode || this.uiStore.cascadingState === CascadingSlotState.SPINNING;
    }
}
