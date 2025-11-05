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
        
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] handle called - Processing hyper-spin bet", {
            betAmount: amount,
            effectiveTotalBet: this.betControlStore.effectiveTotalBet,
            timestamp: new Date().toISOString()
        });

        const betData = this.createHyperSpinBetData(amount);
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Created bet data for hyper-spin", {
            betData,
            timestamp: new Date().toISOString()
        });

        const result = this.placeBetDirectly(betData, amount);
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] handle completed", {
            result,
            timestamp: new Date().toISOString()
        });

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

        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] createHyperSpinBetData created", {
            betData,
            orientationStoreM: this.orientationStore.m,
            mainPlayerName: this.mainPlayerStore.name,
            effectiveCoinValue: this.betControlStore.effectiveCoinValue,
            effectiveBetLevel: this.betControlStore.effectiveBetLevel,
            totalBet: amount,
            isFreeSpins: this.uiStore.isFreeSpins,
            freeSpin: betData.freeSpin,
            clientSentTime: betData.clientSentTime,
            timestamp: new Date().toISOString()
        });

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
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] placeBetDirectly called", {
            data,
            amount,
            isTrialMode: this.uiStore.isTrialMode,
            timestamp: new Date().toISOString()
        });

        // Minimal validation: only check if already processing a bet
        if (this.betStore.isProcessingBet) {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Bet placement failed - already processing bet", {
                timestamp: new Date().toISOString()
            });
            return false;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Processing hyper-spin bet", {
            amount,
            willSendToTrialConnection: this.uiStore.isTrialMode,
            willSendToMainConnection: !this.uiStore.isTrialMode,
            timestamp: new Date().toISOString()
        });

        // Set processing state
        this.uiStore.changeUserBalance = false;
        this.betStore.isProcessingBet = true;

        // Send bet to appropriate connection
        if (this.uiStore.isTrialMode) {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Sending bet to trial connection", {
                data,
                timestamp: new Date().toISOString()
            });
            this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Sending bet to main connection", {
                data,
                timestamp: new Date().toISOString()
            });
            this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        }

        // Update game state to SPINNING
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Changing cascading state to SPINNING", {
            timestamp: new Date().toISOString()
        });
        this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);

        // Re-enable balance updates
        this.uiStore.changeUserBalance = true;

        // Trigger retry game handler for connection management
        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Calling retry game handler", {
            timestamp: new Date().toISOString()
        });
        this.retryGameHandler.handle();

        cascadingSlotLogger.info("[HYPER_SPIN_BET_HANDLER] Bet placement completed successfully", {
            timestamp: new Date().toISOString()
        });
        return true;
    }
}

