import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betManager: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly gameState: CascadingUIStore;

    handle(): boolean {
        const amount = this.betManager.effectiveTotalBet;
        const betData = this.createHyperSpinBetData(amount);
        const result = this.placeBetDirectly(betData);

        return result;
    }

    private createHyperSpinBetData(amount: number) {
        const isFreeSpin = this.gameState.isFreeSpins;

        const betData = {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betManager.effectiveCoinValue,
            betLevel: this.betManager.effectiveBetLevel,
            totalBet: amount,
            freeSpin: isFreeSpin,
            clientSentTime: new Date(),
        };

        return betData;
    }

    private placeBetDirectly(data: any): boolean {
        if (this.betStore.isProcessingBet) {
            return false;
        }

        (this.gameState as any).changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        if ((this.gameState as any).isTrialMode) {
            this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        } else {
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        }

        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
        (this.gameState as any).changeUserBalance = true;
        this.retryGameHandler.handle();

        return true;
    }
}

