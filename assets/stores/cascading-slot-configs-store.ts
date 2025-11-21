import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";

import { GameServiceMessageCascading } from "../game-messages-cascading";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotConfigsStore {
    private _gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg = null;
    private _trialUser: GameServiceMessageCascading.CascadingTrialUserMsg = null;

    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] constructor called", {
            willMakeAutoObservable: true,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] constructor completed", {
            autoObservableMade: true,
            initialState: {
                _gameConfigs: this._gameConfigs,
                _trialUser: this._trialUser,
                gameInfo: this.gameInfo
            },
            timestamp: new Date().toISOString()
        });
    }

    get gameConfigs() {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] get gameConfigs accessed", {
            hasGameConfigs: !!this._gameConfigs,
            timestamp: new Date().toISOString()
        });
        return this._gameConfigs;
    }

    set gameConfigs(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] set gameConfigs called", {
            gameConfigs,
            hasGameConfigs: !!gameConfigs,
            previousGameConfigs: !!this._gameConfigs,
            willUpdateGameConfigs: true,
            timestamp: new Date().toISOString()
        });

        this._gameConfigs = gameConfigs;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] gameConfigs set", {
            newGameConfigs: !!this._gameConfigs,
            gameConfigsSet: true,
            timestamp: new Date().toISOString()
        });
    }

    get trialUser() {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] get trialUser accessed", {
            hasTrialUser: !!this._trialUser,
            trialUserBalance: this._trialUser?.balance,
            timestamp: new Date().toISOString()
        });
        return this._trialUser;
    }

    set trialUser(user: GameServiceMessageCascading.CascadingTrialUserMsg) {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] set trialUser called", {
            user,
            hasUser: !!user,
            userBalance: user?.balance,
            previousTrialUser: !!this._trialUser,
            previousBalance: this._trialUser?.balance,
            willUpdateTrialUser: true,
            timestamp: new Date().toISOString()
        });

        this._trialUser = user;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_STORE] trialUser set", {
            newTrialUser: !!this._trialUser,
            newBalance: this._trialUser?.balance,
            trialUserSet: true,
            timestamp: new Date().toISOString()
        });
    }

    gameInfo: GameServiceMessageCascading.GameInfoMsg = null;
}
