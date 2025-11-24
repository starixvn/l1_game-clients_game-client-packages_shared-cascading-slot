import inversify from "inversify";

import gc from "@sg/game-client-base";
import mobx from "mobx";
import { GameSpeed } from "../cascading-slot-utils";
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
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(gc.App.AppStore) protected readonly appStore: gc.App.AppStore;
    constructor() {
        setTimeout(() => {
            mobx.when(
                () => this.mainPlayerStore.UID !== 0 && this.mainPlayerStore.currencyGroup !== "",
                () => {
                    mobx.reaction(
                        () => this.gameUserSettingStore.tempStorage,
                        (trigger) => {
                            this.reactionTempStorage(trigger);
                        }
                    );
                    if (this.appStore.isClearStorage) {
                        StorageManager.remove(this.getStorageKey());
                    }
                    this.loadTempStorage();
                    mobx.reaction(
                        () => this.appStore.isClearStorage,
                        () => {
                            StorageManager.remove(this.getStorageKey());
                            this.loadTempStorage();
                        }
                    );
                }
            );
        }, 0);
    }

    reactionTempStorage(trigger: gc.GameUserSettings.GameUserSettingTrigger) {
        switch (trigger?.action) {
            case GameUserSettingAction.Save:
                this.saveTempStorage();
                break;
            case GameUserSettingAction.Load:
                this.loadTempStorage();
                break;
        }
    }

    getStorageKey() {
        return `${localStorageKeys.gameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
    }

    loadTempStorage() {
        const data = StorageManager.get(this.getStorageKey()) as IGameUserSetting;
        if (data) {
            this.cascadingUIStore.isTrialMode = data.trialMode;
            this.cascadingUIStore.gameSpeed = data.turboMode ? GameSpeed.TURBO : GameSpeed.NORMAL;
            this.betControlStore.lastSetting = data.lastBetSetting;
        } else {
            this.cascadingUIStore.isTrialMode = false;
            this.cascadingUIStore.gameSpeed = GameSpeed.NORMAL;
            this.betControlStore.lastSetting = null;
        }
    }

    saveTempStorage() {
        const currentSetting = {
            trialMode: this.cascadingUIStore.isTrialMode,
            turboMode: this.cascadingUIStore.gameSpeed,
            lastBetSetting: this.betControlStore.needClearLastSetting
                ? null
                : {
                      betLevel: this.betControlStore.betLevel,
                      coinValue: this.betControlStore.coinValue,
                  },
        };
        this.betControlStore.needClearLastSetting = false;
        StorageManager.set(this.getStorageKey(), currentSetting);
    }
}
