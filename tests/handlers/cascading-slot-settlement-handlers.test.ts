import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import inversify from "inversify";
import { SlotNotification } from "../../assets/cascading-slot-utils";
import { GameServiceMessageCascading } from "../../assets/game-messages-cascading";
import { CascadingSlotSettlementHandlers } from "../../assets/handlers/cascading-slot-settlement-handlers";

// Mock dependencies
jest.mock("@sg/game-client-base");
jest.mock("inversify");

// Mock stores and handlers
const mockSettlementStore = {
    finishData: null,
};

const mockBoardHandler = {};
const mockTumblesHandler = {};
const mockTumblesStore = {};

const mockUiStore = {
    roundId: null,
};

const mockUiHandler = {
    handleBottomMessage: jest.fn(),
};

describe("CascadingSlotSettlementHandlers", () => {
    let settlementHandlers: CascadingSlotSettlementHandlers;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset mock stores
        mockSettlementStore.finishData = null;
        mockUiStore.roundId = null;

        // Set mock stores directly on the prototype
        (CascadingSlotSettlementHandlers.prototype as any).settlementStore = mockSettlementStore;
        (CascadingSlotSettlementHandlers.prototype as any).boardHandler = mockBoardHandler;
        (CascadingSlotSettlementHandlers.prototype as any).tumblesHandler = mockTumblesHandler;
        (CascadingSlotSettlementHandlers.prototype as any).tumblesStore = mockTumblesStore;
        (CascadingSlotSettlementHandlers.prototype as any).uiStore = mockUiStore;
        (CascadingSlotSettlementHandlers.prototype as any).uiHandler = mockUiHandler;

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        settlementHandlers = new CascadingSlotSettlementHandlers();
    });

    describe("constructor", () => {
        it("should create an instance with proper dependencies", () => {
            expect(settlementHandlers).toBeInstanceOf(CascadingSlotSettlementHandlers);
            expect((settlementHandlers as any).settlementStore).toBeDefined();
            expect((settlementHandlers as any).boardHandler).toBeDefined();
            expect((settlementHandlers as any).tumblesHandler).toBeDefined();
            expect((settlementHandlers as any).tumblesStore).toBeDefined();
            expect((settlementHandlers as any).uiStore).toBeDefined();
            expect((settlementHandlers as any).uiHandler).toBeDefined();
        });
    });

    describe("handleFinish", () => {
        it("should handle finish data correctly with roundId", () => {
            const testData = {
                roundId: "test-round-123",
                winAmount: 100,
                symbols: ["A", "B", "C"],
            };

            settlementHandlers.handleFinish(testData);

            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).toBe("test-round-123");
        });

        it("should handle finish data without roundId", () => {
            const testData = {
                winAmount: 50,
                symbols: ["X", "Y", "Z"],
            };

            settlementHandlers.handleFinish(testData);

            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).toBeUndefined();
        });

        it("should handle empty data", () => {
            const testData = {};

            settlementHandlers.handleFinish(testData);

            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).toBeUndefined();
        });

        it("should handle undefined roundId", () => {
            const testData = { winAmount: 25 };

            settlementHandlers.handleFinish(testData);

            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).toBeUndefined();
        });
    });

    describe("eventHandleList", () => {
        it("should have correct event configuration", () => {
            expect(settlementHandlers.eventHandleList).toBeDefined();
            expect(Array.isArray(settlementHandlers.eventHandleList)).toBe(true);
            expect(settlementHandlers.eventHandleList).toHaveLength(1);
        });

        it("should have CascadingSlotFinish event mapped correctly", () => {
            const eventConfig = settlementHandlers.eventHandleList[0];

            expect(eventConfig.name).toBe(GameServiceMessageCascading.CascadingSlotFinish.eventName);
            expect(eventConfig.handle).toBe(settlementHandlers.handleFinish);
        });

        it("should execute handleFinish when event is triggered", () => {
            const eventConfig = settlementHandlers.eventHandleList[0];
            const testData = { roundId: "event-test-123" };

            // Simulate event trigger by calling the handler directly
            eventConfig.handle.call(settlementHandlers, testData);

            // Verify the method executed by checking its effects
            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).toBe("event-test-123");
        });
    });

    describe("IMultipleHandlers interface", () => {
        it("should implement IMultipleHandlers interface", () => {
            // Check that the class has the required eventHandleList property
            expect(settlementHandlers.eventHandleList).toBeDefined();
            expect(typeof settlementHandlers.eventHandleList).toBe("object");

            // Verify each event handler has required properties
            settlementHandlers.eventHandleList.forEach((eventHandler) => {
                expect(eventHandler).toHaveProperty("name");
                expect(eventHandler).toHaveProperty("handle");
                expect(typeof eventHandler.name).toBe("string");
                expect(typeof eventHandler.handle).toBe("function");
            });
        });
    });

    describe("integration with stores", () => {
        it("should update stores correctly during handleFinish", () => {
            const initialFinishData = mockSettlementStore.finishData;
            const initialRoundId = mockUiStore.roundId;

            const testData = {
                roundId: "integration-test-456",
                playerBalance: 1000,
                winLines: [1, 2, 3],
            };

            settlementHandlers.handleFinish(testData);

            // Verify state changes
            expect(mockSettlementStore.finishData).not.toBe(initialFinishData);
            expect(mockSettlementStore.finishData).toBe(testData);
            expect(mockUiStore.roundId).not.toBe(initialRoundId);
            expect(mockUiStore.roundId).toBe("integration-test-456");
        });

        it("should call UI handler with correct notification", () => {
            const testData = { roundId: "ui-test-789" };

            settlementHandlers.handleFinish(testData);

            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledTimes(1);
            expect(mockUiHandler.handleBottomMessage).toHaveBeenCalledWith(SlotNotification.SPINNING);
        });
    });
});
