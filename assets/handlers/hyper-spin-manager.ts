import inversify from "inversify";
import { CascadingSlotBoard } from "../components/slot-board/components/cascading-slot-board";
import { TumbleWinWiew } from "../components/tumbles/tumble-win-view";
import { TotalMultiplierView } from "../components/total-multiplier/cascading-total-multiplier-view";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { HyperSpinSettlementHandler } from "./hyper-spin-settlement-handler";
import { HyperSpinHandler } from "./hyper-spin-handler";

const { injectable, inject } = inversify;

/**
 * HyperSpinManager - Consolidates all hyper-spin logic and routing.
 * Provides clean entry points for hyper-spin functionality while keeping
 * CascadingSlotGame completely unaware of hyper-spin implementation details.
 */
@injectable()
export class HyperSpinManager {
    // Static instance for direct access when DI container is not available
    private static _instance: HyperSpinManager | null = null;
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;
    @inject(CascadingUIStore) protected readonly gameState: CascadingUIStore;
    @inject(HyperSpinSettlementHandler) protected readonly hyperSpinSettlementHandler: HyperSpinSettlementHandler;
    @inject(HyperSpinHandler) protected readonly hyperSpinHandler: HyperSpinHandler;

    // Local state for routing checks
    private isHyperSpinActive = false;

    constructor() {
        // Set static instance for direct access
        HyperSpinManager._instance = this;
    }

    /**
     * Get the HyperSpinManager instance (for cases where DI container is not available)
     */
    static getInstance(): HyperSpinManager | null {
        return HyperSpinManager._instance;
    }

    /**
     * Initialize reactive state sync
     */
    initialize() {
        // Sync hyper-spin active state
        this.syncHyperSpinState();
    }

    /**
     * Sync hyper-spin state from store
     */
    private syncHyperSpinState() {
        const previousState = this.isHyperSpinActive;
        this.isHyperSpinActive = this.hyperSpinStore.isHyperSpin;
    }

    /**
     * Check if settlement should be routed to hyper-spin workflow.
     * Returns true if hyper-spin handled the settlement, false otherwise.
     */
    async handleSettlementIfActive(
        finishData: any,
        board: CascadingSlotBoard,
        tumbleWinView: TumbleWinWiew | null,
        totalMultiplierView: TotalMultiplierView | null
    ): Promise<boolean> {
        // Update state sync
        this.syncHyperSpinState();

        if (this.isHyperSpinActive) {
            // Route to hyper-spin settlement handler
            await this.hyperSpinSettlementHandler.handleSettlement(
                finishData,
                tumbleWinView,
                totalMultiplierView
            );

            // Record hyper-spin data after settlement
            this.hyperSpinHandler.handleRecordSpinData(finishData);

            return true; // Settlement was handled by hyper-spin
        }

        return false; // Normal settlement should proceed
    }

    /**
     * Check if next round should be routed to hyper-spin workflow.
     * Returns true if hyper-spin handled the next round, false otherwise.
     */
    async handleNextRoundIfActive(): Promise<boolean> {
        // Update state sync
        this.syncHyperSpinState();

        if (this.isHyperSpinActive) {
            // Route to hyper-spin next round handler
            await this.hyperSpinHandler.checkHyperSpinNextRound();

            return true; // Next round was handled by hyper-spin
        }

        return false; // Normal next round should proceed
    }

    /**
     * Get current hyper-spin active state
     */
    isActive(): boolean {
        this.syncHyperSpinState();

        return this.isHyperSpinActive;
    }

}
