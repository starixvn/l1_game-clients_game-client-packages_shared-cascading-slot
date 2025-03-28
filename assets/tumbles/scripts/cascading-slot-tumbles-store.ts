import inversify from "inversify";
import mobx from "mobx";
import { CascadingSlotState } from "../../cascading-slot-state";
import { Tumble } from "../../game-messages-cascading";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesStore {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }
    private _tumbles = [];
    public tumble = null;

    set tumbles(tumbles: Tumble[]) {
        this._tumbles = tumbles;
    }

    get tumbles() {
        return this._tumbles;
    }

    get isShowTumbleWinFrame() {
        return this.tumbles.length > 1;
    }

    get clearTumbleList() {
        return this.uiStore.cascadingState === CascadingSlotState.START_ROUND;
    }
}
