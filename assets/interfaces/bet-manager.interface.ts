/**
 * Interface for bet management operations.
 * Abstracts bet operations from mode-specific implementations.
 */
export interface IBetManager {
    /**
     * Current total bet amount.
     */
    readonly totalBet: number;
    
    /**
     * Effective total bet (may differ from totalBet in some scenarios).
     */
    readonly effectiveTotalBet: number;
    
    /**
     * Effective coin value.
     */
    readonly effectiveCoinValue: number;
    
    /**
     * Effective bet level.
     */
    readonly effectiveBetLevel: number;
    
    /**
     * Array of unique total bet options.
     */
    readonly totalBetUnique: Array<Record<string, any>>;
    
    /**
     * Whether bet can be increased/decreased.
     */
    readonly interactableTotalBet: { increase: boolean; decrease: boolean };
    
    /**
     * Formatted total bet string.
     */
    readonly formattedTotalBet: string;
    
    /**
     * Total bet slider progress (0-1).
     */
    readonly totalBetSliderProgress: number;
    
    /**
     * Change total bet amount.
     * @param increase Whether to increase (true) or decrease (false)
     */
    changeTotalBet(increase: boolean): void;
    
    /**
     * Set total bet from slider progress.
     * @param progress Slider progress value (0-1)
     */
    setTotalBetFromSlider(progress: number): void;
}

