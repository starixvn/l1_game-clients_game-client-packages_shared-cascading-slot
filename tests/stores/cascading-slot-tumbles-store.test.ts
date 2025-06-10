import { Settlement, Tumble } from "../../assets/game-messages-cascading";
import { CascadingSlotTumblesStore } from "../../assets/stores/cascading-slot-tumbles-store";

describe("CascadingSlotTumblesStore", () => {
    let store: CascadingSlotTumblesStore;

    beforeEach(() => {
        store = new CascadingSlotTumblesStore();
    });

    describe("constructor", () => {
        it("should initialize with empty tumbles array", () => {
            expect(store.tumbles).toEqual([]);
        });

        it("should initialize with null tumble", () => {
            expect(store.tumble).toBeNull();
        });
    });

    describe("tumbles property", () => {
        it("should set tumbles correctly", () => {
            const mockTumbles: Tumble[] = [
                {
                    icons: { "1": { count: 3, win: 100 } },
                    win: 100,
                    settlement: {
                        explode: [1, 2, 3],
                        new: [4, 5, 6],
                    } as Settlement,
                    result: "win",
                    multipliers: [2, 3],
                },
                {
                    icons: { "2": { count: 2, win: 50 } },
                    win: 50,
                    settlement: {
                        explode: [7, 8],
                        new: [9, 10],
                    } as Settlement,
                    result: "win",
                    multipliers: [4],
                },
            ];

            store.tumbles = mockTumbles;
            expect(store.tumbles).toEqual(mockTumbles);
        });

        it("should get tumbles correctly", () => {
            const mockTumbles: Tumble[] = [
                {
                    icons: { "3": { count: 1, win: 25 } },
                    win: 25,
                    settlement: {
                        explode: [11],
                        new: [12],
                    } as Settlement,
                    result: "lose",
                    multipliers: [],
                },
            ];

            store.tumbles = mockTumbles;
            const retrievedTumbles = store.tumbles;
            expect(retrievedTumbles).toEqual(mockTumbles);
            expect(retrievedTumbles).toStrictEqual(mockTumbles); // Should be the same reference
        });

        it("should handle empty tumbles array", () => {
            store.tumbles = [];
            expect(store.tumbles).toEqual([]);
        });
    });

    describe("tumble property", () => {
        it("should be initially null", () => {
            expect(store.tumble).toBeNull();
        });

        it("should allow setting tumble to any value", () => {
            const mockTumble = {
                icons: { "5": { count: 4, win: 200 } },
                win: 200,
                settlement: {
                    explode: [15, 16, 17, 18],
                    new: [19, 20, 21, 22],
                } as Settlement,
                result: "big_win",
                multipliers: [5, 10],
            };

            store.tumble = mockTumble;
            expect(store.tumble).toEqual(mockTumble);
        });

        it("should allow setting tumble to null", () => {
            const mockTumble = { icons: {}, win: 0, settlement: { explode: [], new: [] }, result: "", multipliers: [] };
            store.tumble = mockTumble;
            expect(store.tumble).toEqual(mockTumble);

            store.tumble = null;
            expect(store.tumble).toBeNull();
        });
    });

    describe("isShowTumbleWinFrame computed property", () => {
        it("should return false when tumbles array is empty", () => {
            store.tumbles = [];
            expect(store.isShowTumbleWinFrame).toBe(false);
        });

        it("should return false when tumbles array has exactly 1 item", () => {
            const singleTumble: Tumble[] = [
                {
                    icons: { "1": { count: 1, win: 10 } },
                    win: 10,
                    settlement: {
                        explode: [1],
                        new: [2],
                    } as Settlement,
                    result: "small_win",
                    multipliers: [1],
                },
            ];

            store.tumbles = singleTumble;
            expect(store.isShowTumbleWinFrame).toBe(false);
        });

        it("should return true when tumbles array has more than 1 item", () => {
            const multipleTumbles: Tumble[] = [
                {
                    icons: { "1": { count: 2, win: 20 } },
                    win: 20,
                    settlement: {
                        explode: [1, 2],
                        new: [3, 4],
                    } as Settlement,
                    result: "win",
                    multipliers: [2],
                },
                {
                    icons: { "2": { count: 1, win: 10 } },
                    win: 10,
                    settlement: {
                        explode: [5],
                        new: [6],
                    } as Settlement,
                    result: "win",
                    multipliers: [1],
                },
            ];

            store.tumbles = multipleTumbles;
            expect(store.isShowTumbleWinFrame).toBe(true);
        });

        it("should return true when tumbles array has many items", () => {
            const manyTumbles: Tumble[] = Array.from({ length: 5 }, (_, index) => ({
                icons: { [`${index + 1}`]: { count: index + 1, win: (index + 1) * 10 } },
                win: (index + 1) * 10,
                settlement: {
                    explode: [index * 2],
                    new: [index * 2 + 1],
                } as Settlement,
                result: "win",
                multipliers: [index + 1],
            }));

            store.tumbles = manyTumbles;
            expect(store.isShowTumbleWinFrame).toBe(true);
        });

        it("should reactively update when tumbles change", () => {
            // Start with empty array
            store.tumbles = [];
            expect(store.isShowTumbleWinFrame).toBe(false);

            // Add one tumble
            store.tumbles = [
                {
                    icons: { "1": { count: 1, win: 5 } },
                    win: 5,
                    settlement: {
                        explode: [1],
                        new: [2],
                    } as Settlement,
                    result: "small_win",
                    multipliers: [],
                },
            ];
            expect(store.isShowTumbleWinFrame).toBe(false);

            // Add second tumble
            store.tumbles = [
                ...store.tumbles,
                {
                    icons: { "2": { count: 1, win: 5 } },
                    win: 5,
                    settlement: {
                        explode: [3],
                        new: [4],
                    } as Settlement,
                    result: "small_win",
                    multipliers: [],
                },
            ];
            expect(store.isShowTumbleWinFrame).toBe(true);

            // Remove one tumble (back to 1)
            store.tumbles = [store.tumbles[0]];
            expect(store.isShowTumbleWinFrame).toBe(false);
        });
    });
});
