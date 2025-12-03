import inversify from "inversify";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinHandler } from "./hyper-spin-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinSettlementHandler {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;

    async handleSettlement(finishData: any) {
        const hasData = !!finishData;
        const isActive = this.hyperSpinStore.isActiveHyperSpin;
        const data = hasData ? finishData : {};
        const isFreeSpin = data.isFreeSpin || data.totalFreeSpins > 0;
        const shouldStop = isFreeSpin && this.hyperSpinStore.stopOnFeature;

        if (!hasData && isActive) {
            this.hyperSpinHandler.checkHyperSpinNextRound(true);
            return;
        }

        if (shouldStop) {
            this.hyperSpinHandler.checkHyperSpinNextRound(false);
            this.handleFreeSpinOnNormalMode();
        } else {
            this.hyperSpinHandler.checkHyperSpinNextRound(true);
        }
    }

    private handleFreeSpinOnNormalMode() {
        // Stop hyper spin immediately when free spins are triggered
        this.hyperSpinHandler.stopHyperSpin();
        this.hyperSpinStore.autoClosePopupByTurnOnFeature = true;
        this.hyperSpinStore.isOpenHyperSpinPopup = false;
        this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;
    }
}
