import { Container } from "inversify";
import "reflect-metadata";
import { GameServiceMessageCascading } from "../../assets/game-messages-cascading";
import { CascadingSlotConfigsStore } from "../../assets/stores/cascading-slot-configs-store";

describe("CascadingSlotConfigsStore", () => {
    let container: Container;
    let configsStore: CascadingSlotConfigsStore;

    beforeEach(() => {
        container = new Container();
        container.bind(CascadingSlotConfigsStore).toSelf();
        configsStore = container.get(CascadingSlotConfigsStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            const freshStore = new CascadingSlotConfigsStore();

            expect(freshStore.gameConfigs).toBeNull();
            expect(freshStore.trialUser).toBeNull();
        });
    });

    describe("gameConfigs property", () => {
        let mockGameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg;

        beforeEach(() => {
            mockGameConfigs = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3, 4, 5],
                betMultiplier: 10,
                coinValues: [0.1, 0.2, 0.5, 1.0, 2.0],
                maxWinPerRound: 1000000,
                odds: {
                    freeSpins: {
                        initialOdds: [{ count: 1, odds: 100 }],
                        additionalOdds: [{ count: 2, odds: 200 }],
                    },
                    symbols: {
                        symbol1: [{ from: 1, to: 10, odds: 100 }],
                        symbol2: [{ from: 11, to: 20, odds: 200 }],
                    },
                },
                totalMultiplier: 1,
            };
        });

        it("should get gameConfigs correctly", () => {
            configsStore.gameConfigs = mockGameConfigs;

            expect(configsStore.gameConfigs).toStrictEqual(mockGameConfigs);
        });

        it("should set gameConfigs correctly", () => {
            configsStore.gameConfigs = mockGameConfigs;

            expect(configsStore.gameConfigs).toStrictEqual(mockGameConfigs);
            expect(configsStore.gameConfigs.defaultCoinValue).toBe(0.1);
            expect(configsStore.gameConfigs.betLevels).toEqual([1, 2, 3, 4, 5]);
            expect(configsStore.gameConfigs.betMultiplier).toBe(10);
            expect(configsStore.gameConfigs.coinValues).toEqual([0.1, 0.2, 0.5, 1.0, 2.0]);
            expect(configsStore.gameConfigs.maxWinPerRound).toBe(1000000);
            expect(configsStore.gameConfigs.odds).toEqual(mockGameConfigs.odds);
            expect(configsStore.gameConfigs.totalMultiplier).toBe(1);
        });

        it("should handle null gameConfigs", () => {
            configsStore.gameConfigs = null;

            expect(configsStore.gameConfigs).toBeNull();
        });

        it("should overwrite previous gameConfigs when set again", () => {
            const firstConfig = { ...mockGameConfigs, defaultCoinValue: 0.2 };
            const secondConfig = { ...mockGameConfigs, defaultCoinValue: 0.5 };

            configsStore.gameConfigs = firstConfig;
            expect(configsStore.gameConfigs.defaultCoinValue).toBe(0.2);

            configsStore.gameConfigs = secondConfig;
            expect(configsStore.gameConfigs.defaultCoinValue).toBe(0.5);
        });

        it("should handle empty arrays in gameConfigs", () => {
            const configWithEmptyArrays = {
                ...mockGameConfigs,
                betLevels: [],
                coinValues: [],
            };

            configsStore.gameConfigs = configWithEmptyArrays;

            expect(configsStore.gameConfigs.betLevels).toEqual([]);
            expect(configsStore.gameConfigs.coinValues).toEqual([]);
        });

        it("should handle zero values in gameConfigs", () => {
            const configWithZeros = {
                ...mockGameConfigs,
                defaultCoinValue: 0,
                betMultiplier: 0,
                maxWinPerRound: 0,
                totalMultiplier: 0,
            };

            configsStore.gameConfigs = configWithZeros;

            expect(configsStore.gameConfigs.defaultCoinValue).toBe(0);
            expect(configsStore.gameConfigs.betMultiplier).toBe(0);
            expect(configsStore.gameConfigs.maxWinPerRound).toBe(0);
            expect(configsStore.gameConfigs.totalMultiplier).toBe(0);
        });
    });

    describe("trialUser property", () => {
        let mockTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg;

        beforeEach(() => {
            mockTrialUser = {
                balance: 1000,
                rate: 1.5,
                multiplier: 2,
            };
        });

        it("should get trialUser correctly", () => {
            configsStore.trialUser = mockTrialUser;

            expect(configsStore.trialUser).toStrictEqual(mockTrialUser);
        });

        it("should set trialUser correctly", () => {
            configsStore.trialUser = mockTrialUser;

            expect(configsStore.trialUser).toStrictEqual(mockTrialUser);
            expect(configsStore.trialUser.balance).toBe(1000);
            expect(configsStore.trialUser.rate).toBe(1.5);
            expect(configsStore.trialUser.multiplier).toBe(2);
        });

        it("should handle null trialUser", () => {
            configsStore.trialUser = null;

            expect(configsStore.trialUser).toBeNull();
        });

        it("should overwrite previous trialUser when set again", () => {
            const firstUser = { ...mockTrialUser, balance: 500 };
            const secondUser = { ...mockTrialUser, balance: 2000 };

            configsStore.trialUser = firstUser;
            expect(configsStore.trialUser.balance).toBe(500);

            configsStore.trialUser = secondUser;
            expect(configsStore.trialUser.balance).toBe(2000);
        });

        it("should handle zero and negative values", () => {
            const userWithEdgeValues = {
                balance: 0,
                rate: -1.5,
                multiplier: 0,
            };

            configsStore.trialUser = userWithEdgeValues;

            expect(configsStore.trialUser.balance).toBe(0);
            expect(configsStore.trialUser.rate).toBe(-1.5);
            expect(configsStore.trialUser.multiplier).toBe(0);
        });

        it("should handle decimal values correctly", () => {
            const userWithDecimals = {
                balance: 999.99,
                rate: 1.2345,
                multiplier: 2.5,
            };

            configsStore.trialUser = userWithDecimals;

            expect(configsStore.trialUser.balance).toBe(999.99);
            expect(configsStore.trialUser.rate).toBe(1.2345);
            expect(configsStore.trialUser.multiplier).toBe(2.5);
        });
    });

    describe("state combinations", () => {
        it("should handle both gameConfigs and trialUser being set", () => {
            const mockGameConfigs = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10,
                coinValues: [0.1, 0.5, 1.0],
                maxWinPerRound: 500000,
                odds: {
                    freeSpins: {
                        initialOdds: [{ count: 1, odds: 100 }],
                        additionalOdds: [{ count: 2, odds: 200 }],
                    },
                    symbols: {
                        symbol1: [{ from: 1, to: 10, odds: 100 }],
                        symbol2: [{ from: 11, to: 20, odds: 200 }],
                    },
                },
                totalMultiplier: 1,
            };

            const mockTrialUser = {
                balance: 1500,
                rate: 2.0,
                multiplier: 3,
            };

            configsStore.gameConfigs = mockGameConfigs;
            configsStore.trialUser = mockTrialUser;

            expect(configsStore.gameConfigs).toStrictEqual(mockGameConfigs);
            expect(configsStore.trialUser).toStrictEqual(mockTrialUser);
        });

        it("should handle setting one property to null while other remains", () => {
            const mockGameConfigs = {
                defaultCoinValue: 0.2,
                betLevels: [1, 2],
                betMultiplier: 5,
                coinValues: [0.2, 1.0],
                maxWinPerRound: 250000,
                odds: {
                    freeSpins: {
                        initialOdds: [{ count: 1, odds: 100 }],
                        additionalOdds: [{ count: 2, odds: 200 }],
                    },
                    symbols: { symbol1: [{ from: 1, to: 10, odds: 100 }], symbol2: [{ from: 11, to: 20, odds: 200 }] },
                },
                totalMultiplier: 2,
            };

            const mockTrialUser = {
                balance: 750,
                rate: 1.8,
                multiplier: 1.5,
            };

            configsStore.gameConfigs = mockGameConfigs;
            configsStore.trialUser = mockTrialUser;

            // Set gameConfigs to null while trialUser remains
            configsStore.gameConfigs = null;
            expect(configsStore.gameConfigs).toBeNull();
            expect(configsStore.trialUser).toStrictEqual(mockTrialUser);

            // Set trialUser to null while gameConfigs is null
            configsStore.trialUser = null;
            expect(configsStore.gameConfigs).toBeNull();
            expect(configsStore.trialUser).toBeNull();
        });
    });
});
