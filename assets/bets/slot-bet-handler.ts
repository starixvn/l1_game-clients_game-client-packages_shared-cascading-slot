import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { CascadingUIHandler } from "../main-ui";
import { BetControlStore } from "../total-bet/scripts/bet-control-store";

const { injectable, inject } = inversify;

@injectable()
export class SlotBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    handle() {
        const betData = this.slotBetData();
        this.handleBetData(betData);
    }
    slotBetData() {
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.coinValue,
            betLevel: this.betControlStore.betLevel,
            totalBet: this.betControlStore.totalBet,
            clientSentTime: new Date(),
        };
    }

    handleBetData(data: any) {
        const amount = data.totalBet;
        if (this.isValidBet(amount)) {
            this.betStore.isProcessingBet = true;
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
            this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
            this.uiHandler.handleBottomMessage(SlotNotification.SPINNING);
            this.uiHandler.updateSpinButtonState(SpinButtonState.SPINNING);
            this.retryGameHandler.handle();
        }
    }

    isValidBet(amount: number) {
        if (this.betStore.isProcessingBet) {
            this.showWarningProcessingBet();
            return false;
        }

        const availableBalance = this.betStore.availableBalance;
        if (this.gameSetting?.validateBalanceWhenBet && amount > availableBalance) {
            this.showNoticePlaceBetFailure();
            return false;
        }

        return true;
    }
}
