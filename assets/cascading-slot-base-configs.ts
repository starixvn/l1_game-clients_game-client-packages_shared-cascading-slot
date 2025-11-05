import { cascadingSlotLogger } from "./cascading-slot-logger";

cascadingSlotLogger.info('[CASCADE_SLOT_BASE_CONFIGS] Initializing cascading slot base configurations');

export const CascadingSlotConfig: CascadingSlotBaseConfig = {
    normal: {
        highlightWinItemsDuration: 0.5,
        freeSpin: 4,
        bigWin: 2.17,
        bigWinFloatNumber: 3,
        delayForNextSpin: 1,
        transition: 1.16,
        eventMascot: 2,
    },

    turbo: {
        highlightWinItemsDuration: 0.3,
        freeSpin: 2.5,
        bigWin: 2.17,
        bigWinFloatNumber: 0.3,
        delayForNextSpin: 1,
        transition: 1.16,
        eventMascot: 2,
    },

    itemTypeCount: 11,
    reelItemCount: 5,
    symbolCount: 14,
};

cascadingSlotLogger.info('[CASCADE_SLOT_BASE_CONFIGS] Configuration loaded:', {
    normal: CascadingSlotConfig.normal,
    turbo: CascadingSlotConfig.turbo,
    itemTypeCount: CascadingSlotConfig.itemTypeCount,
    reelItemCount: CascadingSlotConfig.reelItemCount,
    symbolCount: CascadingSlotConfig.symbolCount
});

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
