import { FSBPromotionStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { Container } from "inversify";
import mobx from "mobx";
import "reflect-metadata";
import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";
import { BetControlStore } from "../../assets/stores/bet-control-store";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";

// Mock the calculateTotalBet function
jest.mock("../../assets/cascading-slot-utils", () => ({
    calculateTotalBet: jest.fn((level: number, coin: number, betMultiplier: number) => {
        return +(level * coin * betMultiplier).toFixed(1);
    }),
}));

describe("BetControlStore", () => {
    let container: Container;
    let betControlStore: BetControlStore;
    let autoPlayStore: AutoPlayStore;
    let cascadingUIStore: any; // Mock object
    let fsbPromotionUIStore: any; // Mock object
    let fsbPromotionStore: any; // Mock object

    beforeEach(() => {
        container = new Container();

        // Create mock cascadingUIStore
        cascadingUIStore = {
            freeSpinsTotal: 0,
            cascadingState: CascadingSlotState.READY_BET,
            get isFreeSpins() {
                return this.freeSpinsTotal > 0;
            },
        };

        // Create mock FSB promotion stores
        fsbPromotionUIStore = {
            isFSBPromotionInProgress: false,
        };

        fsbPromotionStore = {
            promotion: {
                coinValue: 0.1,
                betLevel: 1,
            },
        };

        // Bind dependencies
        container.bind(AutoPlayStore).toSelf();
        container.bind(CascadingUIStore).toConstantValue(cascadingUIStore);
        container.bind(FSBPromotionUIStore).toConstantValue(fsbPromotionUIStore);
        container.bind(FSBPromotionStore).toConstantValue(fsbPromotionStore);
        container.bind(BetControlStore).toSelf();

        // Get instances
        autoPlayStore = container.get(AutoPlayStore);
        betControlStore = container.get(BetControlStore);

        // Initialize test data
        betControlStore.betLevels = [1, 2, 3, 4, 5];
        betControlStore.coinValues = [0.1, 0.2, 0.5, 1.0, 2.0];
        betControlStore.betMultiplier = 10;
        betControlStore.defaultCoinValue = 0.1;
        betControlStore.totalBetUnique = [
            { "1": { betLevel: 1, coinValue: 0.1 } },
            { "2": { betLevel: 2, coinValue: 0.1 } },
            { "5": { betLevel: 1, coinValue: 0.5 } },
            { "10": { betLevel: 1, coinValue: 1.0 } },
            { "20": { betLevel: 2, coinValue: 1.0 } },
        ];
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            const freshStore = new BetControlStore();

            expect(freshStore.isOpenBetAmountPopup).toBe(false);
            expect(freshStore.totalBetUnique).toEqual([]);
            expect(freshStore.betLevels).toEqual([]);
            expect(freshStore.coinValues).toEqual([]);
            expect(freshStore.betMultiplier).toBe(0);
            expect(freshStore.defaultCoinValue).toBe(0);
            expect(freshStore._totalBet).toBe(0);
            expect(freshStore.resumeLastBet).toBe(false);
            expect(freshStore.needClearLastSetting).toBe(false);
            expect(freshStore._lastSetting).toBeNull();
            expect(freshStore.currentBetLevelIndex).toBe(0);
            expect(freshStore.currentCoinIndex).toBe(0);
            expect(freshStore.currentTotalBetIndex).toBe(0);
        });
    });

    describe("lastSetting", () => {
        it("should get lastSetting correctly", () => {
            const setting = { betLevel: 2, coinValue: 0.5 };
            betControlStore._lastSetting = setting;

            expect(betControlStore.lastSetting).toStrictEqual(setting);
        });

        it("should set lastSetting correctly", () => {
            const setting = { betLevel: 3, coinValue: 1.0 };

            betControlStore.lastSetting = setting;

            expect(betControlStore._lastSetting).toStrictEqual(setting);
        });
    });

    describe("betLevel getter", () => {
        it("should return correct bet level based on currentBetLevelIndex", () => {
            betControlStore.currentBetLevelIndex = 2;

            expect(betControlStore.betLevel).toBe(3);
        });

        it("should return 0 when betLevels is empty", () => {
            betControlStore.betLevels = [];
            betControlStore.currentBetLevelIndex = 0;

            expect(betControlStore.betLevel).toBe(0);
        });

        it("should return 0 when currentBetLevelIndex is out of bounds", () => {
            betControlStore.currentBetLevelIndex = 10;

            expect(betControlStore.betLevel).toBe(0);
        });
    });

    describe("coinValue getter", () => {
        it("should return correct coin value based on currentCoinIndex", () => {
            betControlStore.currentCoinIndex = 3;

            expect(betControlStore.coinValue).toBe(1.0);
        });

        it("should return 0 when coinValues is empty", () => {
            betControlStore.coinValues = [];
            betControlStore.currentCoinIndex = 0;

            expect(betControlStore.coinValue).toBe(0);
        });

        it("should return 0 when currentCoinIndex is out of bounds", () => {
            betControlStore.currentCoinIndex = 10;

            expect(betControlStore.coinValue).toBe(0);
        });
    });

    describe("totalBet", () => {
        it("should return _totalBet when resumeLastBet is true", () => {
            betControlStore._totalBet = 50;
            betControlStore.resumeLastBet = true;

            expect(betControlStore.totalBet).toBe(50);
        });

        it("should return 0 when totalBetUnique is empty", () => {
            betControlStore.totalBetUnique = [];
            betControlStore.resumeLastBet = false;

            expect(betControlStore.totalBet).toBe(0);
        });

        it("should return 0 when currentTotalBetIndex is -1", () => {
            betControlStore.currentTotalBetIndex = -1;
            betControlStore.resumeLastBet = false;

            expect(betControlStore.totalBet).toBe(0);
        });

        it("should return 0 when currentTotalBetIndex is out of bounds", () => {
            betControlStore.currentTotalBetIndex = 10;
            betControlStore.resumeLastBet = false;

            expect(betControlStore.totalBet).toBe(0);
        });

        it("should return correct total bet based on currentTotalBetIndex", () => {
            betControlStore.currentTotalBetIndex = 2;
            betControlStore.resumeLastBet = false;

            expect(betControlStore.totalBet).toBe(5);
        });

        it("should set _totalBet correctly", () => {
            betControlStore.totalBet = 25;

            expect(betControlStore._totalBet).toBe(25);
        });
    });

    describe("disabledChangeBet getter", () => {
        it("should return true when isFreeSpins is true", () => {
            cascadingUIStore.freeSpinsTotal = 10; // This makes isFreeSpins return true

            expect(betControlStore.disabledChangeBet).toBe(true);
        });

        it("should return true when disabledOpenInputBet is true", () => {
            cascadingUIStore.disabledOpenInputBet = true; // This makes isFreeSpins return true

            expect(betControlStore.disabledChangeBet).toBe(true);
        });

        it("should return false when isFreeSpins is false, disabledOpenInputBet is false", () => {
            cascadingUIStore.freeSpinsTotal = 0; // This makes isFreeSpins return false
            cascadingUIStore.disabledOpenInputBet = false; // This makes disabledOpenInputBet return false

            expect(betControlStore.disabledChangeBet).toBe(false);
        });
    });

    describe("interactableBetLevel getter", () => {
        beforeEach(() => {
            cascadingUIStore.freeSpinsTotal = 0;
        });

        it("should return disabled state when bet changes are disabled", () => {
            cascadingUIStore.freeSpinsTotal = 10; // This makes isFreeSpins return true

            const result = betControlStore.interactableBetLevel;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at minimum bet level", () => {
            betControlStore.currentBetLevelIndex = 0;

            const result = betControlStore.interactableBetLevel;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at maximum bet level", () => {
            betControlStore.currentBetLevelIndex = 4; // last index

            const result = betControlStore.interactableBetLevel;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(true);
        });

        it("should return correct state when at middle bet level", () => {
            betControlStore.currentBetLevelIndex = 2;

            const result = betControlStore.interactableBetLevel;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(true);
        });
    });

    describe("interactableCoinValue getter", () => {
        beforeEach(() => {
            cascadingUIStore.freeSpinsTotal = 0;
        });

        it("should return disabled state when bet changes are disabled", () => {
            cascadingUIStore.freeSpinsTotal = 10; // This makes isFreeSpins return true

            const result = betControlStore.interactableCoinValue;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at minimum coin value", () => {
            betControlStore.currentCoinIndex = 0;

            const result = betControlStore.interactableCoinValue;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at maximum coin value", () => {
            betControlStore.currentCoinIndex = 4; // last index

            const result = betControlStore.interactableCoinValue;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(true);
        });

        it("should return correct state when at middle coin value", () => {
            betControlStore.currentCoinIndex = 2;

            const result = betControlStore.interactableCoinValue;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(true);
        });
    });

    describe("interactableTotalBet getter", () => {
        beforeEach(() => {
            cascadingUIStore.freeSpinsTotal = 0;
        });

        it("should return disabled state when bet changes are disabled", () => {
            cascadingUIStore.freeSpinsTotal = 10; // This makes isFreeSpins return true

            const result = betControlStore.interactableTotalBet;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at minimum total bet", () => {
            betControlStore.currentTotalBetIndex = 0;

            const result = betControlStore.interactableTotalBet;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(false);
        });

        it("should return correct state when at maximum total bet", () => {
            betControlStore.currentTotalBetIndex = 4; // last index

            const result = betControlStore.interactableTotalBet;

            expect(result.increase).toBe(false);
            expect(result.decrease).toBe(true);
        });

        it("should return correct state when at middle total bet", () => {
            betControlStore.currentTotalBetIndex = 2;

            const result = betControlStore.interactableTotalBet;

            expect(result.increase).toBe(true);
            expect(result.decrease).toBe(true);
        });
    });

    describe("syncCurrentTotalBetIndex", () => {
        it("should find and set correct index for existing total bet", () => {
            betControlStore.syncCurrentTotalBetIndex(5);

            expect(betControlStore.currentTotalBetIndex).toBe(2);
        });

        it("should set index to -1 for non-existing total bet", () => {
            betControlStore.syncCurrentTotalBetIndex(999);

            expect(betControlStore.currentTotalBetIndex).toBe(0);
        });

        it("should handle edge case with first total bet", () => {
            betControlStore.syncCurrentTotalBetIndex(1);

            expect(betControlStore.currentTotalBetIndex).toBe(0);
        });

        it("should handle edge case with last total bet", () => {
            betControlStore.syncCurrentTotalBetIndex(20);

            expect(betControlStore.currentTotalBetIndex).toBe(4);
        });
    });

    describe("onChangeCoinAndBetLevel", () => {
        it("should calculate total bet and sync current total bet index", () => {
            const { calculateTotalBet } = require("../../assets/cascading-slot-utils");
            jest.spyOn(betControlStore, "syncCurrentTotalBetIndex");

            betControlStore.currentBetLevelIndex = 1; // betLevel = 2
            betControlStore.currentCoinIndex = 2; // coinValue = 0.5

            betControlStore.onChangeCoinAndBetLevel();

            expect(calculateTotalBet).toHaveBeenCalledWith(2, 0.5, 10);
            expect(betControlStore.syncCurrentTotalBetIndex).toHaveBeenCalledWith(10);
        });
    });

    describe("isCollapseMenuInGame getter", () => {
        it("should return true when cascading state is SPINNING", () => {
            cascadingUIStore.cascadingState = CascadingSlotState.SPINNING;
            autoPlayStore.isOpenAutoplayPopup = false;
            betControlStore.isOpenBetAmountPopup = false;

            expect(betControlStore.isCollapseMenuInGame).toBe(true);
        });

        it("should return true when autoplay popup is open", () => {
            cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
            autoPlayStore.isOpenAutoplayPopup = true;
            betControlStore.isOpenBetAmountPopup = false;

            expect(betControlStore.isCollapseMenuInGame).toBe(true);
        });

        it("should return true when bet amount popup is open", () => {
            cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
            autoPlayStore.isOpenAutoplayPopup = false;
            betControlStore.isOpenBetAmountPopup = true;

            expect(betControlStore.isCollapseMenuInGame).toBe(true);
        });

        it("should return false when all conditions are false", () => {
            cascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
            autoPlayStore.isOpenAutoplayPopup = false;
            betControlStore.isOpenBetAmountPopup = false;

            expect(betControlStore.isCollapseMenuInGame).toBe(false);
        });

        it("should return true when multiple conditions are true", () => {
            cascadingUIStore.cascadingState = CascadingSlotState.SPINNING;
            autoPlayStore.isOpenAutoplayPopup = true;
            betControlStore.isOpenBetAmountPopup = true;

            expect(betControlStore.isCollapseMenuInGame).toBe(true);
        });
    });

    describe("effectiveCoinValue getter", () => {
        it("should return promotion coin value when FSB promotion is in progress", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion.coinValue = 0.5;

            expect(betControlStore.effectiveCoinValue).toBe(0.5);
        });

        it("should return regular coin value when FSB promotion is not in progress", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = false;
            betControlStore.currentCoinIndex = 2; // coinValue = 0.5

            expect(betControlStore.effectiveCoinValue).toBe(0.5);
        });

        it("should handle undefined promotion gracefully", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = undefined;

            expect(betControlStore.effectiveCoinValue).toBeUndefined();
        });

        it("should handle null promotion gracefully", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = null;

            expect(betControlStore.effectiveCoinValue).toBeUndefined();
        });
    });

    describe("effectiveBetLevel getter", () => {
        it("should return promotion bet level when FSB promotion is in progress", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion.betLevel = 3;

            expect(betControlStore.effectiveBetLevel).toBe(3);
        });

        it("should return regular bet level when FSB promotion is not in progress", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = false;
            betControlStore.currentBetLevelIndex = 2; // betLevel = 3

            expect(betControlStore.effectiveBetLevel).toBe(3);
        });

        it("should handle undefined promotion gracefully", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = undefined;

            expect(betControlStore.effectiveBetLevel).toBeUndefined();
        });

        it("should handle null promotion gracefully", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = null;

            expect(betControlStore.effectiveBetLevel).toBeUndefined();
        });
    });

    describe("effectiveTotalBet getter", () => {
        it("should return calculated total bet when FSB promotion is in progress", () => {
            const { calculateTotalBet } = require("../../assets/cascading-slot-utils");
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: 0.2,
                betLevel: 2,
            };

            const result = betControlStore.effectiveTotalBet;

            expect(calculateTotalBet).toHaveBeenCalledWith(2, 0.2, 10);
            expect(result).toBe(4); // 2 * 0.2 * 10 = 4
        });

        it("should return regular total bet when FSB promotion is not in progress", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = false;
            betControlStore.currentTotalBetIndex = 2; // totalBet = 5

            expect(betControlStore.effectiveTotalBet).toBe(5);
        });

        it("should handle undefined promotion gracefully", () => {
            const { calculateTotalBet } = require("../../assets/cascading-slot-utils");
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = undefined;

            const result = betControlStore.effectiveTotalBet;

            expect(calculateTotalBet).toHaveBeenCalledWith(undefined, undefined, 10);
            expect(result).toBeNaN();
        });

        it("should handle null promotion gracefully", () => {
            const { calculateTotalBet } = require("../../assets/cascading-slot-utils");
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = null;

            const result = betControlStore.effectiveTotalBet;

            expect(calculateTotalBet).toHaveBeenCalledWith(undefined, undefined, 10);
            expect(result).toBeNaN();
        });

        it("should handle missing promotion properties gracefully", () => {
            const { calculateTotalBet } = require("../../assets/cascading-slot-utils");
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: 0.2,
                // betLevel is missing
            };

            const result = betControlStore.effectiveTotalBet;

            expect(calculateTotalBet).toHaveBeenCalledWith(undefined, 0.2, 10);
            expect(result).toBeNaN();
        });
    });

    describe("FSB Promotion integration", () => {
        it("should use promotion values when FSB promotion is active", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: 0.3,
                betLevel: 4,
            };

            expect(betControlStore.effectiveCoinValue).toBe(0.3);
            expect(betControlStore.effectiveBetLevel).toBe(4);
            expect(betControlStore.effectiveTotalBet).toBe(12); // 4 * 0.3 * 10
        });

        it("should fallback to regular values when FSB promotion ends", () => {
            // Start with promotion active
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: 0.3,
                betLevel: 4,
            };

            expect(betControlStore.effectiveCoinValue).toBe(0.3);
            expect(betControlStore.effectiveBetLevel).toBe(4);

            // End promotion
            fsbPromotionUIStore.isFSBPromotionInProgress = false;
            betControlStore.currentCoinIndex = 1; // coinValue = 0.2
            betControlStore.currentBetLevelIndex = 1; // betLevel = 2

            expect(betControlStore.effectiveCoinValue).toBe(0.2);
            expect(betControlStore.effectiveBetLevel).toBe(2);
        });
    });

    describe("Computed recomputation (no reaction)", () => {
        it("recomputes effectiveCoinValue when switching to FSB and changing promo coin", () => {
            // initial (normal mode)
            expect(betControlStore.effectiveCoinValue).toBe(0.1);

            // switch to FSB + change promo coin
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion.coinValue = 0.5;
            });

            // read getter again → should reflect new promo value
            expect(betControlStore.effectiveCoinValue).toBe(0.5);
        });

        it("recomputes effectiveBetLevel when switching to FSB and changing promo betLevel", () => {
            // initial
            expect(betControlStore.effectiveBetLevel).toBe(1);

            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion.betLevel = 3;
            });

            expect(betControlStore.effectiveBetLevel).toBe(3);
        });

        it("falls back to normal values when FSB turns off", () => {
            // turn on FSB with custom promo
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.3, betLevel: 4 } as any;
            });
            expect(betControlStore.effectiveCoinValue).toBe(0.3);
            expect(betControlStore.effectiveBetLevel).toBe(4);

            // turn off FSB → use current indices
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = false;
                betControlStore.currentCoinIndex = 2; // coinValue = 0.5
                betControlStore.currentBetLevelIndex = 2; // betLevel = 3
            });

            expect(betControlStore.effectiveCoinValue).toBe(0.5);
            expect(betControlStore.effectiveBetLevel).toBe(3);
        });

        it("recomputes effectiveTotalBet with promo values", () => {
            mobx.runInAction(() => {
                betControlStore.betMultiplier = 10;
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.2, betLevel: 2 } as any;
            });

            // 2 * 0.2 * 10 = 4
            expect(betControlStore.effectiveTotalBet).toBe(4);
        });

        it("recomputes effectiveTotalBet with normal values", () => {
            // set normal indices: coin=0.2 (idx 1), bet=2 (idx 1), and totalBetUnique sync
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = false;
                betControlStore.betMultiplier = 10;
                betControlStore.currentCoinIndex = 1; // 0.2
                betControlStore.currentBetLevelIndex = 1; // 2
                betControlStore.totalBetUnique = [
                    { "1": { betLevel: 1, coinValue: 0.1 } },
                    { "2": { betLevel: 2, coinValue: 0.1 } },
                    { "4": { betLevel: 2, coinValue: 0.2 } }, // expect to pick this
                ];
                betControlStore.syncCurrentTotalBetIndex(4);
            });

            expect(betControlStore.effectiveTotalBet).toBe(4);
        });

        it("handles promo changes (coin & betLevel) and reflects in effectiveTotalBet", () => {
            mobx.runInAction(() => {
                betControlStore.betMultiplier = 5;
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.3, betLevel: 3 } as any;
            });
            // 3 * 0.3 * 5 = 4.5
            expect(betControlStore.effectiveTotalBet).toBeCloseTo(4.5, 5);

            mobx.runInAction(() => {
                fsbPromotionStore.promotion.coinValue = 0.1 as any;
                fsbPromotionStore.promotion.betLevel = 1 as any;
            });
            // 1 * 0.1 * 5 = 0.5
            expect(betControlStore.effectiveTotalBet).toBeCloseTo(0.5, 5);
        });
    });

    describe("Complex integration scenarios", () => {
        it("should handle rapid state changes between promotion and normal mode", () => {
            // Start in normal mode
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = false;
                betControlStore.currentCoinIndex = 1;
                betControlStore.currentBetLevelIndex = 1;
            });

            expect(betControlStore.effectiveCoinValue).toBe(0.2);
            expect(betControlStore.effectiveBetLevel).toBe(2);

            // Switch to promotion mode
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.5, betLevel: 3 } as any;
            });

            expect(betControlStore.effectiveCoinValue).toBe(0.5);
            expect(betControlStore.effectiveBetLevel).toBe(3);

            // Switch back to normal mode
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = false;
            });

            expect(betControlStore.effectiveCoinValue).toBe(0.2);
            expect(betControlStore.effectiveBetLevel).toBe(2);
        });

        it("should maintain consistency when promotion data changes", () => {
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.1, betLevel: 1 } as any;
                betControlStore.betMultiplier = 10;
            });

            expect(betControlStore.effectiveTotalBet).toBe(1); // 1 * 0.1 * 10

            // Change promotion data
            mobx.runInAction(() => {
                fsbPromotionStore.promotion.coinValue = 0.2 as any;
                fsbPromotionStore.promotion.betLevel = 2 as any;
            });

            expect(betControlStore.effectiveTotalBet).toBe(4); // 2 * 0.2 * 10
        });

        it("should handle concurrent changes to multiple properties", () => {
            // Make multiple changes at once (no reaction/spy)
            mobx.runInAction(() => {
                fsbPromotionUIStore.isFSBPromotionInProgress = true;
                fsbPromotionStore.promotion = { coinValue: 0.3, betLevel: 3 } as any;
                betControlStore.betMultiplier = 5;
            });

            // Directly assert computed values
            expect(betControlStore.effectiveCoinValue).toBe(0.3);
            expect(betControlStore.effectiveBetLevel).toBe(3);
            expect(betControlStore.effectiveTotalBet).toBeCloseTo(4.5, 5); // 3 * 0.3 * 5
        });
    });

    describe("Data validation and type safety", () => {
        it("should handle non-numeric values gracefully", () => {
            // Test with string values
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: "0.5" as any,
                betLevel: "2" as any,
            };

            // Should still work due to JavaScript type coercion
            expect(betControlStore.effectiveCoinValue).toBe("0.5");
            expect(betControlStore.effectiveBetLevel).toBe("2");
        });

        it("should handle NaN and Infinity values", () => {
            fsbPromotionUIStore.isFSBPromotionInProgress = true;
            fsbPromotionStore.promotion = {
                coinValue: NaN,
                betLevel: Infinity,
            };

            expect(betControlStore.effectiveCoinValue).toBeNaN();
            expect(betControlStore.effectiveBetLevel).toBe(Infinity);
        });
    });
});
