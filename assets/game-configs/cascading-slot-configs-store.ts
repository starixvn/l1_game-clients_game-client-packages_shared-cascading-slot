import inversify from "inversify";
import mobx from "mobx";
import { GameServiceMessageCascading } from "../game-messages-cascading";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotConfigsStore {
    private _gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = null;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    get gameConfigs() {
        return this._gameConfigs;
    }

    set gameConfigs(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        this._gameConfigs = gameConfigs;
    }
}
