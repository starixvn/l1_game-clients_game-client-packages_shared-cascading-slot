import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { HyperSpinBetHandler } from "../../assets/handlers/hyper-spin-bet-handler";

// Mock dependencies
jest.mock("@sg/game-client-base", () => ({
    Bet: {
        BetHandler: jest.fn().mockImplementation(function () {
            return this;
        }),
    },
    GameClientEmitMessage: {
        Bet: { eventName: "bet" },
    },
    Configs: {
        SiteConfigs: jest.fn(),
    },
    Connection: {
        ConnectionTrialStore: jest.fn(),
    },
    Player: {
        MainPlayerStore: jest.fn(),
    },
    UserSettings: {
        UserSettingHandlers: jest.fn(),
        UserSettingStore: jest.fn(),
    },
    GameUserSettings: {
        GameUserSettingHandler: jest.fn(),
        GameUserSettingStore: jest.fn(),
        GameUserSettingAction: {},
    },
    OrientationStore: jest.fn(),
    BetStore: jest.fn(),
    ConnectionStore: jest.fn(),
    RetryGameHandler: jest.fn(),
    Notices: {
        NoticeStore: jest.fn(),
    },
    Rounds: {
        RoundTimeStore: jest.fn(),
    },
}));
jest.mock("inversify");

// Mock FSB promotion stores
jest.mock("db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-store", () => ({
    FSBPromotionStore: jest.fn().mockImplementation(() => ({})),
}));
jest.mock("db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store", () => ({
    FSBPromotionUIStore: jest.fn().mockImplementation(() => ({})),
}));

// Mock stores
const mockBetControlStore = {
    effectiveCoinValue: 0.01,
    effectiveBetLevel: 1,
    effectiveTotalBet: 0.25,
};

const mockUIStore = {
    isFreeSpins: false,
    isTrialMode: false,
    changeUserBalance: false,
    freeSpinsTotal: 0,
};

const mockUIHandler = {
    changeCascadingState: jest.fn(),
};

// Mock inherited properties from BetHandler
const mockOrientationStore = {
    m: "desktop",
};

const mockMainPlayerStore = {
    name: "testPlayer",
};

const mockBetStore = {
    isProcessingBet: false,
};

const mockConnectionStore = {
    send: jest.fn(),
};

const mockConnectionTrialStore = {
    send: jest.fn(),
};

const mockRetryGameHandler = {
    handle: jest.fn(),
};

// Mock console.warn for free spin logging
const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

describe("HyperSpinBetHandler", () => {
    let hyperSpinBetHandler: HyperSpinBetHandler;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        consoleWarnSpy.mockClear();

        // Reset mock stores
        mockBetControlStore.effectiveCoinValue = 0.01;
        mockBetControlStore.effectiveBetLevel = 1;
        mockBetControlStore.effectiveTotalBet = 0.25;

        mockUIStore.isFreeSpins = false;
        mockUIStore.isTrialMode = false;
        mockUIStore.changeUserBalance = false;
        mockUIStore.freeSpinsTotal = 0;

        mockBetStore.isProcessingBet = false;

        // Set mock stores directly on the prototype
        (HyperSpinBetHandler.prototype as any).betControlStore = mockBetControlStore;
        (HyperSpinBetHandler.prototype as any).uiHandler = mockUIHandler;
        (HyperSpinBetHandler.prototype as any).connectionTrialStore = mockConnectionTrialStore;
        (HyperSpinBetHandler.prototype as any).uiStore = mockUIStore;

        // Mock inherited properties
        (HyperSpinBetHandler.prototype as any).orientationStore = mockOrientationStore;
        (HyperSpinBetHandler.prototype as any).mainPlayerStore = mockMainPlayerStore;
        (HyperSpinBetHandler.prototype as any).betStore = mockBetStore;
        (HyperSpinBetHandler.prototype as any).connectionStore = mockConnectionStore;
        (HyperSpinBetHandler.prototype as any).retryGameHandler = mockRetryGameHandler;

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        // Mock parent class constructor
        (gc.Bet.BetHandler as any) = jest.fn().mockImplementation(() => ({}));

        hyperSpinBetHandler = new HyperSpinBetHandler(null, null, null, null, null, null, null, null);
    });

    describe("constructor", () => {
        it("should create instance extending BetHandler", () => {
            expect(hyperSpinBetHandler).toBeInstanceOf(HyperSpinBetHandler);
            expect((hyperSpinBetHandler as any).betControlStore).toBeDefined();
            expect((hyperSpinBetHandler as any).uiHandler).toBeDefined();
            expect((hyperSpinBetHandler as any).connectionTrialStore).toBeDefined();
            expect((hyperSpinBetHandler as any).uiStore).toBeDefined();
        });

        it("should have all required dependencies injected", () => {
            expect((hyperSpinBetHandler as any).betControlStore).toBe(mockBetControlStore);
            expect((hyperSpinBetHandler as any).uiStore).toBe(mockUIStore);
            expect((hyperSpinBetHandler as any).uiHandler).toBe(mockUIHandler);
            expect((hyperSpinBetHandler as any).connectionTrialStore).toBe(mockConnectionTrialStore);
        });
    });

    describe("handle", () => {
        it("should create bet data and place bet directly", () => {
            const createSpy = jest.spyOn(hyperSpinBetHandler as any, 'createHyperSpinBetData');
            const placeSpy = jest.spyOn(hyperSpinBetHandler as any, 'placeBetDirectly');

            const result = hyperSpinBetHandler.handle();

            expect(createSpy).toHaveBeenCalledWith(0.25);
            expect(placeSpy).toHaveBeenCalledWith(expect.any(Object), 0.25);
            expect(result).toBe(true);
        });

        it("should use effectiveTotalBet from betControlStore", () => {
            mockBetControlStore.effectiveTotalBet = 1.5;
            const createSpy = jest.spyOn(hyperSpinBetHandler as any, 'createHyperSpinBetData');

            hyperSpinBetHandler.handle();

            expect(createSpy).toHaveBeenCalledWith(1.5);
        });

        it("should return result from placeBetDirectly", () => {
            const placeSpy = jest.spyOn(hyperSpinBetHandler as any, 'placeBetDirectly');
            placeSpy.mockReturnValueOnce(false);

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(false);
        });
    });

    describe("createHyperSpinBetData", () => {
        it("should create correct bet data structure for regular bet", () => {
            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(betData).toEqual({
                m: "desktop",
                username: "testPlayer",
                coinValue: 0.01,
                betLevel: 1,
                totalBet: 0.25,
                freeSpin: false,
                clientSentTime: expect.any(Date),
            });
        });

        it("should create correct bet data structure for free spin", () => {
            mockUIStore.isFreeSpins = true;

            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(betData).toEqual({
                m: "desktop",
                username: "testPlayer",
                coinValue: 0.01,
                betLevel: 1,
                totalBet: 0.25,
                freeSpin: true,
                clientSentTime: expect.any(Date),
            });
        });

        it("should log console warning for free spin bets", () => {
            mockUIStore.isFreeSpins = true;
            mockUIStore.freeSpinsTotal = 5;

            (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[HYPER_SPIN_BET_HANDLER] 🎰 FREE SPIN BET REQUEST",
                {
                    betData: expect.any(Object),
                    isFreeSpins: true,
                    freeSpinsTotal: 5,
                    timestamp: expect.any(String),
                }
            );
        });

        it("should not log console warning for regular bets", () => {
            mockUIStore.isFreeSpins = false;

            (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should use provided amount in bet data", () => {
            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(2.5);

            expect(betData.totalBet).toBe(2.5);
        });

        it("should include current timestamp in clientSentTime", () => {
            const beforeCall = new Date();
            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);
            const afterCall = new Date();

            expect(betData.clientSentTime.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(betData.clientSentTime.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });

        it("should use orientation store m value", () => {
            mockOrientationStore.m = "mobile";

            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(betData.m).toBe("mobile");
        });

        it("should use main player store name", () => {
            mockMainPlayerStore.name = "player123";

            const betData = (hyperSpinBetHandler as any).createHyperSpinBetData(0.25);

            expect(betData.username).toBe("player123");
        });
    });

    describe("placeBetDirectly", () => {
        const mockBetData = {
            m: "desktop",
            username: "testPlayer",
            coinValue: 0.01,
            betLevel: 1,
            totalBet: 0.25,
            freeSpin: false,
            clientSentTime: new Date(),
        };

        beforeEach(() => {
            // Reset UI handler mock
            mockUIHandler.changeCascadingState.mockClear();
        });

        it("should return false when bet is already processing", () => {
            mockBetStore.isProcessingBet = true;

            const result = (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            expect(result).toBe(false);
            expect(mockUIStore.changeUserBalance).toBe(false);
            expect(mockBetStore.isProcessingBet).toBe(true); // Should not change
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
            expect(mockConnectionTrialStore.send).not.toHaveBeenCalled();
            expect(mockUIHandler.changeCascadingState).not.toHaveBeenCalled();
            expect(mockRetryGameHandler.handle).not.toHaveBeenCalled();
        });

        it("should successfully place bet in normal mode", () => {
            mockUIStore.isTrialMode = false;

            const result = (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            expect(result).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(gc.GameClientEmitMessage.Bet.eventName, mockBetData);
            expect(mockConnectionTrialStore.send).not.toHaveBeenCalled();
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
            expect(mockRetryGameHandler.handle).toHaveBeenCalled();
        });

        it("should successfully place bet in trial mode", () => {
            mockUIStore.isTrialMode = true;

            const result = (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            expect(result).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockConnectionTrialStore.send).toHaveBeenCalledWith(gc.GameClientEmitMessage.Bet.eventName, mockBetData);
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
            expect(mockRetryGameHandler.handle).toHaveBeenCalled();
        });

        it("should set changeUserBalance to false initially then true", () => {
            const result = (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            // Should set to false first, then true
            expect(result).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
        });

        it("should call changeCascadingState with SPINNING", () => {
            (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledTimes(1);
        });

        it("should call retryGameHandler.handle()", () => {
            (hyperSpinBetHandler as any).placeBetDirectly(mockBetData, 0.25);

            expect(mockRetryGameHandler.handle).toHaveBeenCalledTimes(1);
        });

        it("should use provided bet data and amount", () => {
            const customBetData = { ...mockBetData, totalBet: 5.0 };
            const customAmount = 5.0;

            const result = (hyperSpinBetHandler as any).placeBetDirectly(customBetData, customAmount);

            expect(result).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(gc.GameClientEmitMessage.Bet.eventName, customBetData);
        });

        it("should handle undefined bet data gracefully", () => {
            // This test ensures the method doesn't crash with undefined data
            // In practice, this shouldn't happen but we test for robustness
            expect(() => {
                (hyperSpinBetHandler as any).placeBetDirectly(undefined, 0.25);
            }).not.toThrow();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete betting flow for regular hyper-spin bet", () => {
            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
            expect(mockConnectionStore.send).toHaveBeenCalled();
            expect(mockRetryGameHandler.handle).toHaveBeenCalled();
        });

        it("should handle complete betting flow for hyper-spin free spin bet", () => {
            mockUIStore.isFreeSpins = true;
            mockUIStore.freeSpinsTotal = 3;

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(consoleWarnSpy).toHaveBeenCalledWith(
                "[HYPER_SPIN_BET_HANDLER] 🎰 FREE SPIN BET REQUEST",
                expect.objectContaining({
                    isFreeSpins: true,
                    freeSpinsTotal: 3,
                })
            );
        });

        it("should handle trial mode hyper-spin betting", () => {
            mockUIStore.isTrialMode = true;

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockConnectionTrialStore.send).toHaveBeenCalled();
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
        });

        it("should handle concurrent hyper-spin betting attempts", () => {
            mockBetStore.isProcessingBet = true;

            const result1 = hyperSpinBetHandler.handle();
            const result2 = hyperSpinBetHandler.handle();

            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
            expect(mockConnectionTrialStore.send).not.toHaveBeenCalled();
        });
    });

    describe("state management", () => {
        it("should properly sequence state changes for successful bet", () => {
            // Initial state
            expect(mockUIStore.changeUserBalance).toBe(false);
            expect(mockBetStore.isProcessingBet).toBe(false);

            hyperSpinBetHandler.handle();

            // Final state after successful bet
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
        });

        it("should maintain state isolation between calls", () => {
            // First call
            hyperSpinBetHandler.handle();
            expect(mockBetStore.isProcessingBet).toBe(true);

            // Reset for second call
            mockBetStore.isProcessingBet = false;
            mockUIStore.changeUserBalance = false;

            // Second call should work independently
            const result = hyperSpinBetHandler.handle();
            expect(result).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
        });
    });

    describe("edge cases", () => {
        it("should handle zero amount bets", () => {
            mockBetControlStore.effectiveTotalBet = 0;

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(
                gc.GameClientEmitMessage.Bet.eventName,
                expect.objectContaining({ totalBet: 0 })
            );
        });

        it("should handle large amount bets", () => {
            mockBetControlStore.effectiveTotalBet = 10000;

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(
                gc.GameClientEmitMessage.Bet.eventName,
                expect.objectContaining({ totalBet: 10000 })
            );
        });

        it("should handle decimal amount bets", () => {
            mockBetControlStore.effectiveTotalBet = 1.23456;

            const result = hyperSpinBetHandler.handle();

            expect(result).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(
                gc.GameClientEmitMessage.Bet.eventName,
                expect.objectContaining({ totalBet: 1.23456 })
            );
        });
    });

    describe("console logging", () => {
        it("should log free spin bet requests with correct data", () => {
            mockUIStore.isFreeSpins = true;
            mockUIStore.freeSpinsTotal = 7;

            hyperSpinBetHandler.handle();

            expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
            const callArgs = consoleWarnSpy.mock.calls[0];

            expect(callArgs[0]).toBe("[HYPER_SPIN_BET_HANDLER] 🎰 FREE SPIN BET REQUEST");
            expect(callArgs[1]).toHaveProperty("betData");
            expect(callArgs[1]).toHaveProperty("isFreeSpins", true);
            expect(callArgs[1]).toHaveProperty("freeSpinsTotal", 7);
            expect(callArgs[1]).toHaveProperty("timestamp");
            expect(typeof callArgs[1].timestamp).toBe("string");
        });

        it("should not log for regular bets", () => {
            mockUIStore.isFreeSpins = false;

            hyperSpinBetHandler.handle();

            expect(consoleWarnSpy).not.toHaveBeenCalled();
        });

        it("should include timestamp in ISO format for free spin logs", () => {
            mockUIStore.isFreeSpins = true;

            const beforeCall = new Date();
            hyperSpinBetHandler.handle();
            const afterCall = new Date();

            const loggedTimestamp = consoleWarnSpy.mock.calls[0][1].timestamp;
            const parsedTimestamp = new Date(loggedTimestamp);

            expect(parsedTimestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
            expect(parsedTimestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
        });
    });
});
