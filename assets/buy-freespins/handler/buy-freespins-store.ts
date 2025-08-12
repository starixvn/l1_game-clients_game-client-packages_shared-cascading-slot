import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "../../stores/bet-control-store";

const { injectable, inject } = inversify;

export enum BuyFsPopupName {
    BUY_CONFIRMATION = "buy_confirmation",
    BUY_FS_CONGRATULATION = "buy_fs_congratulation",
}

export enum BuyFsPopupEvent {
    SHOW = "show",
    HIDE = "hide",
}

export interface IBuyFreespinsPopupEvent {
    name: string;
    event: string;
}

export interface TotalWin {
    amount: number;
    fsCount: number;
}

@injectable()
export class BuyFreespinsStore {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    popupEvent: IBuyFreespinsPopupEvent = null;
    fsMultiplier = 100;
    totalWin: TotalWin = null;

    get totalBet() {
        return this.betControlStore.totalBet * this.fsMultiplier;
    }
}
