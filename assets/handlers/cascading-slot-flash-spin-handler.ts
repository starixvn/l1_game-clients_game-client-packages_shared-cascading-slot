import inversify from "inversify";
import { FlashSpinHandler } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-handler";
import { FlashSpinStore } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotFlashSpinHandler {
    @inject(FlashSpinStore) protected readonly hyperSpinStore: FlashSpinStore;
    @inject(FlashSpinHandler) protected readonly hyperSpinHandler: FlashSpinHandler;

    async handleSettlementIfActive(
        finishData: any,
    ): Promise<boolean> {
        if (!this.hyperSpinStore.isActiveHyperSpin) {
            return false;
        }

        await this.handleSettlement(finishData);

        this.hyperSpinHandler.handleRecordSpinData(finishData);
        return true;
    }

    private async handleSettlement(finishData: any) {
        if (!finishData) {

            if (this.hyperSpinStore.isActiveHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true);
            }

            return;
        }

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const skipPlayFreeSpin = this.shouldSkipPlayFreeSpin(isFreeSpinActive);
        if (skipPlayFreeSpin && this.hyperSpinStore.isActiveHyperSpin) {
            this.hyperSpinHandler.checkHyperSpinNextRound(true);
            return;
        }

        this.handleFreeSpinLogic(settlementData);

        if (this.hyperSpinStore.isActiveHyperSpin) {
            this.hyperSpinHandler.checkHyperSpinNextRound(false);
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

    private shouldSkipPlayFreeSpin(isFreeSpinActive: boolean): boolean {
        const stopOnFeature = this.hyperSpinStore.stopOnFeature;
        return !isFreeSpinActive || !stopOnFeature;
    }

    private handleFreeSpinLogic(settlementData: any) {
        const shouldStopForFeature = this.hyperSpinStore.stopOnFeature && settlementData.freeSpins > 0;

        if (shouldStopForFeature) {
            this.hyperSpinHandler.stopHyperSpin();
        }
    }
}
