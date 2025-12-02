import { CascadingSlotState } from "../cascading-slot-state";

/**
 * Interface for UI update operations.
 * Abstracts UI updates from mode-specific implementations.
 */
export interface IUIHandler {
    /**
     * Handle user balance change flag.
     * @param changed Whether balance has changed
     */
    handleChangeUserBalance(changed: boolean): void;
    
    /**
     * Handle total win update.
     * @param params Win information
     */
    handleTotalWin(params: { win: number; isActualWin: boolean }): void;
    
    /**
     * Handle free spins by round update.
     * @param freespins Number of free spins for current round
     */
    handleFreeSpinsByRound(freespins: number): void;
    
    /**
     * Handle total free spins update.
     * @param totalFreeSpins Total number of free spins remaining
     */
    handleFreeSpinsTotal(totalFreeSpins: number): void;
    
    /**
     * Handle new round initialization.
     */
    handleNewRound(): void;
    
    /**
     * Change cascading slot state.
     * @param state New cascading slot state (string or CascadingSlotState)
     */
    changeCascadingState(state: CascadingSlotState | string): void;
    
    /**
     * Handle free spin effect completion.
     * @param completed Whether free spin effects are completed
     */
    handleFreeSpinEffectCompleted(completed: boolean): void;
}

