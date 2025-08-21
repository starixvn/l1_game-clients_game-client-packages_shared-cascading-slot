import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { SlotBetHandler } from "../../assets/handlers/slot-bet-handler";

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
    Notification: {
        NotificationStore: jest.fn(() => ({
            connection: {
                on: jest.fn(),
            },
        })),
    },
    Auth: {
        AuthStore: jest.fn(() => ({
            session: "test_session",
            username: "test_username",
            language: "en",
        })),
        AuthHandlers: {
            GetBalance: jest.fn(() => ({})),
        },
    },
    Configs: {
        SiteConfigs: jest.fn(),
    },
    Audios: {
        AudioHandler: jest.fn(() => ({
            playSFX: jest.fn(),
        })),
    },
    Notices: {
        NoticeErrorsHandlers: {
            AutoSignOutHandler: jest.fn(() => ({})),
        },
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
}));
jest.mock("inversify");

// Mock stores
const mockBetControlStore = {
    coinValue: 0.01,
    betLevel: 1,
    totalBet: 0.25,
};

const mockUIStore = {
    isFreeSpins: false,
    isTrialMode: false,
    changeUserBalance: false,
    userBalance: 1000,
};

const mockHoldActionStore = {};
const mockAutoPlayStore = {};
const mockFSBPromotionUIStore = { isFSBPromotionInProgress: false } as any;

const mockUIHandler = {
    changeCascadingState: jest.fn(),
    resetProcessingBet: jest.fn(),
};

const mockConnectionTrialStore = {
    send: jest.fn(),
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

const mockRetryGameHandler = {
    handle: jest.fn(),
};

const mockGameSetting = {
    validateBalanceWhenBet: true,
};

describe("SlotBetHandler", () => {
    let slotBetHandler: SlotBetHandler;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset mock stores
        mockBetControlStore.coinValue = 0.01;
        mockBetControlStore.betLevel = 1;
        mockBetControlStore.totalBet = 0.25;

        mockUIStore.isFreeSpins = false;
        mockUIStore.isTrialMode = false;
        mockUIStore.changeUserBalance = false;
        mockUIStore.userBalance = 1000;

        mockBetStore.isProcessingBet = false;
        mockFSBPromotionUIStore.isFSBPromotionInProgress = false;

        // Set mock stores directly on the prototype
        (SlotBetHandler.prototype as any).betControlStore = mockBetControlStore;
        (SlotBetHandler.prototype as any).uiHandler = mockUIHandler;
        (SlotBetHandler.prototype as any).connectionTrialStore = mockConnectionTrialStore;
        (SlotBetHandler.prototype as any).uiStore = mockUIStore;
        (SlotBetHandler.prototype as any).holdActionStore = mockHoldActionStore;
        (SlotBetHandler.prototype as any).autoPlayStore = mockAutoPlayStore;
        (SlotBetHandler.prototype as any).fsbPromotionUIStore = mockFSBPromotionUIStore;

        // Mock inherited properties
        (SlotBetHandler.prototype as any).orientationStore = mockOrientationStore;
        (SlotBetHandler.prototype as any).mainPlayerStore = mockMainPlayerStore;
        (SlotBetHandler.prototype as any).betStore = mockBetStore;
        (SlotBetHandler.prototype as any).connectionStore = mockConnectionStore;
        (SlotBetHandler.prototype as any).retryGameHandler = mockRetryGameHandler;
        (SlotBetHandler.prototype as any).gameSetting = mockGameSetting;

        // Mock inherited methods
        (SlotBetHandler.prototype as any).showWarningProcessingBet = jest.fn();
        (SlotBetHandler.prototype as any).showNoticePlaceBetFailure = jest.fn();

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        // Mock parent class constructor
        (gc.Bet.BetHandler as any) = jest.fn().mockImplementation(() => ({}));

        slotBetHandler = new SlotBetHandler(null, null, null, null, null, null, null, null);
    });

    describe("constructor", () => {
        it("should create instance extending BetHandler", () => {
            expect(slotBetHandler).toBeInstanceOf(SlotBetHandler);
            expect((slotBetHandler as any).betControlStore).toBeDefined();
            expect((slotBetHandler as any).uiHandler).toBeDefined();
        });
    });

    describe("slotBetData", () => {
        it("should return correct bet data structure", () => {
            const betData = slotBetHandler.slotBetData();

            expect(betData).toHaveProperty("m", "desktop");
            expect(betData).toHaveProperty("username", "testPlayer");
            expect(betData).toHaveProperty("coinValue", 0.01);
            expect(betData).toHaveProperty("betLevel", 1);
            expect(betData).toHaveProperty("totalBet", 0.25);
            expect(betData).toHaveProperty("freeSpin", false);
            expect(betData).toHaveProperty("clientSentTime");
            expect(betData.clientSentTime).toBeInstanceOf(Date);
        });

        it("should include freeSpin flag when in free spins mode", () => {
            mockUIStore.isFreeSpins = true;

            const betData = slotBetHandler.slotBetData();

            expect(betData.freeSpin).toBe(true);
        });

        it("should update bet data when store values change", () => {
            mockBetControlStore.coinValue = 0.05;
            mockBetControlStore.betLevel = 3;
            mockBetControlStore.totalBet = 1.5;
            mockMainPlayerStore.name = "newPlayer";

            const betData = slotBetHandler.slotBetData();

            expect(betData.coinValue).toBe(0.05);
            expect(betData.betLevel).toBe(3);
            expect(betData.totalBet).toBe(1.5);
            expect(betData.username).toBe("newPlayer");
        });
    });

    describe("isValidBet", () => {
        it("should return false when bet is already processing", () => {
            mockBetStore.isProcessingBet = true;

            const result = slotBetHandler.isValidBet(0.25);

            expect(result).toBe(false);
            expect((slotBetHandler as any).showWarningProcessingBet).toHaveBeenCalled();
        });

        it("should return true for free spins regardless of balance", () => {
            mockUIStore.isFreeSpins = true;
            mockUIStore.userBalance = 0;
            mockGameSetting.validateBalanceWhenBet = true;

            const result = slotBetHandler.isValidBet(100);

            expect(result).toBe(true);
        });

        it("should return false when bet amount exceeds balance with validation enabled", () => {
            mockUIStore.userBalance = 10;
            mockGameSetting.validateBalanceWhenBet = true;

            const result = slotBetHandler.isValidBet(15);

            expect(result).toBe(false);
            expect((slotBetHandler as any).showNoticePlaceBetFailure).toHaveBeenCalled();
        });

        it("should return true when bet amount is within balance", () => {
            mockUIStore.userBalance = 100;
            mockGameSetting.validateBalanceWhenBet = true;

            const result = slotBetHandler.isValidBet(50);

            expect(result).toBe(true);
        });

        it("should return true when balance validation is disabled", () => {
            mockUIStore.userBalance = 10;
            mockGameSetting.validateBalanceWhenBet = false;

            const result = slotBetHandler.isValidBet(15);

            expect(result).toBe(true);
        });

        it("should handle undefined gameSetting gracefully", () => {
            (slotBetHandler as any).gameSetting = undefined;
            mockUIStore.userBalance = 10;

            const result = slotBetHandler.isValidBet(15);

            expect(result).toBe(true);
        });
    });

    describe("handleBetData", () => {
        it("should successfully process valid bet in normal mode", () => {
            const betData = {
                totalBet: 0.25,
                m: "desktop",
                username: "testPlayer",
            };

            const result = slotBetHandler.handleBetData(betData);

            expect(result).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockConnectionStore.send).toHaveBeenCalledWith(gc.GameClientEmitMessage.Bet.eventName, betData);
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
            expect(mockRetryGameHandler.handle).toHaveBeenCalled();
        });

        it("should successfully process valid bet in trial mode", () => {
            mockUIStore.isTrialMode = true;
            const betData = {
                totalBet: 0.25,
                m: "desktop",
                username: "testPlayer",
            };

            const result = slotBetHandler.handleBetData(betData);

            expect(result).toBe(true);
            expect(mockConnectionTrialStore.send).toHaveBeenCalledWith(gc.GameClientEmitMessage.Bet.eventName, betData);
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
        });

        it("should handle invalid bet and reset processing", () => {
            mockBetStore.isProcessingBet = true; // This will make bet invalid
            const betData = {
                totalBet: 0.25,
            };

            const result = slotBetHandler.handleBetData(betData);

            expect(result).toBe(false);
            expect(mockUIHandler.resetProcessingBet).toHaveBeenCalled();
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
            expect(mockConnectionTrialStore.send).not.toHaveBeenCalled();
        });

        it("should set proper state sequence for valid bet", () => {
            const betData = { totalBet: 0.25 };

            slotBetHandler.handleBetData(betData);

            // Verify state changes in correct order
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
        });
    });

    describe("handle", () => {
        it("should create bet data and handle it", () => {
            const spy = jest.spyOn(slotBetHandler, "slotBetData");
            const handleSpy = jest.spyOn(slotBetHandler, "handleBetData");

            const result = slotBetHandler.handle();

            expect(spy).toHaveBeenCalled();
            expect(handleSpy).toHaveBeenCalled();
            expect(result).toBe(true); // Should succeed with default valid conditions
        });

        it("should return false when bet fails validation", () => {
            mockBetStore.isProcessingBet = true; // Make bet invalid

            const result = slotBetHandler.handle();

            expect(result).toBe(false);
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete betting flow for normal game", () => {
            mockUIStore.userBalance = 100;
            mockBetControlStore.totalBet = 1.0;

            const result = slotBetHandler.handle();

            expect(result).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
            expect(mockUIStore.changeUserBalance).toBe(true);
            expect(mockUIHandler.changeCascadingState).toHaveBeenCalledWith(CascadingSlotState.SPINNING);
        });

        it("should handle complete betting flow for free spins", () => {
            mockUIStore.isFreeSpins = true;
            mockUIStore.userBalance = 0; // No balance needed for free spins
            mockBetControlStore.totalBet = 1.0;

            const result = slotBetHandler.handle();

            expect(result).toBe(true);
            expect(mockBetStore.isProcessingBet).toBe(true);
        });

        it("should handle insufficient balance scenario", () => {
            mockUIStore.userBalance = 0.1;
            mockBetControlStore.totalBet = 1.0;
            mockGameSetting.validateBalanceWhenBet = true;

            const result = slotBetHandler.handle();

            expect(result).toBe(false);
            expect(mockUIHandler.resetProcessingBet).toHaveBeenCalled();
            expect((slotBetHandler as any).showNoticePlaceBetFailure).toHaveBeenCalled();
        });

        it("should handle trial mode betting", () => {
            mockUIStore.isTrialMode = true;

            const result = slotBetHandler.handle();

            expect(result).toBe(true);
            expect(mockConnectionTrialStore.send).toHaveBeenCalled();
            expect(mockConnectionStore.send).not.toHaveBeenCalled();
        });
    });

    describe("error handling", () => {
        it("should handle concurrent betting attempts", () => {
            mockBetStore.isProcessingBet = true;

            const result1 = slotBetHandler.handle();
            const result2 = slotBetHandler.handle();

            expect(result1).toBe(false);
            expect(result2).toBe(false);
            expect((slotBetHandler as any).showWarningProcessingBet).toHaveBeenCalledTimes(2);
        });
    });
});
