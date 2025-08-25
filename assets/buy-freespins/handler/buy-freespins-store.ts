import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "../../stores/bet-control-store";
import { BuyFsResult, IBuyFreespinsPopupEvent } from "./buy-freespins-definitions";

const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsStore {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    popupEvent: IBuyFreespinsPopupEvent = null;
    fsMultiplier = 0;
    buyFsResult: BuyFsResult = null;
    isActive = false;

    get totalBet() {
        return this.betControlStore.totalBet * this.fsMultiplier;
    }
}
