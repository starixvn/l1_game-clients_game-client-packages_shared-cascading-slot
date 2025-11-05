import inversify from "inversify";
import mobx from "mobx";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { SlotBetHandler } from "../../handlers/slot-bet-handler";
import { HoldActionStore } from "../../stores/hold-action-store";
import { BuyFsFeatureMessage, BuyFsPopupEvent, BuyFsPopupName, BuyFsResult } from "./buy-freespins-definitions";
import { BuyFreespinsStore } from "./buy-freespins-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { injectable, inject } = inversify;

@injectable()
export class BuyFreespinsHandler {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;
    @inject(SlotBetHandler) private readonly slotBetHandler: SlotBetHandler;
    @inject(HoldActionStore) private readonly holdActionStore: HoldActionStore;
    @inject(CascadingUIHandler) private readonly uiHandler: CascadingUIHandler;

    private processing = false;

    constructor() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] constructor completed", {
            autoObservableMade: true,
            timestamp: new Date().toISOString()
        });
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
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] setFsMultiplier called", {
            multiplier,
            hasBuyFsStore: !!this.buyFsStore,
            willSetEnabled: true,
            willSetFsMultiplier: true,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.enabled = true;
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore enabled set to true", {
            enabled: this.buyFsStore.enabled,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.fsMultiplier = multiplier;
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore fsMultiplier set", {
            fsMultiplier: this.buyFsStore.fsMultiplier,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] setFsMultiplier completed", {
            multiplier,
            finalEnabled: this.buyFsStore.enabled,
            finalFsMultiplier: this.buyFsStore.fsMultiplier,
            timestamp: new Date().toISOString()
        });
    }

    hideBuyFreespins() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] hideBuyFreespins called", {
            hasBuyFsStore: !!this.buyFsStore,
            willSetPopupEvent: true,
            popupName: BuyFsPopupName.BUY_CONFIRMATION,
            popupEvent: BuyFsPopupEvent.HIDE,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.HIDE };
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore popupEvent set to hide", {
            popupEvent: this.buyFsStore.popupEvent,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] hideBuyFreespins completed", {
            timestamp: new Date().toISOString()
        });
    }

    showBuyFsConfirmation() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] showBuyFsConfirmation called", {
            hasUiHandler: !!this.uiHandler,
            hasBuyFsStore: !!this.buyFsStore,
            willTriggerOpenDialog: true,
            willSetPopupEvent: true,
            dialogName: BuyFsPopupName.BUY_CONFIRMATION,
            timestamp: new Date().toISOString()
        });

        this.uiHandler.triggerOpenDialog(BuyFsPopupName.BUY_CONFIRMATION);
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] UI handler triggered open dialog", {
            dialogName: BuyFsPopupName.BUY_CONFIRMATION,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_CONFIRMATION, event: BuyFsPopupEvent.SHOW };
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore popupEvent set to show", {
            popupEvent: this.buyFsStore.popupEvent,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] showBuyFsConfirmation completed", {
            timestamp: new Date().toISOString()
        });
    }

    receiveBuyFsTotalWin(result: BuyFsResult) {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] receiveBuyFsTotalWin called", {
            result,
            hasBuyFsStore: !!this.buyFsStore,
            willSetBuyFsResult: true,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.buyFsResult = result;
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore buyFsResult set", {
            buyFsResult: this.buyFsStore.buyFsResult,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] receiveBuyFsTotalWin completed", {
            result,
            timestamp: new Date().toISOString()
        });
    }

    showBuyFsCongratulation() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] showBuyFsCongratulation called", {
            hasBuyFsStore: !!this.buyFsStore,
            hasBuyFsResult: !!this.buyFsStore.buyFsResult,
            hasHoldActionStore: !!this.holdActionStore,
            willCheckResult: true,
            timestamp: new Date().toISOString()
        });

        if (this.buyFsStore.buyFsResult) {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsResult exists, showing congratulation", {
                buyFsResult: this.buyFsStore.buyFsResult,
                willDisableHoldAction: true,
                willSetPopupEvent: true,
                willSetIsActive: false,
                timestamp: new Date().toISOString()
            });

            this.holdActionStore.enabled = false;
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] HoldActionStore enabled set to false", {
                enabled: this.holdActionStore.enabled,
                timestamp: new Date().toISOString()
            });

            this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.SHOW };
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore popupEvent set to show congratulation", {
                popupEvent: this.buyFsStore.popupEvent,
                timestamp: new Date().toISOString()
            });

            this.buyFsStore.isActive = false;
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore isActive set to false", {
                isActive: this.buyFsStore.isActive,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] No BuyFsResult, skipping congratulation", {
                buyFsResult: null,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] showBuyFsCongratulation completed", {
            congratulationShown: !!this.buyFsStore.buyFsResult,
            timestamp: new Date().toISOString()
        });
    }

    closeCongratulation() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] closeCongratulation called", {
            hasHoldActionStore: !!this.holdActionStore,
            hasBuyFsStore: !!this.buyFsStore,
            willEnableHoldAction: true,
            willSetPopupEvent: true,
            willClearBuyFsResult: true,
            timestamp: new Date().toISOString()
        });

        this.holdActionStore.enabled = true;
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] HoldActionStore enabled set to true", {
            enabled: this.holdActionStore.enabled,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.popupEvent = { name: BuyFsPopupName.BUY_FS_CONGRATULATION, event: BuyFsPopupEvent.HIDE };
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore popupEvent set to hide congratulation", {
            popupEvent: this.buyFsStore.popupEvent,
            timestamp: new Date().toISOString()
        });

        this.buyFsStore.buyFsResult = null;
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore buyFsResult cleared", {
            buyFsResult: this.buyFsStore.buyFsResult,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] closeCongratulation completed", {
            timestamp: new Date().toISOString()
        });
    }

    sendRequestBuyFreespins() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] sendRequestBuyFreespins called", {
            hasSlotBetHandler: !!this.slotBetHandler,
            hasBuyFsStore: !!this.buyFsStore,
            totalBet: this.buyFsStore.totalBet,
            currentProcessing: this.processing,
            willSetProcessing: true,
            timestamp: new Date().toISOString()
        });

        this.processing = this.slotBetHandler.buyFreespins(this.buyFsStore.totalBet);
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Processing set from slotBetHandler.buyFreespins", {
            processing: this.processing,
            totalBet: this.buyFsStore.totalBet,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] sendRequestBuyFreespins completed", {
            finalProcessing: this.processing,
            timestamp: new Date().toISOString()
        });
    }

    handleBuyFsSuccess() {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] handleBuyFsSuccess called", {
            currentProcessing: this.processing,
            hasBuyFsStore: !!this.buyFsStore,
            willCheckProcessing: true,
            timestamp: new Date().toISOString()
        });

        if (this.processing) {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Processing is true, handling success", {
                processing: true,
                willSetProcessing: false,
                willSetIsActive: true,
                timestamp: new Date().toISOString()
            });

            this.processing = false;
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Processing set to false", {
                processing: this.processing,
                timestamp: new Date().toISOString()
            });

            this.buyFsStore.isActive = true;
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] BuyFsStore isActive set to true", {
                isActive: this.buyFsStore.isActive,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Processing is false, skipping success handling", {
                processing: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] handleBuyFsSuccess completed", {
            finalProcessing: this.processing,
            finalIsActive: this.buyFsStore.isActive,
            timestamp: new Date().toISOString()
        });
    }

    handleBuyFsFail(endBet: number) {
        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] handleBuyFsFail called", {
            endBet,
            currentProcessing: this.processing,
            willCheckConditions: true,
            conditionCheck: endBet === -1 && this.processing,
            timestamp: new Date().toISOString()
        });

        if (endBet === -1 && this.processing) {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Conditions met, handling failure", {
                endBet,
                processing: true,
                willSetProcessing: false,
                timestamp: new Date().toISOString()
            });

            this.processing = false;
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Processing set to false", {
                processing: this.processing,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] Conditions not met, skipping failure handling", {
                endBet,
                processing: this.processing,
                conditionMet: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[BUY_FREESPINS_HANDLER] handleBuyFsFail completed", {
            finalProcessing: this.processing,
            timestamp: new Date().toISOString()
        });
    }
}
