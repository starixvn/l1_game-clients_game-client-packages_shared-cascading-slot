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
