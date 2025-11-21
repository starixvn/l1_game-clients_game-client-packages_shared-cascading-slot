import inversify from "inversify";

import { calculateTotalBet } from "../cascading-slot-utils";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { injectable, inject } = inversify;

@injectable()
export class BetControlHandlers {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;

    private readonly TrialModeDefaultBetLevelIndex = 4;

    closeBetControl() {
        this.betControlStore.isOpenBetAmountPopup = false;
    }

    showBetControl() {
        this.betControlStore.isOpenBetAmountPopup = true;
    }

    changeBetLevel(increase: boolean) {
        if (increase) {
            if (this.betControlStore.currentBetLevelIndex < this.betControlStore.betLevels.length - 1) {
                this.betControlStore.currentBetLevelIndex++;
            }
        } else {
            if (this.betControlStore.currentBetLevelIndex > 0) {
                this.betControlStore.currentBetLevelIndex--;
            }
        }
    }

    changeCoinValue(increase: boolean) {
        if (increase) {
            if (this.betControlStore.currentCoinIndex < this.betControlStore.coinValues.length - 1) {
                this.betControlStore.currentCoinIndex++;
            }
        } else {
            if (this.betControlStore.currentCoinIndex > 0) {
                this.betControlStore.currentCoinIndex--;
            }
        }
    }

    changeTotalBet(increase: boolean) {
        if (increase) {
            if (this.betControlStore.currentTotalBetIndex < this.betControlStore.totalBetUnique.length - 1) {
                this.betControlStore.currentTotalBetIndex++;
            }
        } else {
            if (this.betControlStore.currentTotalBetIndex > 0) {
                this.betControlStore.currentTotalBetIndex--;
            }
        }
        this.syncOthersByTotalBet();
    }

    syncOthersByTotalBet() {
        const item = this.betControlStore.totalBetUnique[this.betControlStore.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        const detail = item[total];
        this.betControlStore.currentBetLevelIndex = detail.indexLevel;
        this.betControlStore.currentCoinIndex = detail.indexCoin;
    }

    init(currentCoinValue?: number, betLevel?: number) {
        const { coinValues, betLevels, betMultiplier, defaultCoinValue } = this.configStore.gameConfigs;

        this.betControlStore.defaultCoinValue = defaultCoinValue;
        this.betControlStore.betMultiplier = betMultiplier;
        this.betControlStore.betLevels = betLevels;
        this.betControlStore.coinValues = coinValues;

        this.prepareBetLevelData(betLevels, betLevel);
        this.prepareCoinData(coinValues, currentCoinValue);
        this.prepareTotalBetData();
    }

    private prepareBetLevelData(betLevels: number[], betLevel?: number) {
        this.betControlStore.betLevels = [...betLevels];
        this.betControlStore.betLevels.sort((a, b) => a - b);

        if (this.cascadingUIStore.isTrialMode) {
            this.betControlStore.currentBetLevelIndex = this.TrialModeDefaultBetLevelIndex;
        } else {
            const betLevelIndex = this.betControlStore.betLevels.findIndex((level) => level === betLevel);
            if (betLevelIndex !== -1) {
                this.betControlStore.currentBetLevelIndex = betLevelIndex;
            } else {
                this.betControlStore.currentBetLevelIndex = 0;
            }
        }
    }

    private prepareCoinData(coinValues, currentCoinValue?: number) {
        this.betControlStore.coinValues = [...coinValues];
        this.betControlStore.coinValues.sort((a, b) => a - b);
        const coinIndex = this.findCoinIndex(currentCoinValue ?? this.betControlStore.defaultCoinValue);
        if (coinIndex !== -1) {
            this.betControlStore.currentCoinIndex = coinIndex;
        } else {
            this.betControlStore.currentCoinIndex = 0;
        }
    }

    private prepareTotalBetData() {
        const uniqueIds = [];
        const totalBetIncrease = [];
        this.betControlStore.totalBetUnique = [];

        this.betControlStore.coinValues.forEach((coin, indexCoin) => {
            this.betControlStore.betLevels.forEach((level, indexLevel) => {
                totalBetIncrease.push({
                    [calculateTotalBet(level, coin, this.betControlStore.betMultiplier)]: {
                        coin: coin,
                        level: level,
                        indexCoin: indexCoin,
                        indexLevel: indexLevel,
                    },
                });
            });
        });

        totalBetIncrease.sort((a, b) => +Object.keys(a)[0] - +Object.keys(b)[0]);
        totalBetIncrease.forEach((element) => {
            const isDuplicate = uniqueIds.includes(Object.keys(element)[0]);
            if (!isDuplicate) {
                uniqueIds.push(Object.keys(element)[0]);
                this.betControlStore.totalBetUnique.push(element);
            }
        });
    }

    private findCoinIndex(coin: number) {
        return this.betControlStore.coinValues.findIndex((value) => value === coin);
    }

    setTotalBet(totalBet: number) {
        this.betControlStore.resumeLastBet = true;
        this.betControlStore.totalBet = totalBet;
        this.betControlStore.syncCurrentTotalBetIndex(totalBet);
    }
}
