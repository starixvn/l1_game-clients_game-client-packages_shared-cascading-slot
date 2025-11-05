import inversify from "inversify";

import { cascadingSlotLogger } from "../cascading-slot-logger";
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

    constructor() {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] BetControlHandlers constructor called", {
            trialModeDefaultBetLevelIndex: this.TrialModeDefaultBetLevelIndex,
            betControlStoreInjected: !!this.betControlStore,
            cascadingUIStoreInjected: !!this.cascadingUIStore,
            configStoreInjected: !!this.configStore,
            timestamp: new Date().toISOString()
        });
    }

    closeBetControl() {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] closeBetControl called", {
            previousIsOpenBetAmountPopup: this.betControlStore.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.isOpenBetAmountPopup = false;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet control popup closed", {
            newIsOpenBetAmountPopup: this.betControlStore.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });
    }

    showBetControl() {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] showBetControl called", {
            previousIsOpenBetAmountPopup: this.betControlStore.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.isOpenBetAmountPopup = true;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet control popup opened", {
            newIsOpenBetAmountPopup: this.betControlStore.isOpenBetAmountPopup,
            timestamp: new Date().toISOString()
        });
    }

    changeBetLevel(increase: boolean) {
        const previousIndex = this.betControlStore.currentBetLevelIndex;
        const maxIndex = this.betControlStore.betLevels.length - 1;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] changeBetLevel called", {
            increase,
            previousIndex,
            maxIndex,
            currentBetLevel: this.betControlStore.betLevels[previousIndex],
            timestamp: new Date().toISOString()
        });

        if (increase) {
            if (this.betControlStore.currentBetLevelIndex < maxIndex) {
                this.betControlStore.currentBetLevelIndex++;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet level increased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentBetLevelIndex,
                    newBetLevel: this.betControlStore.betLevels[this.betControlStore.currentBetLevelIndex],
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet level increase blocked - at maximum", {
                    currentIndex: this.betControlStore.currentBetLevelIndex,
                    maxIndex,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            if (this.betControlStore.currentBetLevelIndex > 0) {
                this.betControlStore.currentBetLevelIndex--;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet level decreased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentBetLevelIndex,
                    newBetLevel: this.betControlStore.betLevels[this.betControlStore.currentBetLevelIndex],
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet level decrease blocked - at minimum", {
                    currentIndex: this.betControlStore.currentBetLevelIndex,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    changeCoinValue(increase: boolean) {
        const previousIndex = this.betControlStore.currentCoinIndex;
        const maxIndex = this.betControlStore.coinValues.length - 1;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] changeCoinValue called", {
            increase,
            previousIndex,
            maxIndex,
            currentCoinValue: this.betControlStore.coinValues[previousIndex],
            timestamp: new Date().toISOString()
        });

        if (increase) {
            if (this.betControlStore.currentCoinIndex < maxIndex) {
                this.betControlStore.currentCoinIndex++;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Coin value increased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentCoinIndex,
                    newCoinValue: this.betControlStore.coinValues[this.betControlStore.currentCoinIndex],
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Coin value increase blocked - at maximum", {
                    currentIndex: this.betControlStore.currentCoinIndex,
                    maxIndex,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            if (this.betControlStore.currentCoinIndex > 0) {
                this.betControlStore.currentCoinIndex--;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Coin value decreased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentCoinIndex,
                    newCoinValue: this.betControlStore.coinValues[this.betControlStore.currentCoinIndex],
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Coin value decrease blocked - at minimum", {
                    currentIndex: this.betControlStore.currentCoinIndex,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }

    changeTotalBet(increase: boolean) {
        const previousIndex = this.betControlStore.currentTotalBetIndex;
        const maxIndex = this.betControlStore.totalBetUnique.length - 1;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] changeTotalBet called", {
            increase,
            previousIndex,
            maxIndex,
            currentTotalBet: this.getCurrentTotalBet(),
            timestamp: new Date().toISOString()
        });

        if (increase) {
            if (this.betControlStore.currentTotalBetIndex < maxIndex) {
                this.betControlStore.currentTotalBetIndex++;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Total bet increased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentTotalBetIndex,
                    newTotalBet: this.getCurrentTotalBet(),
                    willSyncOthers: true,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Total bet increase blocked - at maximum", {
                    currentIndex: this.betControlStore.currentTotalBetIndex,
                    maxIndex,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            if (this.betControlStore.currentTotalBetIndex > 0) {
                this.betControlStore.currentTotalBetIndex--;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Total bet decreased", {
                    previousIndex,
                    newIndex: this.betControlStore.currentTotalBetIndex,
                    newTotalBet: this.getCurrentTotalBet(),
                    willSyncOthers: true,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Total bet decrease blocked - at minimum", {
                    currentIndex: this.betControlStore.currentTotalBetIndex,
                    timestamp: new Date().toISOString()
                });
            }
        }
        this.syncOthersByTotalBet();
    }

    syncOthersByTotalBet() {
        const currentIndex = this.betControlStore.currentTotalBetIndex;
        const item = this.betControlStore.totalBetUnique[currentIndex];

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] syncOthersByTotalBet called", {
            currentIndex,
            item,
            timestamp: new Date().toISOString()
        });

        const total = Object.keys(item)[0];
        const detail = item[total];

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Extracting total bet details", {
            total,
            detail,
            previousBetLevelIndex: this.betControlStore.currentBetLevelIndex,
            previousCoinIndex: this.betControlStore.currentCoinIndex,
            newBetLevelIndex: detail.indexLevel,
            newCoinIndex: detail.indexCoin,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.currentBetLevelIndex = detail.indexLevel;
        this.betControlStore.currentCoinIndex = detail.indexCoin;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Synced bet level and coin indices", {
            finalBetLevelIndex: this.betControlStore.currentBetLevelIndex,
            finalCoinIndex: this.betControlStore.currentCoinIndex,
            finalBetLevel: this.betControlStore.betLevels[this.betControlStore.currentBetLevelIndex],
            finalCoinValue: this.betControlStore.coinValues[this.betControlStore.currentCoinIndex],
            timestamp: new Date().toISOString()
        });
    }

    private getCurrentTotalBet(): number {
        if (!this.betControlStore.totalBetUnique || this.betControlStore.totalBetUnique.length === 0) {
            return 0;
        }
        const item = this.betControlStore.totalBetUnique[this.betControlStore.currentTotalBetIndex];
        if (!item) {
            return 0;
        }
        const totalKey = Object.keys(item)[0];
        return parseFloat(totalKey);
    }

    init(currentCoinValue?: number, betLevel?: number) {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] init called", {
            currentCoinValue,
            betLevel,
            hasGameConfigs: !!this.configStore.gameConfigs,
            timestamp: new Date().toISOString()
        });

        const { coinValues, betLevels, betMultiplier, defaultCoinValue } = this.configStore.gameConfigs;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Extracted game configuration", {
            coinValuesCount: coinValues?.length,
            betLevelsCount: betLevels?.length,
            betMultiplier,
            defaultCoinValue,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.defaultCoinValue = defaultCoinValue;
        this.betControlStore.betMultiplier = betMultiplier;
        this.betControlStore.betLevels = betLevels;
        this.betControlStore.coinValues = coinValues;

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Initialized basic store properties", {
            defaultCoinValue: this.betControlStore.defaultCoinValue,
            betMultiplier: this.betControlStore.betMultiplier,
            betLevelsCount: this.betControlStore.betLevels?.length,
            coinValuesCount: this.betControlStore.coinValues?.length,
            timestamp: new Date().toISOString()
        });

        this.prepareBetLevelData(betLevels, betLevel);
        this.prepareCoinData(coinValues, currentCoinValue);
        this.prepareTotalBetData();

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] init completed", {
            finalCurrentBetLevelIndex: this.betControlStore.currentBetLevelIndex,
            finalCurrentCoinIndex: this.betControlStore.currentCoinIndex,
            finalCurrentTotalBetIndex: this.betControlStore.currentTotalBetIndex,
            finalTotalBetUniqueCount: this.betControlStore.totalBetUnique?.length,
            timestamp: new Date().toISOString()
        });
    }

    private prepareBetLevelData(betLevels: number[], betLevel?: number) {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareBetLevelData called", {
            betLevels,
            betLevel,
            isTrialMode: this.cascadingUIStore.isTrialMode,
            trialModeDefaultBetLevelIndex: this.TrialModeDefaultBetLevelIndex,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.betLevels = [...betLevels];
        this.betControlStore.betLevels.sort((a, b) => a - b);

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Sorted bet levels", {
            originalBetLevels: betLevels,
            sortedBetLevels: this.betControlStore.betLevels,
            timestamp: new Date().toISOString()
        });

        if (this.cascadingUIStore.isTrialMode) {
            this.betControlStore.currentBetLevelIndex = this.TrialModeDefaultBetLevelIndex;
            cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Set trial mode default bet level index", {
                trialModeDefaultBetLevelIndex: this.TrialModeDefaultBetLevelIndex,
                selectedBetLevel: this.betControlStore.betLevels[this.TrialModeDefaultBetLevelIndex],
                timestamp: new Date().toISOString()
            });
        } else {
            const betLevelIndex = this.betControlStore.betLevels.findIndex((level) => level === betLevel);
            cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Searched for bet level index", {
                targetBetLevel: betLevel,
                foundIndex: betLevelIndex,
                foundBetLevel: betLevelIndex !== -1 ? this.betControlStore.betLevels[betLevelIndex] : null,
                timestamp: new Date().toISOString()
            });

            if (betLevelIndex !== -1) {
                this.betControlStore.currentBetLevelIndex = betLevelIndex;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Set bet level index from parameter", {
                    currentBetLevelIndex: this.betControlStore.currentBetLevelIndex,
                    selectedBetLevel: this.betControlStore.betLevels[betLevelIndex],
                    timestamp: new Date().toISOString()
                });
            } else {
                this.betControlStore.currentBetLevelIndex = 0;
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Bet level not found, defaulting to index 0", {
                    currentBetLevelIndex: this.betControlStore.currentBetLevelIndex,
                    defaultBetLevel: this.betControlStore.betLevels[0],
                    timestamp: new Date().toISOString()
                });
            }
        }

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareBetLevelData completed", {
            finalCurrentBetLevelIndex: this.betControlStore.currentBetLevelIndex,
            finalSelectedBetLevel: this.betControlStore.betLevels[this.betControlStore.currentBetLevelIndex],
            timestamp: new Date().toISOString()
        });
    }

    private prepareCoinData(coinValues, currentCoinValue?: number) {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareCoinData called", {
            coinValues,
            currentCoinValue,
            defaultCoinValue: this.betControlStore.defaultCoinValue,
            targetCoinValue: currentCoinValue ?? this.betControlStore.defaultCoinValue,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.coinValues = [...coinValues];
        this.betControlStore.coinValues.sort((a, b) => a - b);

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Sorted coin values", {
            originalCoinValues: coinValues,
            sortedCoinValues: this.betControlStore.coinValues,
            timestamp: new Date().toISOString()
        });

        const coinIndex = this.findCoinIndex(currentCoinValue ?? this.betControlStore.defaultCoinValue);
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Searched for coin index", {
            targetCoinValue: currentCoinValue ?? this.betControlStore.defaultCoinValue,
            foundIndex: coinIndex,
            foundCoinValue: coinIndex !== -1 ? this.betControlStore.coinValues[coinIndex] : null,
            timestamp: new Date().toISOString()
        });

        if (coinIndex !== -1) {
            this.betControlStore.currentCoinIndex = coinIndex;
            cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Set coin index from search result", {
                currentCoinIndex: this.betControlStore.currentCoinIndex,
                selectedCoinValue: this.betControlStore.coinValues[coinIndex],
                timestamp: new Date().toISOString()
            });
        } else {
            this.betControlStore.currentCoinIndex = 0;
            cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Coin value not found, defaulting to index 0", {
                currentCoinIndex: this.betControlStore.currentCoinIndex,
                defaultCoinValue: this.betControlStore.coinValues[0],
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareCoinData completed", {
            finalCurrentCoinIndex: this.betControlStore.currentCoinIndex,
            finalSelectedCoinValue: this.betControlStore.coinValues[this.betControlStore.currentCoinIndex],
            timestamp: new Date().toISOString()
        });
    }

    private prepareTotalBetData() {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareTotalBetData called", {
            coinValuesCount: this.betControlStore.coinValues?.length,
            betLevelsCount: this.betControlStore.betLevels?.length,
            betMultiplier: this.betControlStore.betMultiplier,
            timestamp: new Date().toISOString()
        });

        const uniqueIds = [];
        const totalBetIncrease = [];
        this.betControlStore.totalBetUnique = [];

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Generating total bet combinations", {
            expectedCombinations: (this.betControlStore.coinValues?.length || 0) * (this.betControlStore.betLevels?.length || 0),
            timestamp: new Date().toISOString()
        });

        this.betControlStore.coinValues.forEach((coin, indexCoin) => {
            this.betControlStore.betLevels.forEach((level, indexLevel) => {
                const totalBet = calculateTotalBet(level, coin, this.betControlStore.betMultiplier);
                const betEntry = {
                    [totalBet]: {
                        coin: coin,
                        level: level,
                        indexCoin: indexCoin,
                        indexLevel: indexLevel,
                    },
                };

                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Generated total bet combination", {
                    coin,
                    level,
                    totalBet,
                    indexCoin,
                    indexLevel,
                    timestamp: new Date().toISOString()
                });

                totalBetIncrease.push(betEntry);
            });
        });

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Generated all total bet combinations", {
            totalCombinations: totalBetIncrease.length,
            timestamp: new Date().toISOString()
        });

        totalBetIncrease.sort((a, b) => +Object.keys(a)[0] - +Object.keys(b)[0]);

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Sorted total bet combinations", {
            firstTotalBet: Object.keys(totalBetIncrease[0] || {})[0],
            lastTotalBet: Object.keys(totalBetIncrease[totalBetIncrease.length - 1] || {})[0],
            timestamp: new Date().toISOString()
        });

        totalBetIncrease.forEach((element, index) => {
            const totalBetKey = Object.keys(element)[0];
            const isDuplicate = uniqueIds.includes(totalBetKey);

            cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Processing total bet entry", {
                index,
                totalBetKey,
                isDuplicate,
                uniqueIdsCount: uniqueIds.length,
                timestamp: new Date().toISOString()
            });

            if (!isDuplicate) {
                uniqueIds.push(totalBetKey);
                this.betControlStore.totalBetUnique.push(element);

                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Added unique total bet entry", {
                    totalBetKey,
                    totalUniqueCount: this.betControlStore.totalBetUnique.length,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] Skipped duplicate total bet entry", {
                    totalBetKey,
                    timestamp: new Date().toISOString()
                });
            }
        });

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] prepareTotalBetData completed", {
            finalTotalBetUniqueCount: this.betControlStore.totalBetUnique.length,
            uniqueIdsCount: uniqueIds.length,
            timestamp: new Date().toISOString()
        });
    }

    private findCoinIndex(coin: number) {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] findCoinIndex called", {
            coin,
            coinValuesCount: this.betControlStore.coinValues?.length,
            coinValues: this.betControlStore.coinValues,
            timestamp: new Date().toISOString()
        });

        const index = this.betControlStore.coinValues.findIndex((value) => value === coin);

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] findCoinIndex result", {
            coin,
            foundIndex: index,
            foundValue: index !== -1 ? this.betControlStore.coinValues[index] : null,
            timestamp: new Date().toISOString()
        });

        return index;
    }

    setTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] setTotalBet called", {
            totalBet,
            previousResumeLastBet: this.betControlStore.resumeLastBet,
            previousTotalBet: this.betControlStore.totalBet,
            previousCurrentTotalBetIndex: this.betControlStore.currentTotalBetIndex,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.resumeLastBet = true;
        this.betControlStore.totalBet = totalBet;
        this.betControlStore.syncCurrentTotalBetIndex(totalBet);

        cascadingSlotLogger.info("[BET_CONTROL_HANDLERS] setTotalBet completed", {
            newResumeLastBet: this.betControlStore.resumeLastBet,
            newTotalBet: this.betControlStore.totalBet,
            syncedCurrentTotalBetIndex: this.betControlStore.currentTotalBetIndex,
            timestamp: new Date().toISOString()
        });
    }
}
