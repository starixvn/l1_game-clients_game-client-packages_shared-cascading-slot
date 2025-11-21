import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class AutoPlayStore {
    constructor() {
        cascadingSlotLogger.info("[AUTO_PLAY_STORE] AutoPlayStore constructor called", {
            roundsList: this.roundsList,
            initialSelectedRoundOnPopup: this.selectedRoundOnPopup,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[AUTO_PLAY_STORE] MobX auto-observable setup completed", {
            timestamp: new Date().toISOString()
        });
    }

    public roundsList = [10, 30, 50, 80, 100, 200, 500, 1000];
    public isOpenAutoplayPopup = false;
    public selectedRoundOnPopup = this.roundsList[0];
    public roundsAutoplay = 0;

    public isAutoplay = false;

    public triggerBet = null;

    public isClickAutoPlayToggle = false;

    get isTurnOnAutoPlay() {
        const result = this.isOpenAutoplayPopup || this.isAutoplay;
        cascadingSlotLogger.info("[AUTO_PLAY_STORE] get isTurnOnAutoPlay accessed", {
            isOpenAutoplayPopup: this.isOpenAutoplayPopup,
            isAutoplay: this.isAutoplay,
            calculatedIsTurnOnAutoPlay: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }
}
