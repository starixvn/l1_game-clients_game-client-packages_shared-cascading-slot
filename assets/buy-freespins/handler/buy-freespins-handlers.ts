import inversify from "inversify";
import mobx from "mobx";
import { SlotBetHandler } from "../../handlers/slot-bet-handler";
import { HoldActionStore } from "../../stores/hold-action-store";
import { BuyFsFeatureMessage, BuyFsPopupEvent, BuyFsPopupName, BuyFsResult } from "./buy-freespins-definitions";
import { BuyFreespinsStore } from "./buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsHandler {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;
    @inject(SlotBetHandler) private readonly slotBetHandler: SlotBetHandler;
    @inject(HoldActionStore) private readonly holdActionStore: HoldActionStore;

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
        {
            name: "endBet",
            handle: this.handleBuyFsFail,
        },
    ];

    setFsMultiplier(multiplier: number) {
        this.buyFsStore.enabled = true;
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
            this.holdActionStore.enabled = false;
            this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.SHOW };
            this.buyFsStore.isActive = false;
        }
    }

    closeCongratulation() {
        this.holdActionStore.enabled = true;
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

    handleBuyFsFail(endBet: number) {
        if (endBet === -1 && this.processing) {
            this.processing = false;
        }
    }
}
