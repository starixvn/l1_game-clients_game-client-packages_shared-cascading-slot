import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

// Simplified bet handler for hyper-spin mode - streamlined bet placement
@injectable()
export class HyperSpinBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;

    handle(): boolean {
        // Use mock data for testing instead of real service calls
        if (this.hyperSpinStore.useMockDataForTesting) {
            return this.handleMockBet();
        }

        const amount = this.betControlStore.effectiveTotalBet;
        const betData = this.createHyperSpinBetData(amount);
        return this.placeBetDirectly(betData, amount);
    }

    private handleMockBet(): boolean {
        console.warn("[MOCK_BET_HANDLER] 🎭 Using mock data for hyper-spin testing");

        // Simulate bet processing
        this.uiStore.changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
        this.uiStore.changeUserBalance = true;

        // Simulate quick completion for mock data
        setTimeout(() => {
            this.betStore.isProcessingBet = false;
        }, 100);

        return true;
    }

    private createHyperSpinBetData(amount: number) {
        const isFreeSpin = this.uiStore.isFreeSpins;

        const betData = {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.effectiveCoinValue,
            betLevel: this.betControlStore.effectiveBetLevel,
            totalBet: amount,
            freeSpin: isFreeSpin,
            clientSentTime: new Date(),
        };

        if (isFreeSpin) {
            console.warn("[HYPER_SPIN_BET_HANDLER] 🎰 FREE SPIN BET REQUEST", {
                betData,
                isFreeSpins: this.uiStore.isFreeSpins,
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });
        }

        return betData;
    }

    private placeBetDirectly(data: any, amount: number): boolean {
        if (this.betStore.isProcessingBet) {
            return false;
        }

        this.uiStore.changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        if (this.uiStore.isTrialMode) {
            this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        } else {
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        }

        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
        this.uiStore.changeUserBalance = true;
        this.retryGameHandler.handle();

        return true;
    }
}

