import inversify from "inversify";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIStore) protected readonly gameState: CascadingUIStore;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;

    async handleSettlement(finishData: any) {
        if (!finishData) {
            (this.gameState as any).isFreeSpinEffectCompleted = true;

            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true);
            }

            return;
        }

        this.uiHandler.handleChangeUserBalance(false);

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const skipAnimations = this.shouldSkipAnimations(isFreeSpinActive);

        if (skipAnimations) {
            this.updateMinimalState(settlementData);

            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(true);
            }

            return;
        }

        this.handleFreeSpinLogic(settlementData);

        setTimeout(() => {
            if (this.hyperSpinStore.isHyperSpin) {
                this.hyperSpinHandler.checkHyperSpinNextRound(false);
            }
        }, 0);
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

    private shouldSkipAnimations(isFreeSpinActive: boolean): boolean {
        const stopOnFeature = this.hyperSpinStore.stopOnFeature;
        return !isFreeSpinActive || !stopOnFeature;
    }

    private handleFreeSpinLogic(settlementData: any) {
        this.uiHandler.handleFreeSpinsByRound(settlementData.freeSpins);
        this.uiHandler.handleFreeSpinsTotal(settlementData.totalFreeSpins);

        const shouldStopForFeature = this.hyperSpinStore.stopOnFeature && settlementData.freeSpins > 0;

        if (shouldStopForFeature) {
            this.hyperSpinHandler.stopHyperSpin();
        } else {
            (this.gameState as any).isFreeSpinEffectCompleted = true;
        }
    }

    private updateMinimalState(settlementData: any) {
        if (settlementData.win > 0) {
            this.uiHandler.handleChangeUserBalance(true);
            this.uiHandler.handleTotalWin({ win: settlementData.win, isActualWin: true });
        }

        this.handleFreeSpinLogic(settlementData);
    }

}
