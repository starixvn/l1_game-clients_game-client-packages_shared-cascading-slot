import inversify from "inversify";
import mobx from "mobx";
import { BetControlStore } from "../../stores/bet-control-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { BuyFsResult, IBuyFreespinsPopupEvent } from "./buy-freespins-definitions";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { injectable, inject } = inversify;

cascadingSlotLogger.info('[BUY_FREESPINS_STORE] Initializing BuyFreespinsStore class');

@injectable()
export class BuyFreespinsStore {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;

    constructor() {
        cascadingSlotLogger.info('[BUY_FREESPINS_STORE] Constructor called, making store auto-observable');
        mobx.makeAutoObservable(this);
        cascadingSlotLogger.info('[BUY_FREESPINS_STORE] BuyFreespinsStore initialized successfully');
    }

    popupEvent: IBuyFreespinsPopupEvent = null;
    fsMultiplier = 0;
    enabled = false;
    buyFsResult: BuyFsResult = null;
    isActive = false;
    triggerAutoPlay = null;

    get totalBet() {
        const totalBet = this.betControlStore.totalBet * this.fsMultiplier;
        cascadingSlotLogger.info('[BUY_FREESPINS_STORE] Calculating total bet:', { baseBet: this.betControlStore.totalBet, fsMultiplier: this.fsMultiplier, totalBet });
        return totalBet;
    }

    get disableBuyFs() {
        const disabled = this.isActive || this.cascadingUIStore.disableBuyFreespins;
        cascadingSlotLogger.info('[BUY_FREESPINS_STORE] Checking if buy freespins is disabled:', { isActive: this.isActive, uiStoreDisabled: this.cascadingUIStore.disableBuyFreespins, disabled });
        return disabled;
    }
}
