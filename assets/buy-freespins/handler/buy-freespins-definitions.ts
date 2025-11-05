import { cascadingSlotLogger } from "../../cascading-slot-logger";

cascadingSlotLogger.info('[BUY_FREESPINS_DEFINITIONS] Initializing buy freespins definitions');

export enum BuyFsPopupName {
    BUY_CONFIRMATION = "buy-fs-confirmation",
    BUY_FS_CONGRATULATION = "buy-fs-congratulation",
}

export enum BuyFsPopupEvent {
    SHOW = "show",
    HIDE = "hide",
}

export interface IBuyFreespinsPopupEvent {
    name: string;
    event: string;
}

export interface BuyFsResult {
    totalWin: number;
    numberOfFreeSpins: number;
}

export enum BuyFsFeatureMessage {
    Feature_Name = "buyFreeSpins",
    Result = "buyFreeSpinResult",
}

cascadingSlotLogger.info('[BUY_FREESPINS_DEFINITIONS] Buy freespins definitions loaded:', {
    popupNames: Object.values(BuyFsPopupName),
    popupEvents: Object.values(BuyFsPopupEvent),
    featureMessages: Object.values(BuyFsFeatureMessage)
});
