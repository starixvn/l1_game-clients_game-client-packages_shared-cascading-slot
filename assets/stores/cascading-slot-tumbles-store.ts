import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { Tumble } from "../game-messages-cascading";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesStore {
    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                _tumbles: this._tumbles,
                tumble: this.tumble,
                isShowTumbleWinFrame: this.isShowTumbleWinFrame
            },
            timestamp: new Date().toISOString()
        });
    }
    private _tumbles = [];
    public tumble = null;
    public isShowTumbleWinFrame = false;

    set tumbles(tumbles: Tumble[]) {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_STORE] set tumbles called", {
            tumbles,
            previousTumblesLength: this._tumbles.length,
            newTumblesLength: tumbles?.length,
            willUpdateTumbles: true,
            timestamp: new Date().toISOString()
        });

        this._tumbles = tumbles;

        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_STORE] tumbles set", {
            newTumblesLength: this._tumbles.length,
            tumblesSet: true,
            timestamp: new Date().toISOString()
        });
    }

    get tumbles() {
        cascadingSlotLogger.info("[CASCADING_SLOT_TUMBLES_STORE] get tumbles accessed", {
            tumblesLength: this._tumbles.length,
            hasTumbles: this._tumbles.length > 0,
            timestamp: new Date().toISOString()
        });
        return this._tumbles;
    }
}
