import { Tumble } from "./game-messages-cascading";

export const SCATTER_SYMBOL = 9;
export const MULTIPLIER_SYMBOL = 10;

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
    isTurbo: boolean;
    tumbles: Tumble[];
}

export interface WinIconDetail {
    count: number;
    win: number;
}
