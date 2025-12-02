import inversify from "inversify";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinSettlementHandler } from "./hyper-spin-settlement-handler";
import { HyperSpinHandler } from "./hyper-spin-handler";

const { injectable, inject } = inversify;

@injectable()
export class HyperSpinManager {
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIStore) protected readonly gameState: CascadingUIStore;
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
        if (!this.hyperSpinStore.isHyperSpin) {
            return false;
        }

        await this.hyperSpinSettlementHandler.handleSettlement(finishData);

        this.hyperSpinHandler.handleRecordSpinData(finishData);
        return true;
    }

    async handleNextRoundIfActive(): Promise<boolean> {
        if (!this.hyperSpinStore.isHyperSpin) {
            return false;
        }

        await this.hyperSpinHandler.checkHyperSpinNextRound();
        return true;
    }

    isActive(): boolean {
        return this.hyperSpinStore.isHyperSpin;
    }
}
