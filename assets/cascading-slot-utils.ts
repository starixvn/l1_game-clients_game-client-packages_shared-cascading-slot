import { EventTarget, Node, tween, UIOpacity } from "cc";
import { CascadingSlotConfig } from "./cascading-slot-base-configs";
import { Tumble } from "./game-messages-cascading";
import { cascadingSlotLogger } from "./cascading-slot-logger";

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
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertBoardValue called", {
        data,
        dataLength: data?.length,
        columnSize: BoardSize.COLUMN,
        rowSize: BoardSize.ROW,
        expectedTotalElements: BoardSize.COLUMN * BoardSize.ROW,
        timestamp: new Date().toISOString()
    });

    const result: number[][] = [];
    const column = BoardSize.COLUMN;
    const row = BoardSize.ROW;

    for (let i = 0; i < column; i++) {
        result.push([]);
        cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Processing column", {
            columnIndex: i,
            columnArrayInitialized: true,
            timestamp: new Date().toISOString()
        });

        for (let j = 0; j < row; j++) {
            const dataIndex = i * row + row - j - 1;
            const value = data[dataIndex];
            result[i].push(value);

            cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Added value to column", {
                columnIndex: i,
                rowIndex: j,
                dataIndex,
                value,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Column completed", {
            columnIndex: i,
            columnLength: result[i].length,
            columnValues: result[i],
            timestamp: new Date().toISOString()
        });
    }

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertBoardValue completed", {
        result,
        resultColumns: result.length,
        resultRows: result[0]?.length,
        timestamp: new Date().toISOString()
    });

    return result;
};

export const convertStringToArray = (data: string) => {
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertStringToArray called", {
        data,
        dataLength: data?.length,
        willSplitByComma: true,
        timestamp: new Date().toISOString()
    });

    const result = data.split(",").map((value) => {
        const processedValue = value !== "" ? +value : null;
        cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Processing string value", {
            originalValue: value,
            processedValue,
            isEmptyString: value === "",
            isNumeric: !isNaN(+value),
            timestamp: new Date().toISOString()
        });
        return processedValue;
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertStringToArray completed", {
        result,
        resultLength: result.length,
        nullValuesCount: result.filter(v => v === null).length,
        numericValuesCount: result.filter(v => v !== null).length,
        timestamp: new Date().toISOString()
    });

    return result;
};

export const convertData = (value: string) => {
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertData called", {
        value,
        valueLength: value?.length,
        willConvertStringToArray: true,
        willConvertBoardValue: true,
        timestamp: new Date().toISOString()
    });

    const arrayData = convertStringToArray(value);
        cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] String converted to array", {
        arrayData,
        arrayLength: arrayData.length,
        timestamp: new Date().toISOString()
    });

    const boardData = convertBoardValue(arrayData);
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Array converted to board", {
        boardData,
        boardColumns: boardData.length,
        boardRows: boardData[0]?.length,
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] convertData completed", {
        finalResult: boardData,
        timestamp: new Date().toISOString()
    });

    return boardData;
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
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] showNode called", {
        nodeName: node?.name,
        hasNode: !!node,
        transitionTime,
        willSetActive: true,
        willAnimateOpacity: true,
        timestamp: new Date().toISOString()
    });

    const nodeOpacity = node.getComponent(UIOpacity);
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Got UIOpacity component", {
        hasUIOpacity: !!nodeOpacity,
        currentOpacity: nodeOpacity?.opacity,
        timestamp: new Date().toISOString()
    });

    node.active = true;
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Node set to active", {
        nodeActive: node.active,
        timestamp: new Date().toISOString()
    });

    nodeOpacity.opacity = 1;
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Initial opacity set to 1", {
        initialOpacity: nodeOpacity.opacity,
        timestamp: new Date().toISOString()
    });

    tween(nodeOpacity).to(transitionTime, { opacity: 255 }).start();
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Opacity tween started", {
        targetOpacity: 255,
        transitionTime,
        tweenStarted: true,
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] showNode completed", {
        finalNodeActive: node.active,
        finalOpacity: nodeOpacity.opacity,
        timestamp: new Date().toISOString()
    });
};

export const hideNode = (node: Node, options: any) => {
    const duration = options.duration ?? 0.3;
    const onHidden = options.onHidden;

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] hideNode called", {
        nodeName: node?.name,
        hasNode: !!node,
        options,
        duration,
        hasOnHiddenCallback: !!onHidden,
        willAnimateOpacity: true,
        timestamp: new Date().toISOString()
    });

    tween(node.getComponent(UIOpacity))
        .to(duration, { opacity: 1 })
        .call(() => {
            cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Hide animation completed, calling onHidden callback", {
                onHiddenCallbackExists: !!onHidden,
                timestamp: new Date().toISOString()
            });
            onHidden && onHidden();
        })
        .start();

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Hide tween started", {
        targetOpacity: 1,
        duration,
        tweenStarted: true,
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] hideNode completed", {
        tweenInitiated: true,
        timestamp: new Date().toISOString()
    });
};

export const getCustomDuration = (key: string, isTurboMode: boolean): number => {
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] getCustomDuration called", {
        key,
        isTurboMode,
        willUseTurboConfig: isTurboMode,
        willUseNormalConfig: !isTurboMode,
        timestamp: new Date().toISOString()
    });

    const config = isTurboMode ? CascadingSlotConfig.turbo : CascadingSlotConfig.normal;
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Selected config", {
        configType: isTurboMode ? "turbo" : "normal",
        hasConfig: !!config,
        configKeys: Object.keys(config || {}),
        timestamp: new Date().toISOString()
    });

    const duration = config[key];
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Retrieved duration value", {
        key,
        duration,
        isValidNumber: typeof duration === "number" && !isNaN(duration),
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] getCustomDuration returning", {
        key,
        isTurboMode,
        duration,
        timestamp: new Date().toISOString()
    });

    return duration;
};

export const findIndex = (value: number, valueList: number[]) => {
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] findIndex called", {
        value,
        valueList,
        valueListLength: valueList?.length,
        willFindIndex: true,
        timestamp: new Date().toISOString()
    });

    const index = valueList.findIndex((item) => item === value);
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Index found", {
        value,
        index,
        found: index !== -1,
        foundValue: index !== -1 ? valueList[index] : undefined,
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] findIndex returning", {
        value,
        index,
        timestamp: new Date().toISOString()
    });

    return index;
};

export const calculateTotalBet = (level: number, coin: number, betMultiplier: number) => {
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] calculateTotalBet called", {
        level,
        coin,
        betMultiplier,
        willCalculate: true,
        formula: "level * coin * betMultiplier",
        timestamp: new Date().toISOString()
    });

    const totalBet = +(level * coin * betMultiplier);
    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] Total bet calculated", {
        level,
        coin,
        betMultiplier,
        calculation: `${level} * ${coin} * ${betMultiplier}`,
        totalBet,
        isValidNumber: !isNaN(totalBet),
        timestamp: new Date().toISOString()
    });

    cascadingSlotLogger.info("[CASCADING_SLOT_UTILS] calculateTotalBet returning", {
        totalBet,
        timestamp: new Date().toISOString()
    });

    return totalBet;
};

export enum DialogName {
    PREVIEW_ODDS = "preview-odds",
    IN_GAME_MENU = "in-game-menu",
    DUMMY_DIALOG = "dummy-dialog",
    AUTO_SPIN = "auto-spin",
    TURBO_MODE = "turbo-mode",
    FLASH_SPIN = "flash-spin",
    BET_CONTROL = "bet-control",
    HYPER_SPIN = "hyper-spin",
    TRIAL_MODE = "trial-mode",

    BUY_CONFIRMATION = "buy-fs-confirmation",
    BUY_FS_CONGRATULATION = "buy-fs-congratulation",
}
