export namespace GameServiceMessageCascading {
    export class CascadingSlotFinish {
        roundId: number;
        result: string;

        multiplier: number;
        totalMultiplier: number;

        actualBetwin: number;
        win: number;
        bigWin: boolean;
        totalFreeSpins: number;
        freeSpins: number;
        isFreeSpin: boolean;

        tumbles: Tumble[];
        m: number[];
        reachMaxWin: boolean;
        static eventName = "finish";
    }

    interface FreeSpinOddsDetail {
        count: number;
        odds: number;
    }

    interface FreeSpinOdds {
        initialOdds: Array<FreeSpinOddsDetail>;
        additionalOdds: Array<FreeSpinOddsDetail>;
    }

    export interface Odd {
        from: number;
        to: number;
        odds: number;
    }

    export interface OddsConfig {
        freeSpins: FreeSpinOdds;
        symbols: Record<string, Array<Odd>>;
    }

    export class CascadingSlotConfigsMsg {
        defaultCoinValue: number;
        betLevels: number[];
        betMultiplier: number;
        coinValues: number[];
        maxWinPerRound: number;
        odds: OddsConfig;
        totalMultiplier: number;
        bigWinRange: number[];

        static eventName = "gameConfigs";
    }

    export class CascadingTotalMultiplierMsg {
        totalMultiplier: number;
        static eventName = "totalMultiplier";
    }

    export class CascadingFreeSpinsMsg {
        total: number;
        betLevel: number;
        coinValue: number;
        betMultiplier: number;
        promotionId: string;
        xMode?: number;
        static eventName = "freeSpins";
    }

    export class CascadingTrialUserMsg {
        balance: number;
        rate: number;
        multiplier: number;
        static eventName = "trialUser";
    }

    export class GameInfoMsg {
        volatility: number;
        static eventName = "gameInfo";
    }

    export interface BetDetailData {
        id: number;
        time: string;
        betLevel: string;
        coinValue: number;
        totalAmount: number;
        betwin: number;
        freeSpin: boolean;
        buyFreeSpin: boolean;
        reachMaxWin: boolean;
        settlementResult: SettlementResultDetail;
        totalMultiplier: number;
        multiplier: number;
        buyFreeSpinRefRoundId: any;
        totalTumbleWin: number;
    }

    export interface TumbleDetail {
        explodedSymbols?: number[];
        newSymbols?: number[];
        icons: {
            [key: number]: {
                count: number;
                odds: number;
                win: number;
            };
        };
        win: number;
        multipliers: number[];
        newBoard: string;
        originalBoard: string;
    }
    export interface SettlementResultDetail {
        tumbles: TumbleDetail[];
        freeSpins: {
            count: number;
            odds: number;
            win: number;
        };
    }
}

export interface Settlement {
    explode: number[];
    new: number[];
}

export interface Tumble {
    icons: any;
    win: number;
    settlement: Settlement;
    result: string;
    multipliers: number[];
}
