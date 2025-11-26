/**
 * Slot Mode Context
 * 
 * Encapsulates all mode-related information for animation control and game behavior.
 * This replaces multiple boolean parameters with a single, type-safe context object.
 */

export type SlotMode = 'normal' | 'turbo' | 'hyper-spin';

/**
 * Context object containing all mode-related information for slot game operations.
 * 
 * This replaces the need to pass multiple boolean parameters (isTurbo, isHyperSpinActive, 
 * stopOnFeature, isFreeSpinActive) through method calls.
 */
export interface SlotModeContext {
    /** Current game mode */
    readonly mode: SlotMode;
    
    /** Whether animations should be skipped for faster execution */
    readonly skipAnimations: boolean;
    
    /** Whether turbo mode is active (for duration calculations) */
    readonly isTurbo: boolean;
    
    /** Whether hyper-spin mode is active */
    readonly isHyperSpinActive: boolean;
    
    /** Whether to stop and show UI when features trigger (hyper-spin setting) */
    readonly stopOnFeature?: boolean;
    
    /** Whether free spins are currently active */
    readonly isFreeSpinActive?: boolean;
    
    /** Animation duration multiplier (1.0 = normal, 0.5 = turbo, 0 = instant) */
    readonly animationDurationMultiplier?: number;
}

