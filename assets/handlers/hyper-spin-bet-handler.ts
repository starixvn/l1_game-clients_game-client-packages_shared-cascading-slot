import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { IUIHandler } from "../interfaces/ui-handler.interface";
import { IBetManager } from "../interfaces/bet-manager.interface";
import { IGameState } from "../interfaces/game-state.interface";

const { injectable, inject } = inversify;

// Simplified bet handler for hyper-spin mode - streamlined bet placement
@injectable()
export class HyperSpinBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betManager: IBetManager;
    @inject(CascadingUIHandler) protected readonly uiHandler: IUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly gameState: IGameState;

    handle(): boolean {
        const amount = this.betManager.effectiveTotalBet;
        const betData = this.createHyperSpinBetData(amount);
        const result = this.placeBetDirectly(betData, amount);

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

        if (isFreeSpin) {
            return betData;
        }
    }

    private placeBetDirectly(data: any, amount: number): boolean {
        if (this.betStore.isProcessingBet) {
            return false;
        }

        // Note: changeUserBalance is not in IGameState interface, using direct access
        (this.gameState as any).changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        // Note: isTrialMode is not in IGameState interface, using direct access
        if ((this.gameState as any).isTrialMode) {
            this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        } else {
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        }

        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
        // Note: changeUserBalance is not in IGameState interface, using direct access
        (this.gameState as any).changeUserBalance = true;
        this.retryGameHandler.handle();

        return true;
    }
}

