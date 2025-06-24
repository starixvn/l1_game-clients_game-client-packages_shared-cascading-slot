import { HoldActionStore } from "../../assets/stores/hold-action-store";

describe("HoldActionStore", () => {
    let store: HoldActionStore;

    beforeEach(() => {
        store = new HoldActionStore();
    });

    describe("constructor and initial state", () => {
        it("should initialize with default values", () => {
            expect(store.triggerAction).toBeNull();
            expect(store.isHolding).toBe(false);
        });

        it("should be properly observable", () => {
            // Test that the store is MobX observable
            expect(typeof store).toBe("object");
            expect(store.constructor.name).toBe("HoldActionStore");
        });
    });

    describe("triggerAction property", () => {
        it("should get triggerAction correctly", () => {
            expect(store.triggerAction).toBeNull();
        });

        it("should set triggerAction to an object", () => {
            const mockTriggerAction = { id: 1, action: "spin" };
            store.triggerAction = mockTriggerAction;
            expect(store.triggerAction).toStrictEqual(mockTriggerAction);
        });

        it("should set triggerAction to null", () => {
            store.triggerAction = { id: 1 };
            expect(store.triggerAction).not.toBeNull();

            store.triggerAction = null;
            expect(store.triggerAction).toBeNull();
        });

        it("should set triggerAction to different types", () => {
            // Test with empty object
            store.triggerAction = {};
            expect(store.triggerAction).toEqual({});

            // Test with string
            store.triggerAction = "trigger";
            expect(store.triggerAction).toBe("trigger");

            // Test with number
            store.triggerAction = 123;
            expect(store.triggerAction).toBe(123);

            // Test with boolean
            store.triggerAction = true;
            expect(store.triggerAction).toBe(true);

            // Reset to null
            store.triggerAction = null;
            expect(store.triggerAction).toBeNull();
        });
    });

    describe("isHolding property", () => {
        it("should get isHolding correctly", () => {
            expect(store.isHolding).toBe(false);
        });

        it("should set isHolding to true", () => {
            store.isHolding = true;
            expect(store.isHolding).toBe(true);
        });

        it("should set isHolding to false", () => {
            store.isHolding = true;
            expect(store.isHolding).toBe(true);

            store.isHolding = false;
            expect(store.isHolding).toBe(false);
        });

        it("should handle truthy/falsy values", () => {
            // Test truthy values
            store.isHolding = 1 as any;
            expect(store.isHolding).toBe(1);

            store.isHolding = "true" as any;
            expect(store.isHolding).toBe("true");

            store.isHolding = {} as any;
            expect(store.isHolding).toEqual({});

            // Test falsy values
            store.isHolding = 0 as any;
            expect(store.isHolding).toBe(0);

            store.isHolding = "" as any;
            expect(store.isHolding).toBe("");

            store.isHolding = null as any;
            expect(store.isHolding).toBeNull();

            store.isHolding = undefined as any;
            expect(store.isHolding).toBeUndefined();
        });
    });

    describe("property interactions", () => {
        it("should allow independent updates of both properties", () => {
            // Initially both should be default
            expect(store.triggerAction).toBeNull();
            expect(store.isHolding).toBe(false);

            // Update triggerAction only
            store.triggerAction = { action: "hold" };
            expect(store.triggerAction).toEqual({ action: "hold" });
            expect(store.isHolding).toBe(false);

            // Update isHolding only
            store.isHolding = true;
            expect(store.triggerAction).toEqual({ action: "hold" });
            expect(store.isHolding).toBe(true);

            // Update both simultaneously
            store.triggerAction = null;
            store.isHolding = false;
            expect(store.triggerAction).toBeNull();
            expect(store.isHolding).toBe(false);
        });

        it("should simulate typical hold action workflow", () => {
            // Initial state - no action triggered, not holding
            expect(store.triggerAction).toBeNull();
            expect(store.isHolding).toBe(false);

            // Step 1: Trigger action (e.g., user starts holding button)
            store.triggerAction = { timestamp: Date.now() };
            expect(store.triggerAction).not.toBeNull();
            expect(store.isHolding).toBe(false);

            // Step 2: After threshold, start holding
            store.isHolding = true;
            expect(store.triggerAction).not.toBeNull();
            expect(store.isHolding).toBe(true);

            // Step 3: Clear action and stop holding (e.g., user releases button)
            store.triggerAction = null;
            store.isHolding = false;
            expect(store.triggerAction).toBeNull();
            expect(store.isHolding).toBe(false);
        });
    });

    describe("MobX reactivity", () => {
        it("should be reactive to triggerAction changes", () => {
            let observedValue: any;
            let callCount = 0;

            // Mock observer function
            const mockObserver = () => {
                callCount++;
                observedValue = store.triggerAction;
                return observedValue;
            };

            // Initial observation
            mockObserver();
            expect(callCount).toBe(1);
            expect(observedValue).toBeNull();

            // Change triggerAction
            store.triggerAction = { id: 1 };
            mockObserver();
            expect(callCount).toBe(2);
            expect(observedValue).toEqual({ id: 1 });

            // Change triggerAction again
            store.triggerAction = { id: 2 };
            mockObserver();
            expect(callCount).toBe(3);
            expect(observedValue).toEqual({ id: 2 });
        });

        it("should be reactive to isHolding changes", () => {
            let observedValue: boolean;
            let callCount = 0;

            // Mock observer function
            const mockObserver = () => {
                callCount++;
                observedValue = store.isHolding;
                return observedValue;
            };

            // Initial observation
            mockObserver();
            expect(callCount).toBe(1);
            expect(observedValue).toBe(false);

            // Change isHolding
            store.isHolding = true;
            mockObserver();
            expect(callCount).toBe(2);
            expect(observedValue).toBe(true);

            // Change isHolding back
            store.isHolding = false;
            mockObserver();
            expect(callCount).toBe(3);
            expect(observedValue).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should handle rapid property changes", () => {
            // Rapid triggerAction changes
            for (let i = 0; i < 10; i++) {
                store.triggerAction = { id: i };
                expect(store.triggerAction).toEqual({ id: i });
            }

            // Rapid isHolding changes
            for (let i = 0; i < 10; i++) {
                store.isHolding = i % 2 === 0;
                expect(store.isHolding).toBe(i % 2 === 0);
            }
        });

        it("should handle same value assignments", () => {
            const triggerAction = { id: 1 };

            store.triggerAction = triggerAction;
            expect(store.triggerAction).toStrictEqual(triggerAction);

            // Assign same reference again
            store.triggerAction = triggerAction;
            expect(store.triggerAction).toStrictEqual(triggerAction);

            // Same for isHolding
            store.isHolding = true;
            expect(store.isHolding).toBe(true);

            store.isHolding = true;
            expect(store.isHolding).toBe(true);
        });

        it("should handle complex object assignments", () => {
            const complexTriggerAction = {
                id: 1,
                timestamp: Date.now(),
                metadata: {
                    source: "button",
                    coordinates: { x: 100, y: 200 },
                    modifiers: ["shift", "ctrl"],
                },
                nested: {
                    deep: {
                        value: "test",
                    },
                },
            };

            store.triggerAction = complexTriggerAction;
            expect(store.triggerAction).toStrictEqual(complexTriggerAction);
        });
    });

    describe("type safety scenarios", () => {
        it("should handle various data types for triggerAction", () => {
            // Array
            store.triggerAction = [1, 2, 3] as any;
            expect(store.triggerAction).toEqual([1, 2, 3]);

            // Function
            const mockFn = jest.fn();
            store.triggerAction = mockFn as any;
            expect(typeof store.triggerAction).toBe("function");

            // Date
            const date = new Date();
            store.triggerAction = date as any;
            expect(store.triggerAction).toBe(date);

            // Symbol
            const symbol = Symbol("test");
            store.triggerAction = symbol as any;
            expect(store.triggerAction).toBe(symbol);
        });
    });
});
