export const CascadingSlotConfig: CascadingSlotBaseConfig = {
    normal: {
        highlightWinItemsDuration: 0.5,
        freeSpin: 4,
        bigWin: 2.17,
        bigWinFloatNumber: 3,
        delayForNextSpin: 0.3,
        transition: 1.16,
        eventMascot: 2,
    },

    turbo: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.5,
        transition: 1.16,
        eventMascot: 2,
    },

    itemTypeCount: 11,
    reelItemCount: 5,
    symbolCount: 14,
};

export interface CascadingSlotBaseConfig {
    normal: CascadingSlotConfigDuration;
    turbo: CascadingSlotConfigDuration;

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
}
