import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

/**
 * Simplified bet handler specifically for hyper-spin mode.
 * This handler isolates bet placement logic without extra conditions like bigWin checks,
 * hold actions, auto-play validations, or other UI state dependencies.
 * 
 * Designed for fast, streamlined bet placement during hyper-spin sessions.
 */
@injectable()
export class HyperSpinBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;

    /**
     * Place a bet during hyper-spin session.
     * This method handles only the core bet placement without extra conditions.
     * 
     * Uses effectiveTotalBet from betControlStore (set by hyper-spin handler before calling).
     * @returns boolean - true if bet was successfully placed, false otherwise
     */
    handle(): boolean {
        const amount = this.betControlStore.effectiveTotalBet;
        
        const betData = this.createHyperSpinBetData(amount);

        const result = this.placeBetDirectly(betData, amount);

        return result;
    }

    /**
     * Create bet data specifically for hyper-spin mode.
     * Simplified version without extra conditions or validations.
     */
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

        // Warn when free spin bet is being sent
        if (isFreeSpin) {
            console.warn("[HYPER_SPIN_BET_HANDLER] 🎰 FREE SPIN BET REQUEST - freeSpin = true", {
                betData,
                isFreeSpins: this.uiStore.isFreeSpins,
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });
        }

        return betData;
    }

    /**
     * Place bet directly without extra validations or conditions.
     * This is the core bet placement logic isolated for hyper-spin mode.
     * 
     * @param data - Bet data object
     * @param amount - Bet amount
     * @returns boolean - true if bet was successfully sent, false otherwise
     */
    private placeBetDirectly(data: any, amount: number): boolean {

        // Minimal validation: only check if already processing a bet
        if (this.betStore.isProcessingBet) {
            return false;
        }

        // Set processing state
        this.uiStore.changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        // Send bet to appropriate connection
        if (this.uiStore.isTrialMode) {
            this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        } else {
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        }

        // Update game state to SPINNING
        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);

        // Re-enable balance updates
        this.uiStore.changeUserBalance = true;

        // Trigger retry game handler for connection management
        this.retryGameHandler.handle();

        return true;
    }
}

