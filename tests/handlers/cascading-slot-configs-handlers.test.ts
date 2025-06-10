import { GameServiceMessageCascading } from "../../assets/game-messages-cascading";
import { CascadingSlotConfigsHandlers } from "../../assets/handlers/cascading-slot-configs-handlers";
import { CascadingSlotConfigsStore } from "../../assets/stores/cascading-slot-configs-store";

// Mock the dependencies
jest.mock("../../assets/stores/cascading-slot-configs-store");

describe("CascadingSlotConfigsHandlers", () => {
    let handler: CascadingSlotConfigsHandlers;
    let mockConfigStore: jest.Mocked<CascadingSlotConfigsStore>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockConfigStore = {
            gameConfigs: null,
            trialUser: null,
        } as any;

        // Create handler instance
        handler = new CascadingSlotConfigsHandlers();

        // Manually inject the mocked dependencies
        (handler as any).configStore = mockConfigStore;
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(CascadingSlotConfigsHandlers);
        });

        it("should have eventHandleList with correct structure", () => {
            expect(handler.eventHandleList).toBeDefined();
            expect(Array.isArray(handler.eventHandleList)).toBe(true);
            expect(handler.eventHandleList).toHaveLength(2);
        });

        it("should have correct event names in eventHandleList", () => {
            const eventNames = handler.eventHandleList.map((event) => event.name);
            expect(eventNames).toContain(GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName);
            expect(eventNames).toContain(GameServiceMessageCascading.CascadingTrialUserMsg.eventName);
        });

        it("should have correct handlers in eventHandleList", () => {
            const configsEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName
            );
            const trialUserEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingTrialUserMsg.eventName
            );

            expect(configsEvent.handle).toBe(handler.handleConfigs);
            expect(trialUserEvent.handle).toBe(handler.handleTrialUser);
        });
    });

    describe("handleConfigs method", () => {
        let mockGameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg;

        beforeEach(() => {
            mockGameConfigs = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3, 4, 5],
                betMultiplier: 10,
                coinValues: [0.1, 0.2, 0.5, 1.0, 2.0],
                maxWinPerRound: 1000000,
                odds: { symbol1: 100, symbol2: 200 },
                totalMultiplier: 1,
            };
        });

        it("should set gameConfigs in store", () => {
            handler.handleConfigs(mockGameConfigs);

            expect(mockConfigStore.gameConfigs).toBe(mockGameConfigs);
        });

        it("should handle complete gameConfigs data", () => {
            const completeConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.25,
                betLevels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
                betMultiplier: 20,
                coinValues: [0.05, 0.1, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0],
                maxWinPerRound: 5000000,
                odds: {
                    scatter: 500,
                    wild: 1000,
                    symbols: {
                        high: [100, 200, 300],
                        medium: [50, 75, 100],
                        low: [10, 20, 30],
                    },
                    bonusFeatures: {
                        freeSpins: 200,
                        multiplier: 150,
                    },
                },
                totalMultiplier: 5,
            };

            handler.handleConfigs(completeConfigs);

            expect(mockConfigStore.gameConfigs).toBe(completeConfigs);
        });

        it("should handle gameConfigs with empty arrays", () => {
            const configsWithEmptyArrays: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.1,
                betLevels: [],
                betMultiplier: 10,
                coinValues: [],
                maxWinPerRound: 1000000,
                odds: {},
                totalMultiplier: 1,
            };

            handler.handleConfigs(configsWithEmptyArrays);

            expect(mockConfigStore.gameConfigs).toBe(configsWithEmptyArrays);
        });

        it("should handle gameConfigs with zero values", () => {
            const configsWithZeros: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0,
                betLevels: [0, 1, 2],
                betMultiplier: 0,
                coinValues: [0, 0.1, 0.2],
                maxWinPerRound: 0,
                odds: { symbol1: 0 },
                totalMultiplier: 0,
            };

            handler.handleConfigs(configsWithZeros);

            expect(mockConfigStore.gameConfigs).toBe(configsWithZeros);
        });

        it("should handle large numbers in gameConfigs", () => {
            const configsWithLargeNumbers: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 999.99,
                betLevels: [100, 500, 1000, 5000, 10000],
                betMultiplier: 1000,
                coinValues: [0.01, 1.0, 10.0, 100.0, 1000.0],
                maxWinPerRound: 999999999,
                odds: { jackpot: 1000000 },
                totalMultiplier: 100,
            };

            handler.handleConfigs(configsWithLargeNumbers);

            expect(mockConfigStore.gameConfigs).toBe(configsWithLargeNumbers);
        });

        it("should handle decimal values correctly", () => {
            const configsWithDecimals: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.123456,
                betLevels: [1, 2, 3],
                betMultiplier: 12.5,
                coinValues: [0.01, 0.05, 0.123, 0.456, 0.789],
                maxWinPerRound: 123456.789,
                odds: { symbol1: 99.99, symbol2: 150.25 },
                totalMultiplier: 3.14159,
            };

            handler.handleConfigs(configsWithDecimals);

            expect(mockConfigStore.gameConfigs).toBe(configsWithDecimals);
        });

        it("should overwrite previous gameConfigs", () => {
            const firstConfigs = { ...mockGameConfigs, defaultCoinValue: 0.2 };
            const secondConfigs = { ...mockGameConfigs, defaultCoinValue: 0.5 };

            handler.handleConfigs(firstConfigs);
            expect(mockConfigStore.gameConfigs).toBe(firstConfigs);

            handler.handleConfigs(secondConfigs);
            expect(mockConfigStore.gameConfigs).toBe(secondConfigs);
        });
    });

    describe("handleTrialUser method", () => {
        let mockTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg;

        beforeEach(() => {
            mockTrialUser = {
                balance: 1000,
                rate: 1.5,
                multiplier: 2,
            };
        });

        it("should set trialUser in store", () => {
            handler.handleTrialUser(mockTrialUser);

            expect(mockConfigStore.trialUser).toBe(mockTrialUser);
        });

        it("should handle complete trialUser data", () => {
            const completeTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 5000.75,
                rate: 2.5,
                multiplier: 3.5,
            };

            handler.handleTrialUser(completeTrialUser);

            expect(mockConfigStore.trialUser).toBe(completeTrialUser);
        });

        it("should handle trialUser with zero values", () => {
            const trialUserWithZeros: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 0,
                rate: 0,
                multiplier: 0,
            };

            handler.handleTrialUser(trialUserWithZeros);

            expect(mockConfigStore.trialUser).toBe(trialUserWithZeros);
        });

        it("should handle trialUser with negative values", () => {
            const trialUserWithNegatives: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: -100,
                rate: -1.5,
                multiplier: -2,
            };

            handler.handleTrialUser(trialUserWithNegatives);

            expect(mockConfigStore.trialUser).toBe(trialUserWithNegatives);
        });

        it("should handle trialUser with decimal values", () => {
            const trialUserWithDecimals: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 999.99,
                rate: 1.2345,
                multiplier: 2.6789,
            };

            handler.handleTrialUser(trialUserWithDecimals);

            expect(mockConfigStore.trialUser).toBe(trialUserWithDecimals);
        });

        it("should handle trialUser with large numbers", () => {
            const trialUserWithLargeNumbers: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 999999999.99,
                rate: 1000.0,
                multiplier: 500.0,
            };

            handler.handleTrialUser(trialUserWithLargeNumbers);

            expect(mockConfigStore.trialUser).toBe(trialUserWithLargeNumbers);
        });

        it("should overwrite previous trialUser", () => {
            const firstTrialUser = { ...mockTrialUser, balance: 500 };
            const secondTrialUser = { ...mockTrialUser, balance: 2000 };

            handler.handleTrialUser(firstTrialUser);
            expect(mockConfigStore.trialUser).toBe(firstTrialUser);

            handler.handleTrialUser(secondTrialUser);
            expect(mockConfigStore.trialUser).toBe(secondTrialUser);
        });
    });

    describe("integration scenarios", () => {
        it("should handle both configs and trial user sequentially", () => {
            const mockGameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10,
                coinValues: [0.1, 0.5, 1.0],
                maxWinPerRound: 500000,
                odds: { symbol1: 100 },
                totalMultiplier: 1,
            };

            const mockTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 1000,
                rate: 1.5,
                multiplier: 2,
            };

            handler.handleConfigs(mockGameConfigs);
            handler.handleTrialUser(mockTrialUser);

            expect(mockConfigStore.gameConfigs).toBe(mockGameConfigs);
            expect(mockConfigStore.trialUser).toBe(mockTrialUser);
        });

        it("should handle trial user and configs in reverse order", () => {
            const mockGameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.2,
                betLevels: [1, 2, 3, 4],
                betMultiplier: 15,
                coinValues: [0.1, 0.2, 0.5, 1.0, 2.0],
                maxWinPerRound: 750000,
                odds: { symbol1: 150, symbol2: 250 },
                totalMultiplier: 2,
            };

            const mockTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 2500,
                rate: 2.0,
                multiplier: 3,
            };

            handler.handleTrialUser(mockTrialUser);
            handler.handleConfigs(mockGameConfigs);

            expect(mockConfigStore.gameConfigs).toBe(mockGameConfigs);
            expect(mockConfigStore.trialUser).toBe(mockTrialUser);
        });

        it("should handle multiple updates to both configs and trial user", () => {
            const configs1: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10,
                coinValues: [0.1, 0.5],
                maxWinPerRound: 100000,
                odds: { test: 50 },
                totalMultiplier: 1,
            };

            const configs2: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.5,
                betLevels: [1, 2, 3, 4, 5],
                betMultiplier: 20,
                coinValues: [0.1, 0.2, 0.5, 1.0, 2.0],
                maxWinPerRound: 500000,
                odds: { test: 100 },
                totalMultiplier: 2,
            };

            const user1: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 1000,
                rate: 1.0,
                multiplier: 1,
            };

            const user2: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 5000,
                rate: 2.5,
                multiplier: 4,
            };

            // First update
            handler.handleConfigs(configs1);
            handler.handleTrialUser(user1);
            expect(mockConfigStore.gameConfigs).toBe(configs1);
            expect(mockConfigStore.trialUser).toBe(user1);

            // Second update
            handler.handleConfigs(configs2);
            handler.handleTrialUser(user2);
            expect(mockConfigStore.gameConfigs).toBe(configs2);
            expect(mockConfigStore.trialUser).toBe(user2);
        });

        it("should handle rapid successive calls", () => {
            const configsArray = Array.from({ length: 10 }, (_, i) => ({
                defaultCoinValue: 0.1 + i * 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10 + i,
                coinValues: [0.1, 0.5],
                maxWinPerRound: 100000 + i * 10000,
                odds: { symbol: 100 + i * 10 },
                totalMultiplier: 1 + i,
            }));

            const usersArray = Array.from({ length: 10 }, (_, i) => ({
                balance: 1000 + i * 100,
                rate: 1.0 + i * 0.1,
                multiplier: 1 + i,
            }));

            // Rapid fire updates
            configsArray.forEach((config, index) => {
                handler.handleConfigs(config);
                handler.handleTrialUser(usersArray[index]);

                expect(mockConfigStore.gameConfigs).toBe(config);
                expect(mockConfigStore.trialUser).toBe(usersArray[index]);
            });

            // Final state should be the last update
            expect(mockConfigStore.gameConfigs).toBe(configsArray[9]);
            expect(mockConfigStore.trialUser).toBe(usersArray[9]);
        });
    });

    describe("edge cases", () => {
        it("should handle undefined configs gracefully", () => {
            expect(() => handler.handleConfigs(undefined as any)).not.toThrow();
            expect(mockConfigStore.gameConfigs).toBeUndefined();
        });

        it("should handle null configs gracefully", () => {
            expect(() => handler.handleConfigs(null as any)).not.toThrow();
            expect(mockConfigStore.gameConfigs).toBeNull();
        });

        it("should handle undefined trial user gracefully", () => {
            expect(() => handler.handleTrialUser(undefined as any)).not.toThrow();
            expect(mockConfigStore.trialUser).toBeUndefined();
        });

        it("should handle null trial user gracefully", () => {
            expect(() => handler.handleTrialUser(null as any)).not.toThrow();
            expect(mockConfigStore.trialUser).toBeNull();
        });

        it("should handle configs with missing properties", () => {
            const incompleteConfigs = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                // Missing other properties
            } as any;

            expect(() => handler.handleConfigs(incompleteConfigs)).not.toThrow();
            expect(mockConfigStore.gameConfigs).toBe(incompleteConfigs);
        });

        it("should handle trial user with missing properties", () => {
            const incompleteUser = {
                balance: 1000,
                // Missing rate and multiplier
            } as any;

            expect(() => handler.handleTrialUser(incompleteUser)).not.toThrow();
            expect(mockConfigStore.trialUser).toBe(incompleteUser);
        });

        it("should handle configs with extra properties", () => {
            const configsWithExtra = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10,
                coinValues: [0.1, 0.5],
                maxWinPerRound: 100000,
                odds: { test: 100 },
                totalMultiplier: 1,
                extraProperty: "extra",
                anotherExtra: 999,
            } as any;

            expect(() => handler.handleConfigs(configsWithExtra)).not.toThrow();
            expect(mockConfigStore.gameConfigs).toBe(configsWithExtra);
        });

        it("should handle trial user with extra properties", () => {
            const userWithExtra = {
                balance: 1000,
                rate: 1.5,
                multiplier: 2,
                extraProperty: "extra",
                anotherExtra: 999,
            } as any;

            expect(() => handler.handleTrialUser(userWithExtra)).not.toThrow();
            expect(mockConfigStore.trialUser).toBe(userWithExtra);
        });
    });

    describe("eventHandleList functionality", () => {
        it("should correctly bind handleConfigs method", () => {
            const configsEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName
            );

            const mockConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = {
                defaultCoinValue: 0.1,
                betLevels: [1, 2, 3],
                betMultiplier: 10,
                coinValues: [0.1, 0.5],
                maxWinPerRound: 100000,
                odds: { test: 100 },
                totalMultiplier: 1,
            };

            // Call the handle method from eventHandleList
            configsEvent.handle.call(handler, mockConfigs);

            expect(mockConfigStore.gameConfigs).toBe(mockConfigs);
        });

        it("should correctly bind handleTrialUser method", () => {
            const trialUserEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingTrialUserMsg.eventName
            );

            const mockTrialUser: GameServiceMessageCascading.CascadingTrialUserMsg = {
                balance: 1000,
                rate: 1.5,
                multiplier: 2,
            };

            // Call the handle method from eventHandleList
            trialUserEvent.handle.call(handler, mockTrialUser);

            expect(mockConfigStore.trialUser).toBe(mockTrialUser);
        });

        it("should maintain correct method context", () => {
            const configsEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName
            );
            const trialUserEvent = handler.eventHandleList.find(
                (event) => event.name === GameServiceMessageCascading.CascadingTrialUserMsg.eventName
            );

            expect(configsEvent.handle).toBe(handler.handleConfigs);
            expect(trialUserEvent.handle).toBe(handler.handleTrialUser);
            expect(typeof configsEvent.handle).toBe("function");
            expect(typeof trialUserEvent.handle).toBe("function");
        });
    });
});
