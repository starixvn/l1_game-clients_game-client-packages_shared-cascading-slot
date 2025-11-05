import gc from "@sg/game-client-base";
import inversify from "inversify";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { AutoPlayHandler } from "./auto-play-handlers";
import { BetControlHandlers } from "./bet-control-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotErrorHandler extends gc.Error.ErrorHandlers {
    @inject(gc.Bet.BetStore) protected readonly betStore: gc.Bet.BetStore;
    @inject(AutoPlayHandler) protected readonly autoPlayHandler: AutoPlayHandler;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;


    eventHandleList = [
        {
            name: gc.GameServiceMessage.ApiError.eventName,
            handle: this.slotHandleApiError,
        },
        {
            name: "notice",
            handle: this.slotHandleNotice,
        },
    ];

    endGameApiError: gc.GameServiceMessage.ApiError = null;

    slotHandleApiError(apiError: gc.GameServiceMessage.ApiError) {
        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] slotHandleApiError called", {
            apiError,
            hasApiError: !!apiError,
            hasBetStore: !!this.betStore,
            willUseSetTimeout: true,
            timeoutMs: 10,
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Timeout triggered for API error handling", {
                lastReceivedBetValue: this.betStore.lastReceivedBet?.value,
                isEndGameError: this.betStore.lastReceivedBet?.value !== -1,
                willHandleApiError: this.betStore.lastReceivedBet?.value === -1,
                willStoreEndGameError: this.betStore.lastReceivedBet?.value !== -1,
                timestamp: new Date().toISOString()
            });

            if (this.betStore.lastReceivedBet?.value === -1) {
                cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Handling API error immediately", {
                    timestamp: new Date().toISOString()
                });
                this.handleApiError(apiError);
            } else {
                cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Storing end game API error", {
                    timestamp: new Date().toISOString()
                });
                this.endGameApiError = apiError;
            }
        }, 10);

        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] slotHandleApiError setTimeout scheduled", {
            timeoutScheduled: true,
            timestamp: new Date().toISOString()
        });
    }

    handleEndGameApiError() {
        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] handleEndGameApiError called", {
            hasEndGameApiError: !!this.endGameApiError,
            hasCascadingUIHandler: !!this.cascadingUIHandler,
            willHandleApiError: !!this.endGameApiError,
            willHandlePlaceBetFailed: !!this.endGameApiError,
            timestamp: new Date().toISOString()
        });

        if (this.endGameApiError) {
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Handling stored end game API error", {
                endGameApiError: this.endGameApiError,
                timestamp: new Date().toISOString()
            });

            this.handleApiError(this.endGameApiError);
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] API error handled", {
                timestamp: new Date().toISOString()
            });

            this.cascadingUIHandler.handlePlaceBetFailed();
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Place bet failed handled", {
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] No end game API error to handle", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] handleEndGameApiError completed", {
            timestamp: new Date().toISOString()
        });
    }

    slotHandleNotice(notice: { errorCode: string }) {
        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] slotHandleNotice called", {
            notice,
            hasNotice: !!notice,
            errorCode: notice?.errorCode,
            isSB1929Error: notice?.errorCode === "SB1929",
            hasCascadingUIHandler: !!this.cascadingUIHandler,
            hasBetControlHandlers: !!this.betControlHandlers,
            willHandlePlaceBetFailed: notice?.errorCode === "SB1929",
            willInitBetControl: notice?.errorCode === "SB1929",
            timestamp: new Date().toISOString()
        });

        if (notice && notice.errorCode === "SB1929") {
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Handling SB1929 error", {
                errorCode: notice.errorCode,
                timestamp: new Date().toISOString()
            });

            this.cascadingUIHandler.handlePlaceBetFailed(true);
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Place bet failed handled for SB1929", {
                timestamp: new Date().toISOString()
            });

            this.betControlHandlers.init();
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Bet control handlers initialized", {
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] Notice not SB1929 or invalid, skipping", {
                errorCode: notice?.errorCode,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_ERROR_HANDLER] slotHandleNotice completed", {
            timestamp: new Date().toISOString()
        });
    }
}
