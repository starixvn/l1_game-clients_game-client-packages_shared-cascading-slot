export const CascadingSlotConfig: CascadingSlotBaseConfig = {
    normal: {
        highlightWinItemsDuration: 0.5,
        freeSpin: 4,
        bigWin: 2.17,
        bigWinFloatNumber: 3,
        delayForNextSpin: 1,
        transition: 1.16,
        eventMascot: 2,
        ratioSymbolMatchAndExplosion: 1,
        ratioMascotAnimSpeed: 1,
        minDurationFallIn: 0.4,
        minDurationFallOut: 0.25,
        ratioEventSpineSpeed: 1,
        delayBeforeRefillSymbols: 0.2,
        totalMultiplierAnimDuration: 0.6,
        totalWinLabelAnimDuration: 0.6,
        bottomMessageAnimDuration: 0.3,
        zoomInValueDuration: 0.5,
    },

    turbo: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.4,
        transition: 1.16,
        eventMascot: 2,
        ratioSymbolMatchAndExplosion: 0.5,
        ratioMascotAnimSpeed: 0.5,
        minDurationFallIn: 0.25,
        minDurationFallOut: 0.1,
        ratioEventSpineSpeed: 1,
        delayBeforeRefillSymbols: 0.1,
        totalMultiplierAnimDuration: 0.6,
        totalWinLabelAnimDuration: 0.6,
        bottomMessageAnimDuration: 0.3,
        zoomInValueDuration: 0.3,
    },

    ultra: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.1,
        transition: 1.16,
        eventMascot: 1,
        ratioSymbolMatchAndExplosion: 0.25,
        ratioMascotAnimSpeed: 2,
        minDurationFallIn: 0.05,
        minDurationFallOut: 0.05,
        ratioEventSpineSpeed: 2,
        delayBeforeRefillSymbols: 0,
        totalMultiplierAnimDuration: 0.15,
        totalWinLabelAnimDuration: 0.1,
        bottomMessageAnimDuration: 0.1,
        zoomInValueDuration: 0.1,
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
    ratioSymbolMatchAndExplosion?: number;
    ratioMascotAnimSpeed?: number;
    minDurationFallIn: number;
    minDurationFallOut: number;
    ratioEventSpineSpeed?: number;
    delayBeforeRefillSymbols?: number;
    totalMultiplierAnimDuration: number;
    bottomMessageAnimDuration: number;
    totalWinLabelAnimDuration: number;
    zoomInValueDuration: number;
}
