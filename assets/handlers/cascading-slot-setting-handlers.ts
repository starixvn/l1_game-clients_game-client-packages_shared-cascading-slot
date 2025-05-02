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
                    if (trigger?.action === GameUserSettingAction.Save) {
                        this.saveTempStorage();
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
