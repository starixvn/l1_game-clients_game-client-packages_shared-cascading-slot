import inversify from "inversify";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { TumbleWinWiew } from "../components/tumbles/tumble-win-view";
import { TotalMultiplierView } from "../components/total-multiplier/cascading-total-multiplier-view";
import { IUIHandler } from "../interfaces/ui-handler.interface";
import { IGameState } from "../interfaces/game-state.interface";

const { injectable, inject } = inversify;

/**
 * Handler for hyper-spin mode settlement processing.
 * Isolates all hyper-spin specific settlement logic from normal mode workflow.
 */
@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIStore) protected readonly gameState: IGameState;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;
    @inject(CascadingUIHandler) protected readonly uiHandler: IUIHandler;

    /**
     * Handle settlement for hyper-spin mode.
     * Processes settlement with animation skipping and batch tracking.
     *
     * FAST-PATH: When animations are skipped, immediately trigger next spin
     * without waiting for board operations to complete.
     */
    async handleSettlement(
        finishData: any,
        tumbleWinView: TumbleWinWiew | null,
        totalMultiplierView: TotalMultiplierView | null
    ) {
        // In hyper-spin mode, even with incomplete finishData (during cascades),
        // we need to ensure the batch continues. Mark effects as completed immediately.
        if (!finishData) {
            // Mark effects as completed immediately to prevent batch from getting stuck
            // Note: isFreeSpinEffectCompleted is not in IGameState interface, using direct access
            (this.gameState as any).isFreeSpinEffectCompleted = true;

            // Continue to next round immediately (no setTimeout delay)
            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true); // Pass immediate flag
            }

            return;
        }

        // Mark balance as not changed initially (will be updated if there's a win)
        this.uiHandler.handleChangeUserBalance(false);

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const skipAnimations = this.shouldSkipAnimations(isFreeSpinActive);

        // FAST-PATH: When animations are skipped, process minimal state and continue immediately
        if (skipAnimations) {
            // Update minimal state immediately (synchronous operations only)
            this.updateMinimalState(settlementData);

            // Note: In hyper-spin mode, cascading state management is handled differently
            // Cascade completion is determined by hyper-spin specific logic, not cascading state

            // Continue to next round immediately (no setTimeout delay)
            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true); // Pass immediate flag
            }

            return;
        }

        // SLOW-PATH: Process settlement normally when animations are needed
        // (e.g., when stopOnFeature is enabled and free spins are active)

        // Hyper-spin mode doesn't use board operations - skip all board processing

        // Handle free spin logic with forced completion
        this.handleFreeSpinLogic(settlementData);

        // Note: In hyper-spin mode, cascading state management is handled differently
        // Cascade completion is determined by hyper-spin specific logic, not cascading state

        // Continue to next round after settlement completes
        // Use setTimeout to ensure MobX reactivity has propagated the state changes
        setTimeout(() => {
            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(false); // Normal path
            }
        }, 0);
    }

    /**
     * Extract settlement data from finish data.
     */
    private extractSettlementData(finishData: any) {
        return {
            win: finishData.win,
            bigWin: finishData.bigWin,
            megaWin: finishData.megaWin,
            superWin: finishData.superWin,
            totalFreeSpins: finishData.totalFreeSpins,
            isFreeSpin: finishData.isFreeSpin,
            multiplier: finishData.multiplier,
            totalMultiplier: finishData.totalMultiplier,
            reachMaxWin: finishData.reachMaxWin,
            tumbles: finishData.tumbles,
            result: finishData.result,
            actualBetwin: finishData.actualBetwin,
            freeSpins: finishData.freeSpins,
        };
    }

    /**
     * Determine if animations should be skipped.
     * Skip animations when continuing hyper-spin batch (stopOnFeature=false OR no freespins).
     * Don't skip animations when stopOnFeature=true and freespins are active (allows normal freespin UI).
     */
    private shouldSkipAnimations(isFreeSpinActive: boolean): boolean {
        const stopOnFeature = this.hyperSpinStore.stopOnFeature;
        // Skip animations only when continuing hyper-spin (either no freespins or stopOnFeature is false)
        return !isFreeSpinActive || !stopOnFeature;
    }



    /**
     * Handle free spin logic with conditional completion based on stopOnFeature setting.
     */
    private handleFreeSpinLogic(settlementData: any) {
        // Always update free spins data
        this.uiHandler.handleFreeSpinsByRound(settlementData.freeSpins);
        this.uiHandler.handleFreeSpinsTotal(settlementData.totalFreeSpins);

        // Check if hyper-spin should stop due to stopOnFeature setting
        const shouldStopForFeature = this.hyperSpinStore.stopOnFeature && settlementData.freeSpins > 0;

        if (shouldStopForFeature) {
            // When stopOnFeature is true and freespins are triggered, stop hyper-spin immediately
            // This allows normal freespin UI/animations to show when hyper-spin stops
            // Stop the hyper-spin batch immediately
            this.hyperSpinHandler.stopHyperSpin();

            // Don't set isFreeSpinEffectCompleted = true here - let normal freespins handle their effects
        } else {
            // In hyper-spin mode, mark effects as completed immediately when continuing batch
            // This prevents the batch from getting stuck waiting for non-existent UI effects
            // and ensures batch continues automatically
            // Note: isFreeSpinEffectCompleted is not in IGameState interface, using direct access
            (this.gameState as any).isFreeSpinEffectCompleted = true;
        }
    }

    /**
     * Update minimal state for fast-path settlement.
     * Only updates essential state needed for batch tracking and continuation.
     */
    private updateMinimalState(settlementData: any) {
        // Update balance if there's a win
        if (settlementData.win > 0) {
            this.uiHandler.handleChangeUserBalance(true);
            // Handle total win for tracking
            this.uiHandler.handleTotalWin({ win: settlementData.win, isActualWin: true });
        }

        // Update free spin state
        this.handleFreeSpinLogic(settlementData);
    }

}
