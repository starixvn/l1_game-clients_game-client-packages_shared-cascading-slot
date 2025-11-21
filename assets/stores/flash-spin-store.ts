import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class FlashSpinStore {
    constructor() {

        mobx.makeAutoObservable(this);

    }

    public roundsList = [10, 30, 50, 80, 100, 200, 500, 1000];
    public isOpenFlashSpinPopup = false;
    public selectedRoundOnPopup = this.roundsList[0];
    public roundsFlashSpin = 0;

    public isFlashSpin = false;

    public triggerBet = null;

    public isClickFlashSpinToggle = false;

    get isTurnOnFlashSpin() {
        const result = this.isOpenFlashSpinPopup || this.isFlashSpin;
        return result;
    }
}
