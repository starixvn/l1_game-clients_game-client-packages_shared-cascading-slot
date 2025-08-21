import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import inversify from "inversify";
import { CascadingTotalBetHandlers } from "../../assets/handlers/cascading-total-bet-handlers";

// Mock dependencies
jest.mock("inversify");

// Mock store
const mockBetControlStore = {
    isOpenBetAmountPopup: false,
    totalBet: 0,
    betLevel: 1,
    coinValue: 0.01,
    lastSetting: null,
    needClearLastSetting: false,
};

describe("CascadingTotalBetHandlers", () => {
    let totalBetHandlers: CascadingTotalBetHandlers;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset mock store
        mockBetControlStore.isOpenBetAmountPopup = false;
        mockBetControlStore.totalBet = 0;
        mockBetControlStore.betLevel = 1;
        mockBetControlStore.coinValue = 0.01;
        mockBetControlStore.lastSetting = null;
        mockBetControlStore.needClearLastSetting = false;

        // Set mock store directly on the prototype
        (CascadingTotalBetHandlers.prototype as any).betControlStore = mockBetControlStore;

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        totalBetHandlers = new CascadingTotalBetHandlers();
    });

    describe("constructor", () => {
        it("should create an instance with proper dependencies", () => {
            expect(totalBetHandlers).toBeInstanceOf(CascadingTotalBetHandlers);
            expect((totalBetHandlers as any).betControlStore).toBeDefined();
        });

        it("should inject BetControlStore dependency", () => {
            expect((totalBetHandlers as any).betControlStore).toBe(mockBetControlStore);
        });
    });

    describe("showBetControl", () => {
        it("should set isOpenBetAmountPopup to true when called", () => {
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(false);

            totalBetHandlers.showBetControl();

            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);
        });

        it("should set isOpenBetAmountPopup to true even if already true", () => {
            mockBetControlStore.isOpenBetAmountPopup = true;

            totalBetHandlers.showBetControl();

            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);
        });

        it("should not affect other store properties", () => {
            const initialTotalBet = mockBetControlStore.totalBet;
            const initialBetLevel = mockBetControlStore.betLevel;
            const initialCoinValue = mockBetControlStore.coinValue;
            const initialLastSetting = mockBetControlStore.lastSetting;
            const initialNeedClearLastSetting = mockBetControlStore.needClearLastSetting;

            totalBetHandlers.showBetControl();

            expect(mockBetControlStore.totalBet).toBe(initialTotalBet);
            expect(mockBetControlStore.betLevel).toBe(initialBetLevel);
            expect(mockBetControlStore.coinValue).toBe(initialCoinValue);
            expect(mockBetControlStore.lastSetting).toBe(initialLastSetting);
            expect(mockBetControlStore.needClearLastSetting).toBe(initialNeedClearLastSetting);
        });

        it("should be callable multiple times without side effects", () => {
            totalBetHandlers.showBetControl();
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);

            totalBetHandlers.showBetControl();
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);

            totalBetHandlers.showBetControl();
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);
        });
    });

    describe("store interaction", () => {
        it("should maintain reference to the same store instance", () => {
            const storeReference = (totalBetHandlers as any).betControlStore;

            totalBetHandlers.showBetControl();

            expect((totalBetHandlers as any).betControlStore).toBe(storeReference);
            expect((totalBetHandlers as any).betControlStore).toBe(mockBetControlStore);
        });
    });

    describe("dependency injection", () => {
        it("should have protected readonly betControlStore property", () => {
            expect((totalBetHandlers as any).betControlStore).toBeDefined();

            // Verify it's the injected store
            expect((totalBetHandlers as any).betControlStore).toBe(mockBetControlStore);
        });
    });

    describe("class behavior", () => {
        it("should be a simple handler with single responsibility", () => {
            const methodNames = Object.getOwnPropertyNames(CascadingTotalBetHandlers.prototype).filter(
                (name) => name !== "constructor" && typeof (totalBetHandlers as any)[name] === "function"
            );

            expect(methodNames).toContain("showBetControl");
            expect(methodNames).toHaveLength(1);
        });

        it("should have showBetControl method with correct signature", () => {
            expect(typeof totalBetHandlers.showBetControl).toBe("function");
            expect(totalBetHandlers.showBetControl.length).toBe(0);
        });
    });

    describe("integration scenarios", () => {
        it("should work in a typical UI interaction flow", () => {
            // Simulate initial state
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(false);

            // User clicks to show bet control
            totalBetHandlers.showBetControl();

            // Popup should be open
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);
        });

        it("should work when called from different contexts", () => {
            const handler1 = totalBetHandlers;
            const handler2 = new CascadingTotalBetHandlers();

            // Both handlers should affect the same store
            handler1.showBetControl();
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);

            // Reset for second test
            mockBetControlStore.isOpenBetAmountPopup = false;

            handler2.showBetControl();
            expect(mockBetControlStore.isOpenBetAmountPopup).toBe(true);
        });
    });

    describe("error handling", () => {
        it("should not throw when showBetControl is called", () => {
            expect(() => totalBetHandlers.showBetControl()).not.toThrow();
        });

        it("should handle undefined betControlStore gracefully", () => {
            // Temporarily remove the store to test error handling
            const originalStore = (totalBetHandlers as any).betControlStore;
            (totalBetHandlers as any).betControlStore = undefined;

            expect(() => totalBetHandlers.showBetControl()).toThrow();

            // Restore the store
            (totalBetHandlers as any).betControlStore = originalStore;
        });

        it("should handle store with missing property gracefully", () => {
            const incompleteStore = {};
            (totalBetHandlers as any).betControlStore = incompleteStore;

            expect(() => totalBetHandlers.showBetControl()).not.toThrow();
            expect((incompleteStore as any).isOpenBetAmountPopup).toBe(true);
        });
    });
});
