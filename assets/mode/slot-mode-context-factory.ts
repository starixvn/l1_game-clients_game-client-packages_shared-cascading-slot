import { SlotModeContext } from './slot-mode-context';

/**
 * Factory for creating SlotModeContext instances.
 * 
 * Centralizes the logic for determining animation behavior based on game mode.
 */
export class SlotModeContextFactory {
    /**
     * Create context for normal mode.
     * Normal mode plays all animations at standard durations.
     */
    static createNormal(): SlotModeContext {
        return {
            mode: 'normal',
            skipAnimations: false,
            isTurbo: false,
            isHyperSpinActive: false,
            animationDurationMultiplier: 1.0
        };
    }
    
    /**
     * Create context for turbo mode.
     * Turbo mode plays animations but with reduced durations.
     */
    static createTurbo(): SlotModeContext {
        return {
            mode: 'turbo',
            skipAnimations: false, // Durations reduced instead of skipped
            isTurbo: true,
            isHyperSpinActive: false,
            animationDurationMultiplier: 0.5 // Example: 50% faster
        };
    }
    
    /**
     * Create context for hyper-spin mode.
     * 
     * Hyper-spin mode skips animations for maximum speed, unless:
     * - Free spins are active AND
     * - stopOnFeature is enabled (user wants to see free spin UI)
     * 
     * @param stopOnFeature - Whether to stop and show UI when features trigger
     * @param isFreeSpinActive - Whether free spins are currently active
     */
    static createHyperSpin(
        stopOnFeature: boolean,
        isFreeSpinActive: boolean
    ): SlotModeContext {
        // Skip animations unless free spins + stopOnFeature
        const skipAnimations = !(isFreeSpinActive && stopOnFeature);
        
        return {
            mode: 'hyper-spin',
            skipAnimations,
            isTurbo: false,
            isHyperSpinActive: true,
            stopOnFeature,
            isFreeSpinActive,
            animationDurationMultiplier: skipAnimations ? 0 : 1.0
        };
    }
}

