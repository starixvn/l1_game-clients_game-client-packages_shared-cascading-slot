import { Node, tween, UIOpacity } from "cc";
import { CascadingSlotConfig } from "./cascading-slot-base-configs";
import { Tumble } from "./game-messages-cascading";

export enum SpecialSymbol {
    SCATTER_SYMBOL = 9,
    MULTIPLIER_SYMBOL = 10,
    FREESPIN = 11,
    BONUS = 12,
}

export const SlotNotification = {
    BEFORE_SPIN: "BEFORE_SPIN",
    SPINNING: "SPINNING",
    SETTLED: "SETTLED",
    TUMBLE_WIN: "TUMBLE_WIN",
    FREESPINS: "FREESPINS",
    AUTO_SPIN: "AUTO_SPIN",
};

export const convertBoardValue = (data: number[]): number[][] => {
    const result: number[][] = [];

    const column = 6;
    const row = 5;

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

export const prefabCache = {
    slotSymbols: {},
    multiplierPrefab: {},
};

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
    nodeOpacity.opacity = 0;
    tween(nodeOpacity).to(transitionTime, { opacity: 255 }).start();
};

export const hideNode = (node: Node, options: any) => {
    const duration = options.duration ?? 0.3;
    const onHidden = options.onHidden;
    tween(node.getComponent(UIOpacity))
        .to(duration, { opacity: 0 })
        .call(() => {
            onHidden && onHidden();
        })
        .start();
};

export const getCustomDuration = (key: string, isTurboMode: boolean): number => {
    const config = isTurboMode ? CascadingSlotConfig.turbo : CascadingSlotConfig.normal;
    return config[key];
};
