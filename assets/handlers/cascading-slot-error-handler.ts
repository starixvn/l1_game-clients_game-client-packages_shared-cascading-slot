import gc from "@sg/game-client-base";
import inversify from "inversify";
import { AutoPlayHandler } from "./auto-play-handlers";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotErrorHandler extends gc.Error.ErrorHandlers {
    @inject(gc.Bet.BetStore) protected readonly betStore: gc.Bet.BetStore;
    @inject(AutoPlayHandler) protected readonly autoPlayHandler: AutoPlayHandler;
    eventHandleList = [
        {
            name: gc.GameServiceMessage.ApiError.eventName,
            handle: this.slotHandleApiError,
        },
    ];

    endGameApiError: gc.GameServiceMessage.ApiError = null;

    slotHandleApiError(apiError: gc.GameServiceMessage.ApiError) {
        console.log(apiError);

        setTimeout(() => {
            if (this.betStore.lastReceivedBet?.value === -1) {
                this.handleApiError(apiError);
            } else {
                this.endGameApiError = apiError;
            }
        }, 10);
    }

    handleEndGameApiError() {
        if (this.endGameApiError) {
            this.handleApiError(this.endGameApiError);
            this.autoPlayHandler.cancelAutoPlay();
        }
    }
}
