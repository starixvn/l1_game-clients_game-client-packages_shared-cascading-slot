import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import inversify from "inversify";
import { CascadingSlotTumblesHandlers } from "../../assets/handlers/cascading-slot-tumbles-handlers";

// Mock dependencies
jest.mock("@sg/game-client-base");
jest.mock("inversify");

// Mock store
const mockTumblesStore = {
    tumbles: null,
    tumble: null,
};

describe("CascadingSlotTumblesHandlers", () => {
    let tumblesHandlers: CascadingSlotTumblesHandlers;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Reset mock store
        mockTumblesStore.tumbles = null;
        mockTumblesStore.tumble = null;

        // Set mock store directly on the prototype
        (CascadingSlotTumblesHandlers.prototype as any).tumblesStore = mockTumblesStore;

        // Mock inversify decorators
        (inversify.injectable as jest.Mock) = jest.fn(() => (target: any) => target);
        (inversify.inject as jest.Mock) = jest.fn(() => (target: any, propertyKey: string) => {});

        tumblesHandlers = new CascadingSlotTumblesHandlers();
    });

    describe("constructor", () => {
        it("should create an instance with proper dependencies", () => {
            expect(tumblesHandlers).toBeInstanceOf(CascadingSlotTumblesHandlers);
            expect((tumblesHandlers as any).tumblesStore).toBeDefined();
        });

        it("should implement IHandler interface", () => {
            expect(typeof tumblesHandlers.handle).toBe("function");
        });
    });

    describe("handle", () => {
        it("should exist and be callable", () => {
            expect(() => tumblesHandlers.handle()).not.toThrow();
        });

        it("should not modify store when called", () => {
            const initialTumbles = mockTumblesStore.tumbles;
            const initialTumble = mockTumblesStore.tumble;

            tumblesHandlers.handle();

            expect(mockTumblesStore.tumbles).toBe(initialTumbles);
            expect(mockTumblesStore.tumble).toBe(initialTumble);
        });
    });

    describe("handleTumbles", () => {
        it("should set tumbles to store with array data", () => {
            const testTumbles = [
                { id: 1, type: "cascade", symbols: ["A", "B", "C"] },
                { id: 2, type: "collapse", symbols: ["X", "Y", "Z"] },
            ];

            tumblesHandlers.handleTumbles(testTumbles);

            expect(mockTumblesStore.tumbles).toBe(testTumbles);
        });

        it("should set tumbles to store with object data", () => {
            const testTumbles = {
                count: 3,
                sequence: ["first", "second", "third"],
                winAmount: 150,
            };

            tumblesHandlers.handleTumbles(testTumbles);

            expect(mockTumblesStore.tumbles).toBe(testTumbles);
        });

        it("should handle null tumbles", () => {
            tumblesHandlers.handleTumbles(null);

            expect(mockTumblesStore.tumbles).toBe(null);
        });

        it("should handle undefined tumbles", () => {
            tumblesHandlers.handleTumbles(undefined);

            expect(mockTumblesStore.tumbles).toBe(undefined);
        });

        it("should handle empty array tumbles", () => {
            const testTumbles = [];

            tumblesHandlers.handleTumbles(testTumbles);

            expect(mockTumblesStore.tumbles).toBe(testTumbles);
            expect(mockTumblesStore.tumbles).toHaveLength(0);
        });

        it("should handle empty object tumbles", () => {
            const testTumbles = {};

            tumblesHandlers.handleTumbles(testTumbles);

            expect(mockTumblesStore.tumbles).toBe(testTumbles);
        });

        it("should overwrite previous tumbles data", () => {
            const firstTumbles = [{ id: 1, type: "first" }];
            const secondTumbles = [{ id: 2, type: "second" }];

            tumblesHandlers.handleTumbles(firstTumbles);
            expect(mockTumblesStore.tumbles).toBe(firstTumbles);

            tumblesHandlers.handleTumbles(secondTumbles);
            expect(mockTumblesStore.tumbles).toBe(secondTumbles);
            expect(mockTumblesStore.tumbles).not.toBe(firstTumbles);
        });
    });

    describe("setTumble", () => {
        it("should set single tumble to store with object data", () => {
            const testTumble = {
                id: 5,
                type: "win",
                multiplier: 2.5,
                symbols: ["WILD", "SCATTER"],
            };

            tumblesHandlers.setTumble(testTumble);

            expect(mockTumblesStore.tumble).toBe(testTumble);
        });

        it("should set single tumble to store with primitive data", () => {
            const testTumble = "single-tumble-id";

            tumblesHandlers.setTumble(testTumble);

            expect(mockTumblesStore.tumble).toBe(testTumble);
        });

        it("should handle null tumble", () => {
            tumblesHandlers.setTumble(null);

            expect(mockTumblesStore.tumble).toBe(null);
        });

        it("should handle undefined tumble", () => {
            tumblesHandlers.setTumble(undefined);

            expect(mockTumblesStore.tumble).toBe(undefined);
        });

        it("should handle number tumble", () => {
            const testTumble = 42;

            tumblesHandlers.setTumble(testTumble);

            expect(mockTumblesStore.tumble).toBe(testTumble);
        });

        it("should overwrite previous tumble data", () => {
            const firstTumble = { id: 1, type: "first" };
            const secondTumble = { id: 2, type: "second" };

            tumblesHandlers.setTumble(firstTumble);
            expect(mockTumblesStore.tumble).toBe(firstTumble);

            tumblesHandlers.setTumble(secondTumble);
            expect(mockTumblesStore.tumble).toBe(secondTumble);
            expect(mockTumblesStore.tumble).not.toBe(firstTumble);
        });
    });

    describe("store interaction", () => {
        it("should independently manage tumbles and tumble properties", () => {
            const testTumbles = [{ id: 1 }, { id: 2 }];
            const testTumble = { id: "single" };

            tumblesHandlers.handleTumbles(testTumbles);
            tumblesHandlers.setTumble(testTumble);

            expect(mockTumblesStore.tumbles).toBe(testTumbles);
            expect(mockTumblesStore.tumble).toBe(testTumble);
            expect(mockTumblesStore.tumbles).not.toBe(mockTumblesStore.tumble);
        });

        it("should not interfere with each other when setting values", () => {
            const initialTumbles = [{ id: "initial" }];
            const initialTumble = { id: "single-initial" };

            tumblesHandlers.handleTumbles(initialTumbles);
            tumblesHandlers.setTumble(initialTumble);

            // Set new tumbles, should not affect tumble
            const newTumbles = [{ id: "new" }];
            tumblesHandlers.handleTumbles(newTumbles);

            expect(mockTumblesStore.tumbles).toBe(newTumbles);
            expect(mockTumblesStore.tumble).toBe(initialTumble);

            // Set new tumble, should not affect tumbles
            const newTumble = { id: "new-single" };
            tumblesHandlers.setTumble(newTumble);

            expect(mockTumblesStore.tumbles).toBe(newTumbles);
            expect(mockTumblesStore.tumble).toBe(newTumble);
        });
    });

    describe("interface compliance", () => {
        it("should implement IHandler<void> interface", () => {
            expect(tumblesHandlers).toHaveProperty("handle");
            expect(typeof tumblesHandlers.handle).toBe("function");
        });

        it("should have handle method that accepts no parameters", () => {
            expect(tumblesHandlers.handle.length).toBe(0);
        });
    });
});
