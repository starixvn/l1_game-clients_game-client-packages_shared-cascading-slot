import { TumbleWinWiew } from "../components/tumbles/tumble-win-view";
import { TotalMultiplierView } from "../components/total-multiplier/cascading-total-multiplier-view";

/**
 * Interface for board rendering operations.
 * Abstracts board operations from mode-specific implementations.
 */
export interface IBoardRenderer {
    /**
     * Handle spin result display.
     * @param symbolsBoard Board symbols data
     * @param isTurbo Whether turbo mode is active
     * @param skipAnimations Whether to skip animations (for hyper-spin mode)
     */
    spinResult(
        symbolsBoard: any,
        isTurbo: boolean,
        skipAnimations?: boolean
    ): Promise<void>;
    
    /**
     * Handle tumbles (cascading reels).
     * @param tumbles Array of tumble data
     * @param isTurbo Whether turbo mode is active
     * @param skipAnimations Whether to skip animations (for hyper-spin mode)
     */
    handleTumbles(
        tumbles: any[],
        isTurbo: boolean,
        skipAnimations?: boolean
    ): Promise<void>;
    
    /**
     * Handle multiplier display.
     * @param isFreeSpin Whether free spin is active
     * @param winMultiplier Whether win multiplier should be shown
     * @param tumbleWinView Tumble win view component
     * @param totalMultiplierView Total multiplier view component
     */
    handleMultiplier(
        isFreeSpin: boolean,
        winMultiplier: boolean,
        tumbleWinView: TumbleWinWiew | null,
        totalMultiplierView: TotalMultiplierView | null
    ): Promise<void>;
}

