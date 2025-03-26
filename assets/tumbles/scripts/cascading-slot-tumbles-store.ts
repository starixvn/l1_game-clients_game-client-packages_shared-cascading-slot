import inversify from "inversify";
import { Tumble } from "../../game-messages-cascading";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotTumblesStore {
    private _tumbles = [];

    set tumbles(tumbles: Tumble[]) {
        this._tumbles = tumbles;
    }

    get tumbles() {
        return this._tumbles;
    }
}
