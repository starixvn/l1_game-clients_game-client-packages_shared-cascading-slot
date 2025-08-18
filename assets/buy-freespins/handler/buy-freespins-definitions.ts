export enum BuyFsPopupName {
    BUY_CONFIRMATION = "buy_confirmation",
    BUY_FS_CONGRATULATION = "buy_fs_congratulation",
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
