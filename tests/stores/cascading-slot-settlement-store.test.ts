import gc from "@sg/game-client-base";
import { Container } from "inversify";
import "reflect-metadata";
import { GameServiceMessageCascading } from "../../assets/game-messages-cascading";
import { CascadingSlotSettlementStore } from "../../assets/stores/cascading-slot-settlement-store";

// Mock MainPlayerStore
const mockMainPlayerStore = {
    xMode: 1,
};

jest.mock("@sg/game-client-base", () => ({
    Player: {
        MainPlayerStore: jest.fn(() => mockMainPlayerStore),
    },
}));

describe("CascadingSlotSettlementStore", () => {
    let container: Container;
    let settlementStore: CascadingSlotSettlementStore;

    beforeEach(() => {
        container = new Container();
        container.bind(gc.Player.MainPlayerStore).toConstantValue(mockMainPlayerStore as any);
        container.bind(CascadingSlotSettlementStore).toSelf();
        settlementStore = container.get(CascadingSlotSettlementStore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            const freshStore = new CascadingSlotSettlementStore();

            expect(freshStore.finishData).toBeNull();
        });
    });

    describe("finishData property", () => {
        let mockFinishData: GameServiceMessageCascading.CascadingSlotFinish;

        beforeEach(() => {
            mockFinishData = {
                roundId: 12345,
                result: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                multiplier: 2.5,
                totalMultiplier: 5.0,
                actualBetwin: 150.75,
                win: 300.0,
                bigWin: true,
                totalFreeSpins: 10,
                freeSpins: 3,
                isFreeSpin: true,
                tumbles: [
                    {
                        icons: { "1": [1, 2, 3], "2": [4, 5] },
                        win: 100.0,
                        settlement: {
                            explode: [1, 2, 3, 4, 5],
                            new: [6, 7, 8, 9, 10],
                        },
                        result: "6,7,8,9,10,1,2,3,4,5,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [1, 2, 1, 1, 3],
                    },
                ],
                m: [1, 2, 1, 1, 3, 1, 1, 1, 1, 1],
                reachMaxWin: false,
            };
        });

        it("should get finishData correctly", () => {
            settlementStore.finishData = mockFinishData;

            expect(settlementStore.finishData).toStrictEqual(mockFinishData);
        });

        it("should set finishData correctly", () => {
            settlementStore.finishData = mockFinishData;

            expect(settlementStore.finishData).toStrictEqual(mockFinishData);
            expect(settlementStore.finishData.roundId).toBe(12345);
            expect(settlementStore.finishData.result).toBe(
                "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30"
            );
            expect(settlementStore.finishData.multiplier).toBe(2.5);
            expect(settlementStore.finishData.totalMultiplier).toBe(5.0);
            expect(settlementStore.finishData.actualBetwin).toBe(150.75);
            expect(settlementStore.finishData.win).toBe(300.0);
            expect(settlementStore.finishData.bigWin).toBe(true);
            expect(settlementStore.finishData.totalFreeSpins).toBe(10);
            expect(settlementStore.finishData.freeSpins).toBe(3);
            expect(settlementStore.finishData.isFreeSpin).toBe(true);
            expect(settlementStore.finishData.reachMaxWin).toBe(false);
        });

        it("should handle null finishData", () => {
            settlementStore.finishData = null;

            expect(settlementStore.finishData).toBeNull();
        });

        it("should overwrite previous finishData when set again", () => {
            const firstData = { ...mockFinishData, roundId: 1111 };
            const secondData = { ...mockFinishData, roundId: 2222 };

            settlementStore.finishData = firstData;
            expect(settlementStore.finishData.roundId).toBe(1111);

            settlementStore.finishData = secondData;
            expect(settlementStore.finishData.roundId).toBe(2222);
        });

        it("should handle empty tumbles array", () => {
            const dataWithEmptyTumbles = {
                ...mockFinishData,
                tumbles: [],
            };

            settlementStore.finishData = dataWithEmptyTumbles;

            expect(settlementStore.finishData.tumbles).toEqual([]);
        });

        it("should handle multiple tumbles", () => {
            const multiTumbleData = {
                ...mockFinishData,
                tumbles: [
                    {
                        icons: { "1": [1, 2] },
                        win: 50.0,
                        settlement: { explode: [1, 2], new: [6, 7] },
                        result: "6,7,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [1, 1],
                    },
                    {
                        icons: { "2": [3, 4, 5] },
                        win: 75.0,
                        settlement: { explode: [3, 4, 5], new: [8, 9, 10] },
                        result: "6,7,8,9,10,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [2, 2, 2],
                    },
                ],
            };

            settlementStore.finishData = multiTumbleData;

            expect(settlementStore.finishData.tumbles).toHaveLength(2);
            expect(settlementStore.finishData.tumbles[0].win).toBe(50.0);
            expect(settlementStore.finishData.tumbles[1].win).toBe(75.0);
        });

        it("should handle zero win amounts", () => {
            const zeroWinData = {
                ...mockFinishData,
                actualBetwin: 0,
                win: 0,
                bigWin: false,
                tumbles: [
                    {
                        icons: {},
                        win: 0,
                        settlement: { explode: [], new: [] },
                        result: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [],
                    },
                ],
            };

            settlementStore.finishData = zeroWinData;

            expect(settlementStore.finishData.actualBetwin).toBe(0);
            expect(settlementStore.finishData.win).toBe(0);
            expect(settlementStore.finishData.bigWin).toBe(false);
            expect(settlementStore.finishData.tumbles[0].win).toBe(0);
        });

        it("should handle free spin scenarios", () => {
            const freeSpinData = {
                ...mockFinishData,
                totalFreeSpins: 15,
                freeSpins: 5,
                isFreeSpin: true,
            };

            settlementStore.finishData = freeSpinData;

            expect(settlementStore.finishData.totalFreeSpins).toBe(15);
            expect(settlementStore.finishData.freeSpins).toBe(5);
            expect(settlementStore.finishData.isFreeSpin).toBe(true);
        });

        it("should handle non-free spin scenarios", () => {
            const normalSpinData = {
                ...mockFinishData,
                totalFreeSpins: 0,
                freeSpins: 0,
                isFreeSpin: false,
            };

            settlementStore.finishData = normalSpinData;

            expect(settlementStore.finishData.totalFreeSpins).toBe(0);
            expect(settlementStore.finishData.freeSpins).toBe(0);
            expect(settlementStore.finishData.isFreeSpin).toBe(false);
        });

        it("should handle max win scenarios", () => {
            const maxWinData = {
                ...mockFinishData,
                reachMaxWin: true,
                win: 1000000,
                actualBetwin: 1000000,
            };

            settlementStore.finishData = maxWinData;

            expect(settlementStore.finishData.reachMaxWin).toBe(true);
            expect(settlementStore.finishData.win).toBe(1000000);
            expect(settlementStore.finishData.actualBetwin).toBe(1000000);
        });

        it("should handle complex multiplier arrays", () => {
            const complexMultiplierData = {
                ...mockFinishData,
                m: [1, 2, 3, 4, 5, 2, 1, 3, 2, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                totalMultiplier: 15.0,
                tumbles: [
                    {
                        icons: { "1": [1, 2, 3] },
                        win: 200.0,
                        settlement: { explode: [1, 2, 3], new: [4, 5, 6] },
                        result: "4,5,6,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [2, 3, 4, 5, 2],
                    },
                ],
            };

            settlementStore.finishData = complexMultiplierData;

            expect(settlementStore.finishData.m).toEqual([
                1, 2, 3, 4, 5, 2, 1, 3, 2, 4, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
            ]);
            expect(settlementStore.finishData.totalMultiplier).toBe(15.0);
            expect(settlementStore.finishData.tumbles[0].multipliers).toEqual([2, 3, 4, 5, 2]);
        });
    });

    describe("settlement data scenarios", () => {
        it("should handle winning round with cascades", () => {
            const cascadeWinData = {
                roundId: 98765,
                result: "9,9,9,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                multiplier: 3.0,
                totalMultiplier: 9.0,
                actualBetwin: 450.0,
                win: 450.0,
                bigWin: true,
                totalFreeSpins: 0,
                freeSpins: 0,
                isFreeSpin: false,
                tumbles: [
                    {
                        icons: { "9": [0, 1, 2] },
                        win: 150.0,
                        settlement: { explode: [0, 1, 2], new: [11, 12, 13] },
                        result: "11,12,13,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [3, 3, 3],
                    },
                    {
                        icons: { "11": [0, 10, 20] },
                        win: 300.0,
                        settlement: { explode: [0, 10, 20], new: [14, 15, 16] },
                        result: "14,12,13,4,5,6,7,8,9,15,11,12,13,14,15,16,17,18,19,16,21,22,23,24,25,26,27,28,29,30",
                        multipliers: [3, 3, 3],
                    },
                ],
                m: [3, 3, 3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                reachMaxWin: false,
            };

            settlementStore.finishData = cascadeWinData;

            expect(settlementStore.finishData.roundId).toBe(98765);
            expect(settlementStore.finishData.bigWin).toBe(true);
            expect(settlementStore.finishData.tumbles).toHaveLength(2);
            expect(settlementStore.finishData.actualBetwin).toBe(450.0);
        });

        it("should handle losing round with no cascades", () => {
            const losingData = {
                roundId: 11111,
                result: "1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30",
                multiplier: 0,
                totalMultiplier: 0,
                actualBetwin: 0,
                win: 0,
                bigWin: false,
                totalFreeSpins: 0,
                freeSpins: 0,
                isFreeSpin: false,
                tumbles: [],
                m: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                reachMaxWin: false,
            };

            settlementStore.finishData = losingData;

            expect(settlementStore.finishData.win).toBe(0);
            expect(settlementStore.finishData.bigWin).toBe(false);
            expect(settlementStore.finishData.tumbles).toEqual([]);
            expect(settlementStore.finishData.multiplier).toBe(0);
        });
    });
});
