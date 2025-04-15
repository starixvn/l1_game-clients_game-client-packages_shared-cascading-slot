import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class SlotBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
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
            freeSpin: this.uiStore.isFreeSpins,
            clientSentTime: new Date(),
        };
    }

    handleBetData(data: any) {
        const amount = data.totalBet;
        if (this.isValidBet(amount)) {
            this.betStore.isProcessingBet = true;
            this.uiStore.isTrialMode
                ? this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data)
                : this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
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
