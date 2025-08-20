import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingAudioStore {
    private _stoppableSFXList = [];
    constructor() {
        mobx.makeAutoObservable(this);
    }

    get stoppableSFXList() {
        return this._stoppableSFXList;
    }

    set stoppableSFXList(stoppableSFXList: gc.Audios.AudioData[]) {
        this._stoppableSFXList = stoppableSFXList;
    }
}
