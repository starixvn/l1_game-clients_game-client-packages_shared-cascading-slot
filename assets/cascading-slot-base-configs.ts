export const CascadingSlotConfig: CascadingSlotBaseConfig = {
    normal: {
        highlightWinItemsDuration: 0.5,
        freeSpin: 4,
        bigWin: 2.17,
        bigWinFloatNumber: 3,
        delayForNextSpin: 1,
        transition: 1.16,
        eventMascot: 2,
        ratioMascotAnimSpeed: 1,
        ratioMatchAndExplosionSymbol: 1,
        minDurationFallIn: 0.4,
        minDurationFallOut: 0.25,
        ratioEventSpineSpeed: 1,
        delayBeforeRefillSymbols: 0.2,
        totalMultiplierAnimDuration: 0.6,
        totalWinLabelAnimDuration: 0.6,
        bottomMessageAnimDuration: 0.3,
        bottomMultiplierAnimDuration: 0.4,
        zoomInValueDuration: 0.3,
        scaleDurationMultiplier: 1,
        labelTumbleWinAnimDuration: 2.3,
        multiplierTumbleWinAnimDuration: 3,
    },

    turbo: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.4,
        transition: 1.16,
        eventMascot: 2,
        ratioMascotAnimSpeed: 0.5,
        ratioMatchAndExplosionSymbol: 0.5,
        minDurationFallIn: 0.28,
        minDurationFallOut: 0.2,
        ratioEventSpineSpeed: 1,
        delayBeforeRefillSymbols: 0.1,
        totalMultiplierAnimDuration: 0.6,
        totalWinLabelAnimDuration: 0.6,
        bottomMessageAnimDuration: 0.3,
        bottomMultiplierAnimDuration: 0.4,
        zoomInValueDuration: 0.3,
        scaleDurationMultiplier: 0.5,
        labelTumbleWinAnimDuration: 1.5,
        multiplierTumbleWinAnimDuration: 1.5,
    },

    ultra: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.1,
        transition: 1.16,
        eventMascot: 1,
        ratioMascotAnimSpeed: 2,
        ratioMatchAndExplosionSymbol: 0.1,
        minDurationFallIn: 0.01,
        minDurationFallOut: 0.02,
        ratioEventSpineSpeed: 2,
        delayBeforeRefillSymbols: 0,
        totalMultiplierAnimDuration: 0.15,
        totalWinLabelAnimDuration: 0.1,
        bottomMessageAnimDuration: 0.1,
        bottomMultiplierAnimDuration: 0.1,
        zoomInValueDuration: 0.1,
        scaleDurationMultiplier: 0.1,
        labelTumbleWinAnimDuration: 0.5,
        multiplierTumbleWinAnimDuration: 0.5,
    },

    itemTypeCount: 11,
    reelItemCount: 5,
    symbolCount: 14,
};

export interface CascadingSlotBaseConfig {
    normal: CascadingSlotConfigDuration;
    turbo: CascadingSlotConfigDuration;
    ultra: CascadingSlotConfigDuration;
    itemTypeCount: number;
    reelItemCount: number;
    symbolCount: number;
}

export interface CascadingSlotConfigDuration {
    highlightWinItemsDuration: number;
    freeSpin: number;
    bigWin: number;
    bigWinFloatNumber: number;
    delayForNextSpin: number;
    transition?: number;
    eventMascot?: number;
    ratioMascotAnimSpeed?: number;
    ratioMatchAndExplosionSymbol?: number;
    minDurationFallIn: number;
    minDurationFallOut: number;
    ratioEventSpineSpeed?: number;
    delayBeforeRefillSymbols?: number;
    totalMultiplierAnimDuration: number;
    bottomMessageAnimDuration: number;
    bottomMultiplierAnimDuration: number;
    totalWinLabelAnimDuration: number;
    zoomInValueDuration: number;
    scaleDurationMultiplier: number;
    labelTumbleWinAnimDuration: number;
    multiplierTumbleWinAnimDuration: number;
}
