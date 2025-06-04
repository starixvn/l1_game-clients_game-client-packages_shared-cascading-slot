import { Container } from "inversify";
import "reflect-metadata";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";

jest.mock("inversify", () => ({
    ...jest.requireActual("inversify"),
    injectable: () => (target: any) => target,
    inject: () => (target: any, propertyKey: string | symbol, parameterIndex: number) => {},
}));

jest.mock("mobx", () => ({
    makeAutoObservable: jest.fn(),
}));

describe("AutoPlayStore", () => {
    let container: Container;
    let autoPlayStore: AutoPlayStore;

    beforeEach(() => {
        container = new Container();

        container.bind(AutoPlayStore).toSelf();

        autoPlayStore = container.get(AutoPlayStore);

        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            expect(autoPlayStore.roundsList).toEqual([10, 30, 50, 80, 100, 200, 500, 1000]);
            expect(autoPlayStore.isOpenAutoplayPopup).toBe(false);
            expect(autoPlayStore.selectedRoundOnPopup).toBe(10);
            expect(autoPlayStore.roundsAutoplay).toBe(0);
            expect(autoPlayStore.isAutoplay).toBe(false);
            expect(autoPlayStore.triggerBet).toBeNull();
            expect(autoPlayStore.isClickAutoPlayToggle).toBe(false);
        });

        it("should call makeAutoObservable", () => {
            const mobx = require("mobx");

            expect(mobx.makeAutoObservable).toHaveBeenCalledWith(autoPlayStore);
        });

        it("should have selectedRoundOnPopup as first item from roundsList", () => {
            expect(autoPlayStore.selectedRoundOnPopup).toBe(autoPlayStore.roundsList[0]);
        });
    });

    describe("roundsList", () => {
        it("should contain exactly 8 predefined rounds", () => {
            expect(autoPlayStore.roundsList).toHaveLength(8);
            expect(autoPlayStore.roundsList).toContain(10);
            expect(autoPlayStore.roundsList).toContain(30);
            expect(autoPlayStore.roundsList).toContain(50);
            expect(autoPlayStore.roundsList).toContain(80);
            expect(autoPlayStore.roundsList).toContain(100);
            expect(autoPlayStore.roundsList).toContain(200);
            expect(autoPlayStore.roundsList).toContain(500);
            expect(autoPlayStore.roundsList).toContain(1000);
        });

        it("should have rounds in ascending order", () => {
            const sortedRounds = [...autoPlayStore.roundsList].sort((a, b) => a - b);

            expect(autoPlayStore.roundsList).toEqual(sortedRounds);
        });

        it("should be readonly array", () => {
            const originalLength = autoPlayStore.roundsList.length;

            expect(() => {
                (autoPlayStore.roundsList as any).push(2000);
            }).not.toThrow();

            const newStore = new AutoPlayStore();
            expect(newStore.roundsList).toHaveLength(originalLength);
        });
    });

    describe("isOpenAutoplayPopup", () => {
        it("should update isOpenAutoplayPopup to true", () => {
            autoPlayStore.isOpenAutoplayPopup = true;

            expect(autoPlayStore.isOpenAutoplayPopup).toBe(true);
        });

        it("should update isOpenAutoplayPopup to false", () => {
            autoPlayStore.isOpenAutoplayPopup = true;

            autoPlayStore.isOpenAutoplayPopup = false;

            expect(autoPlayStore.isOpenAutoplayPopup).toBe(false);
        });
    });

    describe("selectedRoundOnPopup", () => {
        it("should update selectedRoundOnPopup with valid round from list", () => {
            const selectedRound = 50;

            autoPlayStore.selectedRoundOnPopup = selectedRound;

            expect(autoPlayStore.selectedRoundOnPopup).toBe(selectedRound);
        });

        it("should update selectedRoundOnPopup with custom value not in roundsList", () => {
            const customRound = 999;

            autoPlayStore.selectedRoundOnPopup = customRound;

            expect(autoPlayStore.selectedRoundOnPopup).toBe(customRound);
        });

        it("should handle zero value", () => {
            autoPlayStore.selectedRoundOnPopup = 0;

            expect(autoPlayStore.selectedRoundOnPopup).toBe(0);
        });
    });

    describe("roundsAutoplay", () => {
        it("should update roundsAutoplay with positive value", () => {
            const rounds = 25;

            autoPlayStore.roundsAutoplay = rounds;

            expect(autoPlayStore.roundsAutoplay).toBe(rounds);
        });

        it("should handle zero roundsAutoplay", () => {
            autoPlayStore.roundsAutoplay = 0;

            expect(autoPlayStore.roundsAutoplay).toBe(0);
        });

        it("should handle negative roundsAutoplay", () => {
            const negativeRounds = -10;

            autoPlayStore.roundsAutoplay = negativeRounds;

            expect(autoPlayStore.roundsAutoplay).toBe(negativeRounds);
        });
    });

    describe("isAutoplay", () => {
        it("should update isAutoplay to true", () => {
            autoPlayStore.isAutoplay = true;

            expect(autoPlayStore.isAutoplay).toBe(true);
        });

        it("should update isAutoplay to false", () => {
            autoPlayStore.isAutoplay = true;

            autoPlayStore.isAutoplay = false;

            expect(autoPlayStore.isAutoplay).toBe(false);
        });
    });

    describe("triggerBet", () => {
        it("should update triggerBet with number value", () => {
            const triggerBet = 100;

            autoPlayStore.triggerBet = triggerBet;

            expect(autoPlayStore.triggerBet).toBe(triggerBet);
        });

        it("should handle null triggerBet", () => {
            autoPlayStore.triggerBet = 100;

            autoPlayStore.triggerBet = null;

            expect(autoPlayStore.triggerBet).toBeNull();
        });

        it("should handle different data types", () => {
            autoPlayStore.triggerBet = "50" as any;
            expect(autoPlayStore.triggerBet).toBe("50");

            autoPlayStore.triggerBet = undefined as any;
            expect(autoPlayStore.triggerBet).toBeUndefined();

            autoPlayStore.triggerBet = 75;
            expect(autoPlayStore.triggerBet).toBe(75);
        });
    });

    describe("isClickAutoPlayToggle", () => {
        it("should update isClickAutoPlayToggle to true", () => {
            autoPlayStore.isClickAutoPlayToggle = true;

            expect(autoPlayStore.isClickAutoPlayToggle).toBe(true);
        });

        it("should update isClickAutoPlayToggle to false", () => {
            autoPlayStore.isClickAutoPlayToggle = true;

            autoPlayStore.isClickAutoPlayToggle = false;

            expect(autoPlayStore.isClickAutoPlayToggle).toBe(false);
        });
    });

    describe("isTurnOnAutoPlay getter", () => {
        it("should return false when both isOpenAutoplayPopup and isAutoplay are false", () => {
            autoPlayStore.isOpenAutoplayPopup = false;
            autoPlayStore.isAutoplay = false;

            expect(autoPlayStore.isTurnOnAutoPlay).toBe(false);
        });

        it("should return true when isOpenAutoplayPopup is true and isAutoplay is false", () => {
            autoPlayStore.isOpenAutoplayPopup = true;
            autoPlayStore.isAutoplay = false;

            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });

        it("should return true when isOpenAutoplayPopup is false and isAutoplay is true", () => {
            autoPlayStore.isOpenAutoplayPopup = false;
            autoPlayStore.isAutoplay = true;

            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });

        it("should return true when both isOpenAutoplayPopup and isAutoplay are true", () => {
            autoPlayStore.isOpenAutoplayPopup = true;
            autoPlayStore.isAutoplay = true;

            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });
    });

    describe("state combinations", () => {
        it("should handle multiple property changes correctly", () => {
            autoPlayStore.isOpenAutoplayPopup = true;
            autoPlayStore.selectedRoundOnPopup = 100;
            autoPlayStore.roundsAutoplay = 50;
            autoPlayStore.isAutoplay = true;
            autoPlayStore.triggerBet = 25;
            autoPlayStore.isClickAutoPlayToggle = true;

            expect(autoPlayStore.isOpenAutoplayPopup).toBe(true);
            expect(autoPlayStore.selectedRoundOnPopup).toBe(100);
            expect(autoPlayStore.roundsAutoplay).toBe(50);
            expect(autoPlayStore.isAutoplay).toBe(true);
            expect(autoPlayStore.triggerBet).toBe(25);
            expect(autoPlayStore.isClickAutoPlayToggle).toBe(true);
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });

        it("should reset state correctly to defaults", () => {
            autoPlayStore.isOpenAutoplayPopup = true;
            autoPlayStore.selectedRoundOnPopup = 200;
            autoPlayStore.roundsAutoplay = 75;
            autoPlayStore.isAutoplay = true;
            autoPlayStore.triggerBet = 50;
            autoPlayStore.isClickAutoPlayToggle = true;

            autoPlayStore.isOpenAutoplayPopup = false;
            autoPlayStore.selectedRoundOnPopup = autoPlayStore.roundsList[0];
            autoPlayStore.roundsAutoplay = 0;
            autoPlayStore.isAutoplay = false;
            autoPlayStore.triggerBet = null;
            autoPlayStore.isClickAutoPlayToggle = false;

            expect(autoPlayStore.isOpenAutoplayPopup).toBe(false);
            expect(autoPlayStore.selectedRoundOnPopup).toBe(10);
            expect(autoPlayStore.roundsAutoplay).toBe(0);
            expect(autoPlayStore.isAutoplay).toBe(false);
            expect(autoPlayStore.triggerBet).toBeNull();
            expect(autoPlayStore.isClickAutoPlayToggle).toBe(false);
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(false);
        });

        it("should maintain independent property states", () => {
            autoPlayStore.isOpenAutoplayPopup = true;
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
            expect(autoPlayStore.isAutoplay).toBe(false);

            autoPlayStore.isAutoplay = true;
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
            expect(autoPlayStore.isOpenAutoplayPopup).toBe(true);

            autoPlayStore.isOpenAutoplayPopup = false;
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
            expect(autoPlayStore.isAutoplay).toBe(true);

            expect(autoPlayStore.isOpenAutoplayPopup).toBe(false);
            expect(autoPlayStore.isAutoplay).toBe(true);
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });
    });

    describe("boundary conditions", () => {
        it("should handle maximum values for numeric properties", () => {
            const maxValue = Number.MAX_SAFE_INTEGER;

            autoPlayStore.selectedRoundOnPopup = maxValue;
            autoPlayStore.roundsAutoplay = maxValue;
            autoPlayStore.triggerBet = maxValue;

            expect(autoPlayStore.selectedRoundOnPopup).toBe(maxValue);
            expect(autoPlayStore.roundsAutoplay).toBe(maxValue);
            expect(autoPlayStore.triggerBet).toBe(maxValue);
        });

        it("should handle minimum values for numeric properties", () => {
            const minValue = Number.MIN_SAFE_INTEGER;

            autoPlayStore.selectedRoundOnPopup = minValue;
            autoPlayStore.roundsAutoplay = minValue;
            autoPlayStore.triggerBet = minValue;

            expect(autoPlayStore.selectedRoundOnPopup).toBe(minValue);
            expect(autoPlayStore.roundsAutoplay).toBe(minValue);
            expect(autoPlayStore.triggerBet).toBe(minValue);
        });
    });
});
