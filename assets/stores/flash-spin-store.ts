import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class FlashSpinStore {
    constructor() {
        cascadingSlotLogger.info("[FLASH_SPIN_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[FLASH_SPIN_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                roundsList: this.roundsList,
                isOpenFlashSpinPopup: this.isOpenFlashSpinPopup,
                selectedRoundOnPopup: this.selectedRoundOnPopup,
                roundsFlashSpin: this.roundsFlashSpin,
                isFlashSpin: this.isFlashSpin,
                triggerBet: this.triggerBet,
                isClickFlashSpinToggle: this.isClickFlashSpinToggle
            },
            timestamp: new Date().toISOString()
        });
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
        cascadingSlotLogger.info("[FLASH_SPIN_STORE] get isTurnOnFlashSpin accessed", {
            isOpenFlashSpinPopup: this.isOpenFlashSpinPopup,
            isFlashSpin: this.isFlashSpin,
            result,
            logic: "isOpenFlashSpinPopup || isFlashSpin",
            timestamp: new Date().toISOString()
        });
        return result;
    }
}
