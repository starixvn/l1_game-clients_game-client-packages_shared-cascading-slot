import inversify from "inversify";

import gc from "@sg/game-client-base";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
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
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] constructor called", {
            hasGameUserSettingStore: !!this.gameUserSettingStore,
            hasMainPlayerStore: !!this.mainPlayerStore,
            hasCascadingUIStore: !!this.cascadingUIStore,
            hasBetControlStore: !!this.betControlStore,
            hasAppStore: !!this.appStore,
            willSetupMobXReactions: true,
            timeoutMs: 0,
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] setTimeout triggered - setting up MobX reactions", {
                timestamp: new Date().toISOString()
            });

            mobx.when(() => this.mainPlayerStore.UID !== 0 && this.mainPlayerStore.currencyGroup !== "", () => {
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] MobX when condition met", {
                    mainPlayerUID: this.mainPlayerStore.UID,
                    mainPlayerCurrencyGroup: this.mainPlayerStore.currencyGroup,
                    willSetupReactions: true,
                    timestamp: new Date().toISOString()
                });

                mobx.reaction(
                    () => this.gameUserSettingStore.tempStorage,
                    (trigger) => {
                        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] tempStorage reaction triggered", {
                            trigger,
                            willCallReactionTempStorage: true,
                            timestamp: new Date().toISOString()
                        });
                        this.reactionTempStorage(trigger);
                    }
                );
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] tempStorage reaction set up", {
                    timestamp: new Date().toISOString()
                });

                if (this.appStore.isClearStorage) {
                    cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Clearing storage", {
                        isClearStorage: this.appStore.isClearStorage,
                        willRemoveStorage: true,
                        timestamp: new Date().toISOString()
                    });
                    StorageManager.remove(this.getStorageKey());
                }

                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Loading temp storage", {
                    timestamp: new Date().toISOString()
                });
                this.loadTempStorage();

                mobx.reaction(() => this.appStore.isClearStorage, () => {
                    cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] isClearStorage reaction triggered", {
                        isClearStorage: this.appStore.isClearStorage,
                        willRemoveStorage: true,
                        willLoadTempStorage: true,
                        timestamp: new Date().toISOString()
                    });
                    StorageManager.remove(this.getStorageKey());
                    this.loadTempStorage();
                });
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] isClearStorage reaction set up", {
                    timestamp: new Date().toISOString()
                });
            });
        }, 0);

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] constructor completed", {
            timestamp: new Date().toISOString()
        });
    }

    reactionTempStorage(trigger: gc.GameUserSettings.GameUserSettingTrigger) {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] reactionTempStorage called", {
            trigger,
            triggerAction: trigger?.action,
            hasTrigger: !!trigger,
            willProcessAction: true,
            timestamp: new Date().toISOString()
        });

        switch (trigger?.action) {
            case GameUserSettingAction.Save:
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Processing Save action", {
                    action: trigger.action,
                    willCallSaveTempStorage: true,
                    timestamp: new Date().toISOString()
                });
                this.saveTempStorage();
                break;
            case GameUserSettingAction.Load:
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Processing Load action", {
                    action: trigger.action,
                    willCallLoadTempStorage: true,
                    timestamp: new Date().toISOString()
                });
                this.loadTempStorage();
                break;
            default:
                cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Unknown action, no processing", {
                    action: trigger?.action,
                    timestamp: new Date().toISOString()
                });
                break;
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] reactionTempStorage completed", {
            processedAction: trigger?.action,
            timestamp: new Date().toISOString()
        });
    }

    getStorageKey() {
        const storageKey = `${localStorageKeys.gameUserSetting}-${this.mainPlayerStore.UID}-${this.mainPlayerStore.currencyGroup}`;
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] getStorageKey called", {
            mainPlayerUID: this.mainPlayerStore.UID,
            mainPlayerCurrencyGroup: this.mainPlayerStore.currencyGroup,
            storageKey,
            willReturnStorageKey: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] getStorageKey returning", {
            storageKey,
            timestamp: new Date().toISOString()
        });

        return storageKey;
    }

    loadTempStorage() {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] loadTempStorage called", {
            willGetStorageData: true,
            willUpdateStores: true,
            timestamp: new Date().toISOString()
        });

        const storageKey = this.getStorageKey();
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Getting storage data", {
            storageKey,
            timestamp: new Date().toISOString()
        });

        const data = StorageManager.get(storageKey) as IGameUserSetting;
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Storage data retrieved", {
            hasData: !!data,
            data,
            timestamp: new Date().toISOString()
        });

        if (data) {
            cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Loading data from storage", {
                trialMode: data.trialMode,
                turboMode: data.turboMode,
                lastBetSetting: data.lastBetSetting,
                willUpdateUIStore: true,
                willUpdateBetControlStore: true,
                timestamp: new Date().toISOString()
            });

            this.cascadingUIStore.isTrialMode = data.trialMode;
            this.cascadingUIStore.isTurboModeUI = data.turboMode;
            this.betControlStore.lastSetting = data.lastBetSetting;

            cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Stores updated with loaded data", {
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] No data in storage, setting defaults", {
                willSetTrialModeFalse: true,
                willSetTurboModeFalse: true,
                willSetLastSettingNull: true,
                timestamp: new Date().toISOString()
            });

            this.cascadingUIStore.isTrialMode = false;
            this.cascadingUIStore.isTurboModeUI = false;
            this.betControlStore.lastSetting = null;

            cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Default values set", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] loadTempStorage completed", {
            dataLoaded: !!data,
            timestamp: new Date().toISOString()
        });
    }

    saveTempStorage() {
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] saveTempStorage called", {
            willCollectCurrentSettings: true,
            willSaveToStorage: true,
            timestamp: new Date().toISOString()
        });

        const needClearLastSetting = this.betControlStore.needClearLastSetting;
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Checking if need to clear last setting", {
            needClearLastSetting,
            currentBetLevel: this.betControlStore.betLevel,
            currentCoinValue: this.betControlStore.coinValue,
            timestamp: new Date().toISOString()
        });

        const currentSetting = {
            trialMode: this.cascadingUIStore.isTrialMode,
            turboMode: this.cascadingUIStore.isTurboModeUI,
            lastBetSetting: needClearLastSetting
                ? null
                : {
                    betLevel: this.betControlStore.betLevel,
                    coinValue: this.betControlStore.coinValue,
                },
        };

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Current setting prepared", {
            currentSetting,
            needClearLastSetting,
            timestamp: new Date().toISOString()
        });

        this.betControlStore.needClearLastSetting = false;
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] needClearLastSetting reset to false", {
            timestamp: new Date().toISOString()
        });

        const storageKey = this.getStorageKey();
        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] Saving to storage", {
            storageKey,
            currentSetting,
            timestamp: new Date().toISOString()
        });

        StorageManager.set(storageKey, currentSetting);

        cascadingSlotLogger.info("[CASCADING_SLOT_SETTING_HANDLERS] saveTempStorage completed", {
            savedSetting: currentSetting,
            timestamp: new Date().toISOString()
        });
    }
}
