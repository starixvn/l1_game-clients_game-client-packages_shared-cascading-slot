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
    fsMultiplier = 100;
    buyFsResult: BuyFsResult = null;

    get totalBet() {
        return this.betControlStore.totalBet * this.fsMultiplier;
    }
}
