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
    async handleSettlementIfActive(
        finishData: any,
    ): Promise<boolean> {
        console.log('[HyperSpinManager] handleSettlementIfActive - isActiveHyperSpin:', this.hyperSpinStore.isActiveHyperSpin, 'autoClosePopupByTurnOnFeature:', this.hyperSpinStore.autoClosePopupByTurnOnFeature, 'finishData:', !!finishData);

        // If hyper spin is not active at start, don't handle as hyper spin settlement
        if (!this.hyperSpinStore.isActiveHyperSpin) {
            console.log('[HyperSpinManager] Returning false - hyper spin not active');
            return false;
        }

        // If hyper spin was already stopped due to feature trigger, let normal settlement handle it
        if (this.hyperSpinStore.autoClosePopupByTurnOnFeature) {
            console.log('[HyperSpinManager] Returning false - autoClosePopupByTurnOnFeature is true');
            return false;
        }

        console.log('[HyperSpinManager] Processing as hyper spin settlement');
        // Handle as active hyper spin settlement
        const wasActiveBeforeProcessing = this.hyperSpinStore.isActiveHyperSpin;
        await this.hyperSpinSettlementHandler.handleSettlement(finishData);
        this.hyperSpinHandler.handleRecordSpinData(finishData);

        // Check if hyper spin was stopped during settlement processing
        const isStillActiveAfterProcessing = this.hyperSpinStore.isActiveHyperSpin;
        const wasStoppedDuringProcessing = wasActiveBeforeProcessing && !isStillActiveAfterProcessing;

        if (wasStoppedDuringProcessing) {
            console.log('[HyperSpinManager] Hyper spin was stopped during processing, returning false to allow normal settlement');
            return false;
        }

        console.log('[HyperSpinManager] Returning true - hyper spin settlement completed normally');
        return true;
    }

    async handleNextRoundIfActive(): Promise<boolean> {
        if (!this.hyperSpinStore.isActiveHyperSpin) {
            return false;
        }

        this.hyperSpinHandler.checkHyperSpinNextRound();
        return true;
    }

    isActive(): boolean {
        return this.hyperSpinStore.isActiveHyperSpin;
    }
}
