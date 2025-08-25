import inversify from "inversify";
import mobx from "mobx";
import { SlotBetHandler } from "../../handlers/slot-bet-handler";
import { BuyFsFeatureMessage, BuyFsPopupEvent, BuyFsPopupName, BuyFsResult } from "./buy-freespins-definitions";
import { BuyFreespinsStore } from "./buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsHandler {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;
    @inject(SlotBetHandler) private readonly slotBetHandler: SlotBetHandler;

    private processing = false;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    eventHandleList = [
        {
            name: BuyFsFeatureMessage.Result,
            handle: this.receiveBuyFsTotalWin,
        },
        {
            name: "finish",
            handle: this.handleBuyFsSuccess,
        },
    ];

    setFsMultiplier(multiplier: number) {
        this.buyFsStore.fsMultiplier = multiplier;
    }

    hideBuyFreespins() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.HIDE };
    }

    showBuyFsConfirmation() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.SHOW };
    }

    receiveBuyFsTotalWin(result: BuyFsResult) {
        this.buyFsStore.buyFsResult = result;
    }

    showBuyFsCongratulation() {
        if (this.buyFsStore.buyFsResult) {
            this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.SHOW };
            this.buyFsStore.isActive = false;
        }
    }

    closeCongratulation() {
        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.HIDE };
        this.buyFsStore.buyFsResult = null;
    }

    sendRequestBuyFreespins() {
        this.processing = this.slotBetHandler.buyFreespins(this.buyFsStore.totalBet);
    }

    handleBuyFsSuccess() {
        if (this.processing) {
            this.processing = false;
            this.buyFsStore.isActive = true;
        }
    }
}
