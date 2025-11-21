import { EventTarget, Node, tween, UIOpacity } from "cc";
import { CascadingSlotConfig } from "./cascading-slot-base-configs";
import { Tumble } from "./game-messages-cascading";

export enum SpecialSymbol {
    SCATTER_SYMBOL = 9,
    MULTIPLIER_SYMBOL = 10,
}

export const SlotNotification = {
    BEFORE_SPIN: "BEFORE_SPIN",
    BEFORE_SPIN_TRIAL: "BEFORE_SPIN_TRIAL",
    SPINNING: "SPINNING",
    SETTLED: "SETTLED",
    TUMBLE_WIN: "TUMBLE_WIN",
    FREESPINS: "FREESPINS",
    AUTO_SPIN: "AUTO_SPIN",
    HYPER_SPIN: "HYPER_SPIN",
};

export const SpinButtonState = {
    IDLE: "IDLE",
    SPINNING: "SPINNING",
    WIN_TUMBLE_OR_EVENT: "WIN_TUMBLE_OR_EVENT",
};

export enum BoardSize {
    COLUMN = 6,
    ROW = 5,
}

export const convertBoardValue = (data: number[]): number[][] => {
    const result: number[][] = [];

    const column = BoardSize.COLUMN;
    const row = BoardSize.ROW;

    for (let i = 0; i < column; i++) {
        result.push([]);
        for (let j = 0; j < row; j++) {
            result[i].push(data[i * row + row - j - 1]);
        }
    }

    return result;
};

export const convertStringToArray = (data: string) => {
    return data.split(",").map((value) => {
        return value !== "" ? +value : null;
    });
};

export const convertData = (value: string) => {
    return convertBoardValue(convertStringToArray(value));
};

export interface GameFeatureJson {
    turnOnEventMascot: boolean;
    turnOnMultiplierMascot: boolean;
    multiplierMascotAnimationName: string;
    bigWinMascotAnimationName: string;
    freespinMascotAnimationName: string;
    enablePeekEffect: boolean;
    effectIntroMultiplier: boolean;
    fixedExplodeDuration: number;
    allowFreeSpinsFeature: boolean;
    multiplierLandMascotAnimationName: string;
    newMultiplierRange: boolean;
}

export interface ColorJson {
    bottomAreaTextColor: string;
    bottomAreaNumberColor: string;
    bottomAreaButtonBorderColor: string;
    bottomAreaButtonBackgroundColor: string;
    bottomAreaWinAmountColor: string;
    previewOddsBorderColor: string;
    previewOddsSymbolNumberColor: string;
    previewOddsWinValueColor: string;
    noticeTextColor: string;
    noticeHighlightTextColor: string;
    topMessageTextColor: string;
}

interface ResourceCaches {
    slotSymbols?: any;
    gameFeatures?: GameFeatureJson;
    colorJson?: ColorJson;
}

export const resourcesCache: ResourceCaches = {
    slotSymbols: {},
};

export const globalEmitter = new EventTarget();

export enum SlotClientEvent {
    EFFECT_INTRO_MULTIPLIER = "effectIntroMultiplier",
}

export interface SymbolBoard {
    symbols: number[][];
    multipliers: number[];
    tumbles: Tumble[];
}

export interface WinIconDetail {
    count: number;
    win: number;
}

export const showNode = (node: Node, transitionTime = 0.3) => {
    const nodeOpacity = node.getComponent(UIOpacity);
    node.active = true;
    nodeOpacity.opacity = 1;
    tween(nodeOpacity).to(transitionTime, { opacity: 255 }).start();
};

export const hideNode = (node: Node, options: any) => {
    const duration = options.duration ?? 0.3;
    const onHidden = options.onHidden;
    tween(node.getComponent(UIOpacity))
        .to(duration, { opacity: 1 })
        .call(() => {
            onHidden && onHidden();
        })
        .start();
};

export const getCustomDuration = (key: string, isTurboMode: boolean): number => {
    const config = isTurboMode ? CascadingSlotConfig.turbo : CascadingSlotConfig.normal;
    return config[key];
};

export const findIndex = (value: number, valueList: number[]) => {
    return valueList.findIndex((item) => item === value);
};

export const calculateTotalBet = (level: number, coin: number, betMultiplier: number) => {
    return +(level * coin * betMultiplier);
};

export enum DialogName {
    PREVIEW_ODDS = "preview-odds",
    IN_GAME_MENU = "in-game-menu",
    DUMMY_DIALOG = "dummy-dialog",
    AUTO_SPIN = "auto-spin",
    TURBO_MODE = "turbo-mode",
    BET_CONTROL = "bet-control",
    TRIAL_MODE = "trial-mode",

    BUY_CONFIRMATION = "buy-fs-confirmation",
    BUY_FS_CONGRATULATION = "buy-fs-congratulation",
    HYPER_SPIN = "hyper-spin",
}
