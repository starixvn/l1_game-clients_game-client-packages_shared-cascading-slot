import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "../../stores/bet-control-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { BuyFsResult, IBuyFreespinsPopupEvent } from "./buy-freespins-definitions";

const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsStore {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;

    constructor() {
        mobx.makeAutoObservable(this);
        setTimeout(() => {
            mobx.reaction(() => this.cascadingUIStore.isFreeSpins, (isFreeSpins) => {
                if (!isFreeSpins) {
                    this.isActive = false;
                }
            });
        }, 10);
    }

    popupEvent: IBuyFreespinsPopupEvent = null;
    fsMultiplier = 0;
    enabled = false;
    buyFsResult: BuyFsResult = null;
    isActive = false;
    triggerAutoPlay = null;

    get totalBet() {
        return this.betControlStore.totalBet * this.fsMultiplier;
    }

    get disableBuyFs() {
        return this.isActive || this.cascadingUIStore.disableBuyFreespins;
    }
}
