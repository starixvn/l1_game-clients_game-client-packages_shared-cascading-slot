import inversify from "inversify";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;

    async handleSettlement(finishData: any) {
        if (!finishData) {
            cascadingSlotLogger.log("handleSettlement: No finishData provided", {
                fileIdentifier: "hyper-spin-settlement-handler",
                data: { isActiveHyperSpin: this.hyperSpinStore.isActiveHyperSpin }
            });

            if (this.hyperSpinStore.isActiveHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true);
            }

            return;
        }

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const shouldPlayFreeSpin = this.shouldPlayFreeSpin(isFreeSpinActive);

        cascadingSlotLogger.log("handleSettlement: Processing settlement data", {
            fileIdentifier: "hyper-spin-settlement-handler",
            data: {
                isFreeSpinActive,
                shouldPlayFreeSpin,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                settlementData: {
                    win: settlementData.win,
                    totalFreeSpins: settlementData.totalFreeSpins,
                    isFreeSpin: settlementData.isFreeSpin
                }
            }
        });

        if (shouldPlayFreeSpin) {
            cascadingSlotLogger.log("handleSettlement: Stopping hyper spin due to free spin trigger with stopOnFeature=true", {
                fileIdentifier: "hyper-spin-settlement-handler",
                level: "warn",
                data: {
                    roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                    totalFreeSpins: settlementData.totalFreeSpins
                }
            });
            this.hyperSpinHandler.checkHyperSpinNextRound(false);
            this.handleFreeSpinOnNormalMode();
        }
        else {
            cascadingSlotLogger.log("handleSettlement: Continuing hyper spin to next round", {
                fileIdentifier: "hyper-spin-settlement-handler",
                data: { roundsRemaining: this.hyperSpinStore.roundsHyperSpin }
            });
            this.hyperSpinHandler.checkHyperSpinNextRound(true);
        }
    }

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

    private shouldPlayFreeSpin(isFreeSpinActive: boolean): boolean {
        const result = isFreeSpinActive && this.hyperSpinStore.stopOnFeature;

        cascadingSlotLogger.log("shouldPlayFreeSpin: Evaluating free spin play decision", {
            fileIdentifier: "hyper-spin-settlement-handler",
            data: {
                isFreeSpinActive,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                result
            }
        });

        return result;
    }

    private handleFreeSpinOnNormalMode() {
        console.log('[HyperSpinSettlementHandler] handleFreeSpinOnNormalMode called');
        cascadingSlotLogger.log("handleFreeSpinOnNormalMode: Stopping hyper spin for free spin mode", {
            fileIdentifier: "hyper-spin-settlement-handler",
            level: "warn",
            data: {
                roundsRemaining: this.hyperSpinStore.roundsHyperSpin,
                isActiveHyperSpin: this.hyperSpinStore.isActiveHyperSpin
            }
        });

        // Stop hyper spin immediately when free spins are triggered
        console.log('[HyperSpinSettlementHandler] Calling stopHyperSpin');
        this.hyperSpinHandler.stopHyperSpin();
        console.log('[HyperSpinSettlementHandler] Setting autoClosePopupByTurnOnFeature = true');
        this.hyperSpinStore.autoClosePopupByTurnOnFeature = true;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;
        console.log('[HyperSpinSettlementHandler] autoClosePopupByTurnOnFeature set to:', this.hyperSpinStore.autoClosePopupByTurnOnFeature);
    }
}
