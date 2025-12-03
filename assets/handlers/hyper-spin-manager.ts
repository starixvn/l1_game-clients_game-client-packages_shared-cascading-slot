import inversify from "inversify";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinSettlementHandler } from "./hyper-spin-settlement-handler";
import { HyperSpinHandler } from "./hyper-spin-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinManager {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(HyperSpinSettlementHandler) protected readonly hyperSpinSettlementHandler: HyperSpinSettlementHandler;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;
    private static _instance: HyperSpinManager | null = null;

    constructor() {
        HyperSpinManager._instance = this;
    }

    static getInstance(): HyperSpinManager | null {
        return HyperSpinManager._instance;
    }

    async handleSettlementIfActive(finishData: any): Promise<boolean> {
        if (!this.hyperSpinStore.isActiveHyperSpin || this.hyperSpinStore.autoClosePopupByTurnOnFeature) {
            return false;
        }

        await this.hyperSpinSettlementHandler.handleSettlement(finishData);
        this.hyperSpinHandler.handleRecordSpinData(finishData);

        return this.hyperSpinStore.isActiveHyperSpin;
    }

    checkAndTriggerFreeSpinAfterFeature(): void {
        if (this.hyperSpinHandler && typeof this.hyperSpinHandler.checkAndTriggerFreeSpinAfterFeature === 'function') {
            this.hyperSpinHandler.checkAndTriggerFreeSpinAfterFeature();
        }
    }
}
