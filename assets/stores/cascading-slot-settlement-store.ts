import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotSettlementStore {
    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                _finishData: this._finishData
            },
            timestamp: new Date().toISOString()
        });
    }
    private _finishData = null;

    get finishData() {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_STORE] get finishData accessed", {
            hasFinishData: !!this._finishData,
            finishDataType: typeof this._finishData,
            timestamp: new Date().toISOString()
        });
        return this._finishData;
    }

    set finishData(data: any) {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_STORE] set finishData called", {
            data,
            previousFinishData: this._finishData,
            hasData: !!data,
            dataType: typeof data,
            willUpdateFinishData: true,
            timestamp: new Date().toISOString()
        });

        this._finishData = data;

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTLEMENT_STORE] finishData set", {
            newFinishData: !!this._finishData,
            finishDataSet: true,
            timestamp: new Date().toISOString()
        });
    }
}
