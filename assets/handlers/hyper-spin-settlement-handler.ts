import inversify from "inversify";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;

    async handleSettlement(finishData: any) {
        if (!finishData) {

            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true);
            }

            return;
        }

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const skipPlayFreeSpin = this.shouldSkipPlayFreeSpin(isFreeSpinActive);
        if (skipPlayFreeSpin && this.hyperSpinStore.isHyperSpin) {
            this.hyperSpinHandler.checkHyperSpinNextRound(true);
            return;
        }

        this.handleFreeSpinLogic(settlementData);

        if (this.hyperSpinStore.isHyperSpin) {
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
