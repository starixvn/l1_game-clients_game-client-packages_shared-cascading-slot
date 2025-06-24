import { Container } from "inversify";
import mobx from "mobx";
import "reflect-metadata";
import { AutoPlayStore } from "../../assets/stores/auto-play-store";

describe("AutoPlayStore", () => {
    let container: Container;
    let autoPlayStore: AutoPlayStore;

    beforeEach(() => {
        container = new Container();

        container.bind(AutoPlayStore).toSelf();

        autoPlayStore = container.get(AutoPlayStore);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct default values", () => {
            const freshStore = new AutoPlayStore();
            expect(freshStore.roundsList).toEqual([10, 30, 50, 80, 100, 200, 500, 1000]);
            expect(freshStore.isOpenAutoplayPopup).toBe(false);
            expect(freshStore.selectedRoundOnPopup).toBe(10);
            expect(freshStore.roundsAutoplay).toBe(0);
            expect(freshStore.isAutoplay).toBe(false);
            expect(freshStore.triggerBet).toBeNull();
            expect(freshStore.isClickAutoPlayToggle).toBe(false);
        });
    });

    describe("isTurnOnAutoPlay", () => {
        it("should be true if isOpenAutoplayPopup is true and isAutoplay is true", () => {
            mobx.runInAction(() => {
                autoPlayStore.isOpenAutoplayPopup = true;
                autoPlayStore.isAutoplay = true;
            });
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });
        it("should be true if isOpenAutoplayPopup is false or isAutoplay is false", () => {
            mobx.runInAction(() => {
                autoPlayStore.isOpenAutoplayPopup = true;
                autoPlayStore.isAutoplay = false;
            });
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(true);
        });
        it("should be false if isOpenAutoplayPopup is false and isAutoplay is false", () => {
            mobx.runInAction(() => {
                autoPlayStore.isOpenAutoplayPopup = false;
                autoPlayStore.isAutoplay = false;
            });
            expect(autoPlayStore.isTurnOnAutoPlay).toBe(false);
        });
    });
});
