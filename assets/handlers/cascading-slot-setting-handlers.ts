import inversify from "inversify";

import gc from "@sg/game-client-base";
import mobx from "mobx";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
const { injectable, inject } = inversify;

const { GameUserSettingAction } = gc.GameUserSettings;
const { StorageManager, localStorageKeys } = gc;

interface IGameUserSetting {
    trialMode: boolean;
    turboMode: boolean;
    lastBetSetting: { betLevel: number; coinValue: number };
}

@injectable()
export class CascadingSlotSettingHandlers {
    @inject(gc.GameUserSettings.GameUserSettingStore) protected readonly gameUserSettingStore: gc.GameUserSettings.GameUserSettingStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    constructor() {
        setTimeout(() => {
            this.loadTempStorage();
            mobx.reaction(
                () => this.gameUserSettingStore.tempStorage,
                (trigger) => {
                    switch (trigger?.action) {
                        case GameUserSettingAction.Save:
                            this.saveTempStorage();
                            break;
                        case GameUserSettingAction.Load:
                            this.loadTempStorage();
                            break;
                    }
                }
            );
        }, 0);
    }

    loadTempStorage() {
        const data = StorageManager.get(localStorageKeys.gameUserSetting) as IGameUserSetting;
        if (data) {
            this.cascadingUIStore.isTrialMode = data.trialMode;
            this.cascadingUIStore.isTurboModeUI = data.turboMode;
            this.betControlStore.lastSetting = data.lastBetSetting;
        } else {
            this.cascadingUIStore.isTrialMode = false;
            this.cascadingUIStore.isTurboModeUI = false;
            this.betControlStore.lastSetting = null;
        }
    }

    saveTempStorage() {
        const currentSetting = {
            trialMode: this.cascadingUIStore.isTrialMode,
            turboMode: this.cascadingUIStore.isTurboModeUI,
            lastBetSetting: this.betControlStore.needClearLastSetting
                ? null
                : {
                      betLevel: this.betControlStore.betLevel,
                      coinValue: this.betControlStore.coinValue,
                  },
        };
        this.betControlStore.needClearLastSetting = false;
        StorageManager.set(localStorageKeys.gameUserSetting, currentSetting);
    }
}
