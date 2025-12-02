import { CascadingSlotState } from "../cascading-slot-state";

/**
 * Interface for shared game state between modes.
 * Provides read-only access to essential game state.
 */
export interface IGameState {
    readonly userBalance: number;
    readonly freeSpinsTotal: number;
    readonly cascadingState: CascadingSlotState;
    readonly isFreeSpins: boolean;
    readonly changeUserBalance: boolean;
    readonly isPlacingBet: boolean;
    readonly roundId: number;
}

/**
 * Interface for mode-specific state management.
 * Each mode implements this for its own state needs.
 */
export interface IModeState {
    /**
     * Check if the mode is currently active.
     */
    isActive(): boolean;
    
    /**
     * Activate the mode.
     */
    activate(): void;
    
    /**
     * Deactivate the mode.
     */
    deactivate(): void;
}

