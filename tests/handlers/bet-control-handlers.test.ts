import { BetControlHandlers } from "../../assets/handlers/bet-control-handlers";
import { BetControlStore } from "../../assets/stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../../assets/stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";

// Mock the dependencies
jest.mock("../../assets/stores/bet-control-store");
jest.mock("../../assets/stores/cascading-slot-configs-store");
jest.mock("../../assets/stores/cascading-ui-store");

// Mock the utility function
jest.mock("../../assets/cascading-slot-utils", () => ({
    calculateTotalBet: jest.fn((level, coin, multiplier) => level * coin * multiplier),
}));

describe("BetControlHandlers", () => {
    let handler: BetControlHandlers;
    let mockBetControlStore: jest.Mocked<BetControlStore>;
    let mockCascadingUIStore: jest.Mocked<CascadingUIStore>;
    let mockConfigStore: jest.Mocked<CascadingSlotConfigsStore>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockBetControlStore = {
            isOpenBetAmountPopup: false,
            currentBetLevelIndex: 0,
            currentCoinIndex: 0,
            currentTotalBetIndex: 0,
            betLevels: [1, 2, 3, 4, 5],
            coinValues: [0.01, 0.02, 0.05, 0.1, 0.2],
            totalBetUnique: [],
            defaultCoinValue: 0.01,
            betMultiplier: 10,
            totalBet: 0.1,
            resumeLastBet: false,
            syncCurrentTotalBetIndex: jest.fn(),
        } as any;

        mockCascadingUIStore = {
            isTrialMode: false,
            fsbPromotionInProgress: false,
        } as any;

        mockConfigStore = {
            gameConfigs: {
                coinValues: [0.01, 0.02, 0.05, 0.1, 0.2],
                betLevels: [1, 2, 3, 4, 5],
                betMultiplier: 10,
                defaultCoinValue: 0.01,
                bigWinRange: [0, 0, 0],
            },
        } as any;

        // Create handler instance
        handler = new BetControlHandlers();

        // Manually inject the mocked dependencies
        (handler as any).betControlStore = mockBetControlStore;
        (handler as any).cascadingUIStore = mockCascadingUIStore;
        (handler as any).configStore = mockConfigStore;
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(BetControlHandlers);
        });
    });

    describe("updateStatusBetAmountPopup method", () => {
        it("should close bet amount popup", () => {
            mockBetControlStore.isOpenBetAmountPopup = true;

            handler.closeBetControl();

            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(false);
        });
    });

    describe("changeBetLevel method", () => {
        beforeEach(() => {
            mockBetControlStore.betLevels = [1, 2, 3, 4, 5];
            mockBetControlStore.currentBetLevelIndex = 2;
        });

        it("should increase bet level index when possible", () => {
            handler.changeBetLevel(true);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(3);
        });

        it("should decrease bet level index when possible", () => {
            handler.changeBetLevel(false);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(1);
        });

        it("should not increase bet level index beyond maximum", () => {
            mockBetControlStore.currentBetLevelIndex = 4; // Last index
            handler.changeBetLevel(true);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(4);
        });

        it("should not decrease bet level index below minimum", () => {
            mockBetControlStore.currentBetLevelIndex = 0;
            handler.changeBetLevel(false);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(0);
        });
    });

    describe("changeCoinValue method", () => {
        beforeEach(() => {
            mockBetControlStore.coinValues = [0.01, 0.02, 0.05, 0.1, 0.2];
            mockBetControlStore.currentCoinIndex = 2;
        });

        it("should increase coin index when possible", () => {
            handler.changeCoinValue(true);
            expect(mockBetControlStore.currentCoinIndex).toBe(3);
        });

        it("should decrease coin index when possible", () => {
            handler.changeCoinValue(false);
            expect(mockBetControlStore.currentCoinIndex).toBe(1);
        });

        it("should not increase coin index beyond maximum", () => {
            mockBetControlStore.currentCoinIndex = 4; // Last index
            handler.changeCoinValue(true);
            expect(mockBetControlStore.currentCoinIndex).toBe(4);
        });

        it("should not decrease coin index below minimum", () => {
            mockBetControlStore.currentCoinIndex = 0;
            handler.changeCoinValue(false);
            expect(mockBetControlStore.currentCoinIndex).toBe(0);
        });
    });

    describe("changeTotalBet method", () => {
        beforeEach(() => {
            mockBetControlStore.totalBetUnique = [
                { "0.1": { indexLevel: 0, indexCoin: 0 } },
                { "0.2": { indexLevel: 1, indexCoin: 0 } },
                { "0.5": { indexLevel: 2, indexCoin: 0 } },
            ];
            mockBetControlStore.currentTotalBetIndex = 1;
            jest.spyOn(handler, "syncOthersByTotalBet");
        });

        it("should increase total bet index and sync", () => {
            handler.changeTotalBet(true);
            expect(mockBetControlStore.currentTotalBetIndex).toBe(2);
            expect(handler.syncOthersByTotalBet).toHaveBeenCalled();
        });

        it("should decrease total bet index and sync", () => {
            handler.changeTotalBet(false);
            expect(mockBetControlStore.currentTotalBetIndex).toBe(0);
            expect(handler.syncOthersByTotalBet).toHaveBeenCalled();
        });

        it("should not increase total bet index beyond maximum", () => {
            mockBetControlStore.currentTotalBetIndex = 2; // Last index
            handler.changeTotalBet(true);
            expect(mockBetControlStore.currentTotalBetIndex).toBe(2);
            expect(handler.syncOthersByTotalBet).toHaveBeenCalled();
        });

        it("should not decrease total bet index below minimum", () => {
            mockBetControlStore.currentTotalBetIndex = 0;
            handler.changeTotalBet(false);
            expect(mockBetControlStore.currentTotalBetIndex).toBe(0);
            expect(handler.syncOthersByTotalBet).toHaveBeenCalled();
        });
    });

    describe("syncOthersByTotalBet method", () => {
        it("should sync bet level and coin indices from total bet", () => {
            mockBetControlStore.totalBetUnique = [{ "0.1": { indexLevel: 1, indexCoin: 2 } }, { "0.2": { indexLevel: 3, indexCoin: 4 } }];
            mockBetControlStore.currentTotalBetIndex = 1;

            handler.syncOthersByTotalBet();

            expect(mockBetControlStore.currentBetLevelIndex).toBe(3);
            expect(mockBetControlStore.currentCoinIndex).toBe(4);
        });
    });

    describe("init method", () => {
        it("should initialize with default values", () => {
            jest.spyOn(handler as any, "prepareBetLevelData");
            jest.spyOn(handler as any, "prepareCoinData");
            jest.spyOn(handler as any, "prepareTotalBetData");

            handler.init();

            expect(mockBetControlStore.defaultCoinValue).toBe(0.01);
            expect(mockBetControlStore.betMultiplier).toBe(10);
            expect(mockBetControlStore.betLevels).toEqual([1, 2, 3, 4, 5]);
            expect(mockBetControlStore.coinValues).toEqual([0.01, 0.02, 0.05, 0.1, 0.2]);
            expect((handler as any).prepareBetLevelData).toHaveBeenCalledWith([1, 2, 3, 4, 5], undefined);
            expect((handler as any).prepareCoinData).toHaveBeenCalledWith([0.01, 0.02, 0.05, 0.1, 0.2], undefined);
            expect((handler as any).prepareTotalBetData).toHaveBeenCalled();
        });

        it("should initialize with provided coin value and bet level", () => {
            jest.spyOn(handler as any, "prepareBetLevelData");
            jest.spyOn(handler as any, "prepareCoinData");

            handler.init(0.05, 3);

            expect((handler as any).prepareBetLevelData).toHaveBeenCalledWith([1, 2, 3, 4, 5], 3);
            expect((handler as any).prepareCoinData).toHaveBeenCalledWith([0.01, 0.02, 0.05, 0.1, 0.2], 0.05);
        });
    });

    describe("prepareBetLevelData method", () => {
        it("should set current bet level index for normal mode", () => {
            mockCascadingUIStore.isTrialMode = false;
            const betLevels = [5, 1, 3, 2, 4];

            (handler as any).prepareBetLevelData(betLevels, 3);

            expect(mockBetControlStore.betLevels).toEqual([1, 2, 3, 4, 5]);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(2); // Index of value 3
        });

        it("should set trial mode default index for trial mode", () => {
            mockCascadingUIStore.isTrialMode = true;
            const betLevels = [1, 2, 3, 4, 5];

            (handler as any).prepareBetLevelData(betLevels, 3);

            expect(mockBetControlStore.currentBetLevelIndex).toBe(4); // TrialModeDefaultBetLevelIndex
        });

        it("should set index to 0 when bet level not found", () => {
            mockCascadingUIStore.isTrialMode = false;
            const betLevels = [1, 2, 3, 4, 5];

            (handler as any).prepareBetLevelData(betLevels, 10);

            expect(mockBetControlStore.currentBetLevelIndex).toBe(0);
        });
    });

    describe("prepareCoinData method", () => {
        it("should set current coin index for valid coin value", () => {
            const coinValues = [0.2, 0.01, 0.1, 0.02, 0.05];
            jest.spyOn(handler as any, "findCoinIndex").mockReturnValue(2);

            (handler as any).prepareCoinData(coinValues, 0.05);

            expect(mockBetControlStore.coinValues).toEqual([0.01, 0.02, 0.05, 0.1, 0.2]);
            expect(mockBetControlStore.currentCoinIndex).toBe(2);
        });

        it("should use default coin value when none provided", () => {
            const coinValues = [0.01, 0.02, 0.05, 0.1, 0.2];
            jest.spyOn(handler as any, "findCoinIndex").mockReturnValue(0);

            (handler as any).prepareCoinData(coinValues);

            expect((handler as any).findCoinIndex).toHaveBeenCalledWith(0.01);
            expect(mockBetControlStore.currentCoinIndex).toBe(0);
        });

        it("should set index to 0 when coin value not found", () => {
            const coinValues = [0.01, 0.02, 0.05, 0.1, 0.2];
            jest.spyOn(handler as any, "findCoinIndex").mockReturnValue(-1);

            (handler as any).prepareCoinData(coinValues, 0.3);

            expect(mockBetControlStore.currentCoinIndex).toBe(0);
        });
    });

    describe("prepareTotalBetData method", () => {
        it("should generate unique total bet combinations", () => {
            mockBetControlStore.coinValues = [0.01, 0.02];
            mockBetControlStore.betLevels = [1, 2];
            mockBetControlStore.betMultiplier = 10;

            (handler as any).prepareTotalBetData();

            // Expected: 1*0.01*10=0.1, 1*0.02*10=0.2, 2*0.01*10=0.2, 2*0.02*10=0.4
            // Unique sorted: 0.1, 0.2, 0.4
            expect(mockBetControlStore.totalBetUnique).toHaveLength(3);
            expect(Object.keys(mockBetControlStore.totalBetUnique[0])[0]).toBe("0.1");
            expect(Object.keys(mockBetControlStore.totalBetUnique[1])[0]).toBe("0.2");
            expect(Object.keys(mockBetControlStore.totalBetUnique[2])[0]).toBe("0.4");
        });
    });

    describe("findCoinIndex method", () => {
        beforeEach(() => {
            mockBetControlStore.coinValues = [0.01, 0.02, 0.05, 0.1, 0.2];
        });

        it("should return correct index for existing coin value", () => {
            const result = (handler as any).findCoinIndex(0.05);
            expect(result).toBe(2);
        });

        it("should return -1 for non-existing coin value", () => {
            const result = (handler as any).findCoinIndex(0.03);
            expect(result).toBe(-1);
        });
    });

    describe("setTotalBet method", () => {
        it("should set total bet and resume last bet", () => {
            handler.setTotalBet(0.5);

            expect(mockBetControlStore.resumeLastBet).toBe(true);
            expect(mockBetControlStore.totalBet).toBe(0.5);
            expect(mockBetControlStore.syncCurrentTotalBetIndex).toHaveBeenCalledWith(0.5);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete initialization workflow", () => {
            mockCascadingUIStore.isTrialMode = false;
            mockConfigStore.gameConfigs = {
                coinValues: [0.01, 0.05, 0.1],
                betLevels: [1, 3, 5],
                betMultiplier: 20,
                defaultCoinValue: 0.05,
                maxWinPerRound: 1000,
                odds: {
                    freeSpins: {
                        initialOdds: [],
                        additionalOdds: [],
                    },
                    symbols: {},
                },
                totalMultiplier: 1,
                bigWinRange: [0, 0, 0],
            };

            handler.init(0.1, 3);

            expect(mockBetControlStore.defaultCoinValue).toBe(0.05);
            expect(mockBetControlStore.betMultiplier).toBe(20);
            expect(mockBetControlStore.betLevels).toEqual([1, 3, 5]);
            expect(mockBetControlStore.coinValues).toEqual([0.01, 0.05, 0.1]);
        });

        it("should handle bet level changes within bounds", () => {
            mockBetControlStore.betLevels = [1, 2, 3, 4, 5];
            mockBetControlStore.currentBetLevelIndex = 0;

            // Increase multiple times
            handler.changeBetLevel(true);
            handler.changeBetLevel(true);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(2);

            // Try to exceed maximum
            mockBetControlStore.currentBetLevelIndex = 4;
            handler.changeBetLevel(true);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(4);
        });

        it("should handle total bet changes and synchronization", () => {
            mockBetControlStore.totalBetUnique = [
                { "0.1": { indexLevel: 0, indexCoin: 1 } },
                { "0.2": { indexLevel: 1, indexCoin: 2 } },
                { "0.5": { indexLevel: 2, indexCoin: 3 } },
            ];
            mockBetControlStore.currentTotalBetIndex = 0;

            handler.changeTotalBet(true);

            expect(mockBetControlStore.currentTotalBetIndex).toBe(1);
            expect(mockBetControlStore.currentBetLevelIndex).toBe(1);
            expect(mockBetControlStore.currentCoinIndex).toBe(2);
        });

        it("should handle trial mode initialization", () => {
            mockCascadingUIStore.isTrialMode = true;
            const betLevels = [1, 2, 3, 4, 5, 6, 7];

            (handler as any).prepareBetLevelData(betLevels);

            expect(mockBetControlStore.currentBetLevelIndex).toBe(4); // TrialModeDefaultBetLevelIndex
        });
    });
});
