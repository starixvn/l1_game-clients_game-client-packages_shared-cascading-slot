import { CascadingSlotState } from "../../assets/cascading-slot-state";
import { CascadingHoldActionHandlers } from "../../assets/handlers/cascading-hold-action-handlers";
import { CascadingUIHandler } from "../../assets/handlers/cascading-ui-handler";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";
import { CascadingUIStore } from "../../assets/stores/cascading-ui-store";
import { HoldActionStore } from "../../assets/stores/hold-action-store";

// Mock the dependencies
jest.mock("../../assets/stores/auto-play-store");
jest.mock("../../assets/stores/cascading-ui-store");
jest.mock("../../assets/stores/hold-action-store");
jest.mock("../../assets/handlers/cascading-ui-handler");

// Mock setTimeout and clearTimeout for testing
jest.useFakeTimers();

describe("CascadingHoldActionHandlers", () => {
    let handler: CascadingHoldActionHandlers;
    let mockHoldActionStore: jest.Mocked<HoldActionStore>;
    let mockCascadingUIStore: jest.Mocked<CascadingUIStore>;
    let mockCascadingUIHandler: jest.Mocked<CascadingUIHandler>;
    let mockAutoPlayStore: jest.Mocked<AutoPlayStore>;

    beforeEach(() => {
        // Reset all mocks and timers
        jest.clearAllMocks();
        jest.clearAllTimers();

        // Create mock instances
        mockHoldActionStore = {
            triggerAction: null,
            isHolding: false,
        } as any;

        mockCascadingUIStore = {
            cascadingState: CascadingSlotState.READY_BET,
            get disabledSpinButton() {
                return (
                    this.cascadingState === CascadingSlotState.SPINNING ||
                    this.cascadingState === CascadingSlotState.NOT_READY_BET ||
                    mockHoldActionStore.triggerAction
                );
            },
        } as any;

        mockCascadingUIHandler = {} as any;

        mockAutoPlayStore = {
            isAutoplay: false,
        } as any;

        // Create handler instance
        handler = new CascadingHoldActionHandlers();

        // Manually inject the mocked dependencies
        (handler as any).holdActionStore = mockHoldActionStore;
        (handler as any).cascadingUIStore = mockCascadingUIStore;
        (handler as any).cascadingUIHandler = mockCascadingUIHandler;
        (handler as any).autoPlayStore = mockAutoPlayStore;
    });

    afterEach(() => {
        jest.clearAllTimers();
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(CascadingHoldActionHandlers);
        });

        it("should have HOLDING_THRESHOLD constant set to 1000", () => {
            expect((handler as any).HOLDING_THRESHOLD).toBe(1000);
        });
    });

    describe("handle method", () => {
        it("should be implemented as empty function", () => {
            expect(() => handler.handle()).not.toThrow();
        });
    });

    describe("callTriggerAction method", () => {
        beforeEach(() => {
            mockHoldActionStore.triggerAction = null;
            mockAutoPlayStore.isAutoplay = false;
            mockCascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
        });

        it("should set triggerAction and start holding timeout when conditions are met", () => {
            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            expect((handler as any).timeoutHolding).toBeDefined();
        });

        it("should set isHolding to true after timeout", () => {
            handler.callTriggerAction();

            // Fast-forward time to trigger the timeout
            jest.advanceTimersByTime(1000);

            expect(mockHoldActionStore.isHolding).toBe(true);
        });

        it("should not trigger when triggerAction already exists", () => {
            mockHoldActionStore.triggerAction = {};

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            // No new timeout should be created
        });

        it("should not trigger when autoplay is active", () => {
            mockAutoPlayStore.isAutoplay = true;

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toBeNull();
        });

        it("should not trigger when cascading state is SPINNING", () => {
            mockCascadingUIStore.cascadingState = CascadingSlotState.SPINNING;

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toBeNull();
        });

        it("should not trigger when cascading state is NOT_READY_BET", () => {
            mockCascadingUIStore.cascadingState = CascadingSlotState.NOT_READY_BET;

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toBeNull();
        });

        it("should trigger when cascading state is SETTLED", () => {
            mockCascadingUIStore.cascadingState = CascadingSlotState.SETTLED;

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            expect((handler as any).timeoutHolding).toBeDefined();
        });

        it("should not trigger when spin button is disabled via triggerAction", () => {
            mockHoldActionStore.triggerAction = {}; // This disables the spin button

            handler.callTriggerAction();

            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            // No new timeout should be created
        });
    });

    describe("clearTriggerAction method", () => {
        beforeEach(() => {
            // Set up initial state with a timeout
            mockHoldActionStore.triggerAction = {};
            mockHoldActionStore.isHolding = true;
            (handler as any).timeoutHolding = setTimeout(() => {}, 1000);
        });

        it("should clear triggerAction and isHolding flags", () => {
            handler.clearTriggerAction();

            expect(mockHoldActionStore.triggerAction).toBeNull();
            expect(mockHoldActionStore.isHolding).toBe(false);
        });

        it("should clear the timeout when it exists", () => {
            const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

            handler.clearTriggerAction();

            expect(clearTimeoutSpy).toHaveBeenCalled();
        });

        it("should handle case when timeout does not exist", () => {
            (handler as any).timeoutHolding = null;
            const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

            expect(() => handler.clearTriggerAction()).not.toThrow();
            expect(clearTimeoutSpy).not.toHaveBeenCalled();
        });

        it("should handle case when timeout is undefined", () => {
            (handler as any).timeoutHolding = undefined;
            const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

            expect(() => handler.clearTriggerAction()).not.toThrow();
            expect(clearTimeoutSpy).not.toHaveBeenCalled();
        });
    });

    describe("integration scenarios", () => {
        it("should handle complete hold action workflow", () => {
            // Initial trigger
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            expect(mockHoldActionStore.isHolding).toBe(false);

            // Advance time to trigger holding state
            jest.advanceTimersByTime(1000);
            expect(mockHoldActionStore.isHolding).toBe(true);

            // Clear the action
            handler.clearTriggerAction();
            expect(mockHoldActionStore.triggerAction).toBeNull();
            expect(mockHoldActionStore.isHolding).toBe(false);
        });

        it("should handle interruption before holding timeout", () => {
            // Start the action
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toStrictEqual({});

            // Clear before timeout completes
            jest.advanceTimersByTime(500); // Only half the timeout
            handler.clearTriggerAction();

            // Complete the remaining time
            jest.advanceTimersByTime(500);

            // Should not be holding since it was cleared
            expect(mockHoldActionStore.isHolding).toBe(false);
            expect(mockHoldActionStore.triggerAction).toBeNull();
        });

        it("should handle multiple trigger attempts", () => {
            // First trigger
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toStrictEqual({});

            // Second trigger should not override
            const firstTimeout = (handler as any).timeoutHolding;
            handler.callTriggerAction();
            expect((handler as any).timeoutHolding).toBe(firstTimeout);

            // Clear and try again
            handler.clearTriggerAction();
            handler.callTriggerAction();
            expect((handler as any).timeoutHolding).toBeDefined();
        });

        it("should handle various cascading states correctly", () => {
            const validStates = [CascadingSlotState.READY_BET, CascadingSlotState.SETTLED];
            const invalidStates = [CascadingSlotState.SPINNING, CascadingSlotState.NOT_READY_BET];

            // Test valid states
            validStates.forEach((state) => {
                handler.clearTriggerAction(); // Reset
                mockCascadingUIStore.cascadingState = state;

                handler.callTriggerAction();
                expect(mockHoldActionStore.triggerAction).toStrictEqual({});
            });

            // Test invalid states
            invalidStates.forEach((state) => {
                handler.clearTriggerAction(); // Reset
                mockCascadingUIStore.cascadingState = state;

                handler.callTriggerAction();
                expect(mockHoldActionStore.triggerAction).toBeNull();
            });
        });

        it("should handle edge case combinations", () => {
            // Test: autoplay active + valid state
            mockAutoPlayStore.isAutoplay = true;
            mockCascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toBeNull();

            // Test: disabled button via SPINNING state + valid autoplay
            mockAutoPlayStore.isAutoplay = false;
            mockCascadingUIStore.cascadingState = CascadingSlotState.SPINNING;
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toBeNull();

            // Test: all conditions met
            mockCascadingUIStore.cascadingState = CascadingSlotState.READY_BET;
            handler.callTriggerAction();
            expect(mockHoldActionStore.triggerAction).toStrictEqual({});
        });
    });

    describe("timeout management", () => {
        it("should properly manage timeout references", () => {
            expect((handler as any).timeoutHolding).toBeUndefined();

            handler.callTriggerAction();
            expect((handler as any).timeoutHolding).toBeDefined();

            handler.clearTriggerAction();
            // Note: clearTimeout doesn't set the reference to null, but the timeout is cleared
        });

        it("should handle rapid trigger and clear cycles", () => {
            for (let i = 0; i < 5; i++) {
                handler.callTriggerAction();
                expect(mockHoldActionStore.triggerAction).toStrictEqual({});

                handler.clearTriggerAction();
                expect(mockHoldActionStore.triggerAction).toBeNull();
                expect(mockHoldActionStore.isHolding).toBe(false);
            }
        });
    });
});
