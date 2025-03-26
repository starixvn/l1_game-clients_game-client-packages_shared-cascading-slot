export const CascadingSlotConfig: CascadingSlotBaseConfig = {
    normal: {
        highlightWinItemsDuration: 0.5,
        freeSpin: 4,
        bigWin: 1,
        bigWinFloatNumber: 3,
        delayForNextSpin: 0.3,
    },

    turbo: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 1,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 0.5,
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
}

export enum ConfigDurationEnum {
    highlightWinItemsDuration = "highlightWinItemsDuration",
}

export const UNIT_SECOND_SPIN = 1000;
