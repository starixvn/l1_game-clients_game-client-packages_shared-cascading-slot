import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
import { BuyFreespinsStore, BuyFsPopupEvent, BuyFsPopupName } from "./buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsHandler implements gc.Shared.IMultipleHandlers {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    eventHandleList = [];

    setFsMultiplier(multiplier: number) {
        this.buyFsStore.fsMultiplier = multiplier;
    }

    confirmBuyFreespins() {
        //call bet
    }

    cancelBuyFreespins() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.HIDE };
    }

    showBuyFsConfirmation() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.SHOW };
    }

    receiveBuyFsTotalWin(amount: number, fsCount: number) {
        this.buyFsStore.totalWin = { amount, fsCount };
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.SHOW };
    }

    closeBuyFsTotalWin() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.HIDE };
    }
}
