import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { injectable, inject } = inversify;

@injectable()
export class TotalBetStore {
    _buttonStatus = true;
    _totalBet = 0;

    constructor() {
        cascadingSlotLogger.info("[TOTAL_BET_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[TOTAL_BET_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                _buttonStatus: this._buttonStatus,
                _totalBet: this._totalBet
            },
            timestamp: new Date().toISOString()
        });
    }

    set buttonStatus(status: boolean) {
        cascadingSlotLogger.info("[TOTAL_BET_STORE] set buttonStatus called", {
            status,
            previousButtonStatus: this._buttonStatus,
            willUpdateButtonStatus: true,
            timestamp: new Date().toISOString()
        });

        this._buttonStatus = status;

        cascadingSlotLogger.info("[TOTAL_BET_STORE] buttonStatus set", {
            newButtonStatus: this._buttonStatus,
            timestamp: new Date().toISOString()
        });
    }

    get buttonStatus() {
        cascadingSlotLogger.info("[TOTAL_BET_STORE] get buttonStatus accessed", {
            buttonStatus: this._buttonStatus,
            timestamp: new Date().toISOString()
        });
        return this._buttonStatus;
    }

    set totalBet(bet: number) {
        cascadingSlotLogger.info("[TOTAL_BET_STORE] set totalBet called", {
            bet,
            previousTotalBet: this._totalBet,
            willUpdateTotalBet: true,
            timestamp: new Date().toISOString()
        });

        this._totalBet = bet;

        cascadingSlotLogger.info("[TOTAL_BET_STORE] totalBet set", {
            newTotalBet: this._totalBet,
            timestamp: new Date().toISOString()
        });
    }

    get totalBet() {
        cascadingSlotLogger.info("[TOTAL_BET_STORE] get totalBet accessed", {
            totalBet: this._totalBet,
            timestamp: new Date().toISOString()
        });
        return this._totalBet;
    }
}
