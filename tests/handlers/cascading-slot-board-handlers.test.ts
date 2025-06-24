import { SymbolBoard } from "../../assets/cascading-slot-utils";
import { CascadingSlotBoardHandlers } from "../../assets/handlers/cascading-slot-board-handlers";
import { CascadingSlotBoardStore } from "../../assets/stores/cascading-slot-board-store";

// Mock the dependencies
jest.mock("../../assets/stores/cascading-slot-board-store");

describe("CascadingSlotBoardHandlers", () => {
    let handler: CascadingSlotBoardHandlers;
    let mockBoardStore: jest.Mocked<CascadingSlotBoardStore>;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create mock instances
        mockBoardStore = {
            symbolsBoard: null,
        } as any;

        // Create handler instance
        handler = new CascadingSlotBoardHandlers();

        // Manually inject the mocked dependencies
        (handler as any).boardStore = mockBoardStore;
    });

    describe("constructor and initialization", () => {
        it("should initialize properly", () => {
            expect(handler).toBeInstanceOf(CascadingSlotBoardHandlers);
        });
    });

    describe("handle method", () => {
        it("should be implemented as empty function", () => {
            expect(() => handler.handle()).not.toThrow();
        });
    });

    describe("handleResult method", () => {
        it("should set symbols board with complete data", () => {
            const mockData: SymbolBoard = {
                symbols: [
                    [1, 2, 3, 4, 5],
                    [6, 7, 8, 9, 0],
                    [2, 4, 6, 8, 1],
                    [3, 5, 7, 9, 2],
                    [4, 6, 8, 0, 3],
                ],
                multipliers: [2, 3, 5, 10],
                tumbles: [
                    {
                        icons: { "1": { win: 100 } },
                        win: 100,
                        settlement: {
                            explode: [1, 0, 2, 1],
                            new: [0, 5, 1, 6],
                        },
                        result: "test-result",
                        multipliers: [2, 3],
                    },
                ],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: mockData.symbols,
                multipliers: mockData.multipliers,
                tumbles: mockData.tumbles,
            });
        });

        it("should handle empty symbols array", () => {
            const mockData: SymbolBoard = {
                symbols: [],
                multipliers: [],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [],
                multipliers: [],
                tumbles: [],
            });
        });

        it("should handle symbols with different dimensions", () => {
            const mockData: SymbolBoard = {
                symbols: [[1, 2], [3, 4, 5], [6]],
                multipliers: [1, 2, 3],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [[1, 2], [3, 4, 5], [6]],
                multipliers: [1, 2, 3],
                tumbles: [],
            });
        });

        it("should handle large multiplier values", () => {
            const mockData: SymbolBoard = {
                symbols: [[1, 2, 3]],
                multipliers: [100, 500, 1000, 2500],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [[1, 2, 3]],
                multipliers: [100, 500, 1000, 2500],
                tumbles: [],
            });
        });

        it("should handle complex tumbles data", () => {
            const mockData: SymbolBoard = {
                symbols: [[1, 2, 3, 4, 5]],
                multipliers: [2, 4],
                tumbles: [
                    {
                        icons: {
                            "1": { win: 50 },
                            "3": { win: 75 },
                            "5": { win: 100 },
                        },
                        win: 225,
                        settlement: {
                            explode: [0, 1, 2, 3, 4, 5],
                            new: [1, 6, 3, 7, 5, 8],
                        },
                        result: "test-result-1",
                        multipliers: [2, 4, 6],
                    },
                    {
                        icons: {
                            "2": { win: 25 },
                            "4": { win: 150 },
                        },
                        win: 175,
                        settlement: {
                            explode: [1, 2, 3, 4],
                            new: [2, 9, 4, 0],
                        },
                        result: "test-result-2",
                        multipliers: [3, 6],
                    },
                ],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: mockData.symbols,
                multipliers: mockData.multipliers,
                tumbles: mockData.tumbles,
            });
        });

        it("should handle special symbol values", () => {
            const mockData: SymbolBoard = {
                symbols: [
                    [9, 10, 11, 12], // Special symbols: SCATTER, MULTIPLIER, FREESPIN, BONUS
                    [0, 1, 2, 3], // Normal symbols
                    [8, 7, 6, 5], // Normal symbols
                ],
                multipliers: [1, 2, 3, 4, 5],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: mockData.symbols,
                multipliers: mockData.multipliers,
                tumbles: mockData.tumbles,
            });
        });

        it("should preserve original data structure integrity", () => {
            const originalData: SymbolBoard = {
                symbols: [
                    [1, 2],
                    [3, 4],
                ],
                multipliers: [2, 3],
                tumbles: [
                    {
                        icons: { "1": { win: 50 } },
                        win: 50,
                        settlement: { explode: [0, 1], new: [1, 5] },
                        result: "test-result-3",
                        multipliers: [2],
                    },
                ],
            };

            const mockData = JSON.parse(JSON.stringify(originalData)); // Deep copy

            handler.handleResult(mockData);

            // Modify the original data to ensure no reference is kept
            originalData.symbols[0][0] = 999;
            originalData.multipliers[0] = 999;
            originalData.tumbles[0].win = 999;

            // The stored data should not be affected
            expect(mockBoardStore.symbolsBoard.symbols[0][0]).toBe(1);
            expect(mockBoardStore.symbolsBoard.multipliers[0]).toBe(2);
            expect(mockBoardStore.symbolsBoard.tumbles[0].win).toBe(50);
        });

        it("should handle zero values in all fields", () => {
            const mockData: SymbolBoard = {
                symbols: [[0, 0, 0]],
                multipliers: [0, 0, 0],
                tumbles: [
                    {
                        icons: { "0": { win: 0 } },
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "test-result-zero",
                        multipliers: [0],
                    },
                ],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [[0, 0, 0]],
                multipliers: [0, 0, 0],
                tumbles: [
                    {
                        icons: { "0": { win: 0 } },
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "test-result-zero",
                        multipliers: [0],
                    },
                ],
            });
        });
    });

    describe("data validation scenarios", () => {
        it("should handle null symbols gracefully", () => {
            const mockData: SymbolBoard = {
                symbols: null as any,
                multipliers: [1, 2, 3],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: null,
                multipliers: [1, 2, 3],
                tumbles: [],
            });
        });

        it("should handle undefined multipliers gracefully", () => {
            const mockData: SymbolBoard = {
                symbols: [[1, 2, 3]],
                multipliers: undefined as any,
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [[1, 2, 3]],
                multipliers: undefined,
                tumbles: [],
            });
        });

        it("should handle mixed data types in symbols", () => {
            const mockData: SymbolBoard = {
                symbols: [
                    [1, 2.5, 3],
                    [0, -1, 10],
                ] as any,
                multipliers: [1, 2],
                tumbles: [],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [
                    [1, 2.5, 3],
                    [0, -1, 10],
                ],
                multipliers: [1, 2],
                tumbles: [],
            });
        });

        it("should handle zero values in all fields", () => {
            const mockData: SymbolBoard = {
                symbols: [[0, 0, 0]],
                multipliers: [0, 0, 0],
                tumbles: [
                    {
                        icons: { "0": { win: 0 } },
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "test-result-zero",
                        multipliers: [0],
                    },
                ],
            };

            handler.handleResult(mockData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual({
                symbols: [[0, 0, 0]],
                multipliers: [0, 0, 0],
                tumbles: [
                    {
                        icons: { "0": { win: 0 } },
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "test-result-zero",
                        multipliers: [0],
                    },
                ],
            });
        });
    });

    describe("integration scenarios", () => {
        it("should handle typical game round data", () => {
            const gameRoundData: SymbolBoard = {
                symbols: [
                    [3, 7, 1, 8, 2],
                    [9, 4, 6, 0, 5],
                    [2, 8, 3, 7, 1],
                    [5, 0, 9, 4, 6],
                    [8, 3, 7, 1, 2],
                ],
                multipliers: [2, 3, 5, 8, 10],
                tumbles: [
                    {
                        icons: {
                            "3": { win: 40 },
                            "7": { win: 60 },
                            "8": { win: 80 },
                        },
                        win: 180,
                        settlement: {
                            explode: [0, 0, 0, 1, 2, 4],
                            new: [0, 4, 1, 9, 4, 3],
                        },
                        result: "game-round-result",
                        multipliers: [2, 3, 5],
                    },
                ],
            };

            handler.handleResult(gameRoundData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual(gameRoundData);
        });

        it("should handle sequential calls with different data", () => {
            const firstData: SymbolBoard = {
                symbols: [[1, 2, 3]],
                multipliers: [2],
                tumbles: [],
            };

            const secondData: SymbolBoard = {
                symbols: [
                    [4, 5, 6],
                    [7, 8, 9],
                ],
                multipliers: [3, 4],
                tumbles: [
                    {
                        icons: { "4": { win: 20 } },
                        win: 20,
                        settlement: { explode: [0, 0], new: [0, 1] },
                        result: "second-tumble-result",
                        multipliers: [3],
                    },
                ],
            };

            // First call
            handler.handleResult(firstData);
            expect(mockBoardStore.symbolsBoard).toStrictEqual(firstData);

            // Second call should overwrite
            handler.handleResult(secondData);
            expect(mockBoardStore.symbolsBoard).toStrictEqual(secondData);
            expect(mockBoardStore.symbolsBoard).not.toStrictEqual(firstData);
        });

        it("should handle maximum realistic board size", () => {
            const maxBoardData: SymbolBoard = {
                symbols: Array(10)
                    .fill(null)
                    .map(() =>
                        Array(10)
                            .fill(0)
                            .map((_, i) => i % 13)
                    ),
                multipliers: Array(50)
                    .fill(0)
                    .map((_, i) => i + 1),
                tumbles: Array(20)
                    .fill(null)
                    .map((_, i) => ({
                        icons: { [i]: { win: i * 10 } },
                        win: i * 10,
                        settlement: {
                            explode: [i % 10, (i + 1) % 10],
                            new: [(i + 2) % 10, (i + 3) % 10],
                        },
                        result: `max-board-result-${i}`,
                        multipliers: [i + 1],
                    })),
            };

            handler.handleResult(maxBoardData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual(maxBoardData);
            expect(mockBoardStore.symbolsBoard.symbols).toHaveLength(10);
            expect(mockBoardStore.symbolsBoard.multipliers).toHaveLength(50);
            expect(mockBoardStore.symbolsBoard.tumbles).toHaveLength(20);
        });

        it("should handle rapid successive calls", () => {
            const rapidData = Array(100)
                .fill(null)
                .map((_, i) => ({
                    symbols: [[i % 10]],
                    multipliers: [i],
                    tumbles: [],
                }));

            rapidData.forEach((data, index) => {
                handler.handleResult(data);
                expect(mockBoardStore.symbolsBoard).toStrictEqual(data);
                expect(mockBoardStore.symbolsBoard.symbols[0][0]).toBe(index % 10);
                expect(mockBoardStore.symbolsBoard.multipliers[0]).toBe(index);
            });
        });
    });

    describe("edge cases", () => {
        it("should handle deeply nested tumbles structure", () => {
            const nestedData: SymbolBoard = {
                symbols: [[1, 2, 3]],
                multipliers: [1, 2, 3],
                tumbles: [
                    {
                        icons: {
                            "1": { win: 10 },
                            "2": { win: 20, bonus: { type: "free", count: 5 } },
                            "3": { win: 30, special: { multiplier: 2, extra: { value: 100 } } },
                        },
                        win: 60,
                        settlement: {
                            explode: [0, 0, 0, 1, 0, 2],
                            new: [1, 4, 1, 5, 1, 6],
                        },
                        result: "nested-result",
                        multipliers: [1, 2, 3],
                    },
                ],
            };

            handler.handleResult(nestedData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual(nestedData);
        });

        it("should handle empty objects and arrays", () => {
            const emptyData: SymbolBoard = {
                symbols: [[], [], []],
                multipliers: [],
                tumbles: [
                    {
                        icons: {},
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "empty-result",
                        multipliers: [],
                    },
                ],
            };

            handler.handleResult(emptyData);

            expect(mockBoardStore.symbolsBoard).toStrictEqual(emptyData);
        });
    });
});
