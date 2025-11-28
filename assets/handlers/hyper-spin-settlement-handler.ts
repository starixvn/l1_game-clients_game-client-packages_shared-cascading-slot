import gc from "@sg/game-client-base";
import inversify from "inversify";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotBoard } from "../components/slot-board/components/cascading-slot-board";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { convertData } from "../cascading-slot-utils";
import { TumbleWinWiew } from "../components/tumbles/tumble-win-view";
import { TotalMultiplierView } from "../components/total-multiplier/cascading-total-multiplier-view";

const { injectable, inject } = inversify;

/**
 * Handler for hyper-spin mode settlement processing.
 * Isolates all hyper-spin specific settlement logic from normal mode workflow.
 */
@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;

    /**
     * Handle settlement for hyper-spin mode.
     * Processes settlement with animation skipping and batch tracking.
     */
    async handleSettlement(
        finishData: any,
        board: CascadingSlotBoard,
        tumbleWinView: TumbleWinWiew | null,
        totalMultiplierView: TotalMultiplierView | null
    ) {
        cascadingSlotLogger.warn("🎯 [HYPER_SPIN_SETTLEMENT] handleSettlement() called", {
            hasFinishData: !!finishData,
            isHyperSpin: this.hyperSpinStore.isHyperSpin,
            roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
            timestamp: new Date().toISOString()
        });

        // In hyper-spin mode, even with incomplete finishData (during cascades),
        // we need to ensure the batch continues. Mark effects as completed immediately.
        if (!finishData) {
            cascadingSlotLogger.warn("⚠️ [HYPER_SPIN_SETTLEMENT] Incomplete finishData - marking effects completed for batch continuation");

            // Mark effects as completed immediately to prevent batch from getting stuck
            this.cascadingUIStore.isFreeSpinEffectCompleted = true;

            // Continue to next round after a brief delay
            setTimeout(() => {
                cascadingSlotLogger.warn("🔄 [HYPER_SPIN_SETTLEMENT] Calling checkHyperSpinNextRound() for incomplete data", {
                    isHyperSpin: this.hyperSpinStore.isHyperSpin,
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    timestamp: new Date().toISOString()
                });

                if (this.hyperSpinStore.isHyperSpin) {
                    this.hyperSpinHandler.checkHyperSpinNextRound();
                }
            }, 0);

            return;
        }

        // Mark balance as not changed initially (will be updated if there's a win)
        this.cascadingUIHandler.handleChangeUserBalance(false);

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const skipAnimations = this.shouldSkipAnimations(isFreeSpinActive);

        // Process spin and tumbles with skipped animations
        await this.handleSpinAndTumbleResults(board, settlementData, skipAnimations);

        // Process wins (skip multiplier animations in hyper-spin)
        await this.handleWinProcessing(board, settlementData, skipAnimations, tumbleWinView, totalMultiplierView);

        // Skip UI updates during hyper-spin for maximum speed
        // (UI updates are skipped in hyper-spin mode)

        // Skip special effects during hyper-spin
        // (Special effects are skipped in hyper-spin mode)

        // Handle free spin logic with forced completion
        this.handleFreeSpinLogic(settlementData);

        // Note: Spin data recording is now handled in CascadingSlotGame.recordHyperSpinSpinData()

        // Continue to next round after settlement completes
        // Use setTimeout to ensure MobX reactivity has propagated the state changes
        // and all settlement processing is complete
        setTimeout(() => {
            cascadingSlotLogger.warn("🔄 [HYPER_SPIN_SETTLEMENT] Calling checkHyperSpinNextRound()", {
                isHyperSpin: this.hyperSpinStore.isHyperSpin,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                isFreeSpinEffectCompleted: this.cascadingUIStore.isFreeSpinEffectCompleted,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                timestamp: new Date().toISOString()
            });

            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound();
            } else {
                cascadingSlotLogger.warn("⚠️ [HYPER_SPIN_SETTLEMENT] Skipping checkHyperSpinNextRound() - isHyperSpin is false");
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
     * Skip animations unless free spins are active AND stopOnFeature is enabled.
     */
    private shouldSkipAnimations(isFreeSpinActive: boolean): boolean {
        const stopOnFeature = this.hyperSpinStore.stopOnFeature;
        return !(isFreeSpinActive && stopOnFeature);
    }

    /**
     * Handle spin results and tumbles with animation control.
     */
    private async handleSpinAndTumbleResults(
        board: CascadingSlotBoard,
        settlementData: any,
        skipAnimations: boolean
    ) {
        const symbolsBoard = {
            symbols: convertData(settlementData.result),
            multipliers: settlementData.tumbles[0]?.multipliers,
            isTurbo: false,
            tumbles: settlementData.tumbles
        };

        // Call board's spinResult with isTurbo=false and skipAnimations flag
        await board.spinResult(symbolsBoard, false, skipAnimations);

        // Handle tumbles
        if (settlementData.tumbles && settlementData.tumbles.length > 1) {
            await board.handleTumbles(settlementData.tumbles, false, skipAnimations);
        }
    }

    /**
     * Handle win processing with animation control.
     */
    private async handleWinProcessing(
        board: CascadingSlotBoard,
        settlementData: any,
        skipAnimations: boolean,
        tumbleWinView: TumbleWinWiew | null,
        totalMultiplierView: TotalMultiplierView | null
    ) {
        const winTumbles = settlementData.tumbles.length > 1;
        const winMultiplier = settlementData.multiplier > 0 && winTumbles;

        // Skip multiplier animations during hyper-spin for faster execution
        if (!skipAnimations && tumbleWinView) {
            if (winMultiplier) {
                // Trigger win multiplier (if needed - would need to inject handler)
            }
            await board.handleMultiplier(settlementData.isFreeSpin, winMultiplier, tumbleWinView, totalMultiplierView);
        }

        if (settlementData.win > 0) {
            // Update balance tracking (even in hyper-spin mode for batch tracking)
            this.cascadingUIHandler.handleChangeUserBalance(true);

            // Update win display (skip animations in hyper-spin)
            if (winTumbles && !skipAnimations && tumbleWinView) {
                await tumbleWinView.setTotalWinValue(settlementData.actualBetwin);
            }

            // Handle total win for tracking
            this.cascadingUIHandler.handleTotalWin({ win: settlementData.win, isActualWin: true });
        }
    }

    /**
     * Handle free spin logic with forced completion for batch continuation.
     */
    private handleFreeSpinLogic(settlementData: any) {
        // Always update free spins data
        this.cascadingUIHandler.handleFreeSpinsByRound(settlementData.freeSpins);
        this.cascadingUIHandler.handleFreeSpinsTotal(settlementData.totalFreeSpins);

        // In hyper-spin mode, ALWAYS mark effects as completed immediately
        // This prevents the batch from getting stuck waiting for non-existent UI effects
        // and ensures batch continues automatically
        this.cascadingUIStore.isFreeSpinEffectCompleted = true;
    }
}
