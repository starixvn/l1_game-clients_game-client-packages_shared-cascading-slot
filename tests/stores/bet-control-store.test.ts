import { Container } from "inversify";
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

        // Bind dependencies
        container.bind(AutoPlayStore).toSelf();
        container.bind(CascadingUIStore).toConstantValue(cascadingUIStore);
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

        it("should return false when isFreeSpins is false", () => {
            cascadingUIStore.freeSpinsTotal = 0; // This makes isFreeSpins return false

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

            expect(betControlStore.currentTotalBetIndex).toBe(-1);
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
});
