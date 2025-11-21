import gc from "@sg/game-client-base";
import { _decorator, instantiate, Prefab } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { audioManager } from "db://shared-components/game/audios/scripts/audio-manager";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { GameFeatureJson, getCustomDuration, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingEffectBigwin } from "./cascading-effect-bigwin";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectGameContainer extends ObserverComponent {
    @property(Prefab)
    pfbEffectFreespin: Prefab = null;

    @property(Prefab)
    pfbEffectBigWin: Prefab = null;

    @property(Prefab)
    pfbEffectTransition: Prefab = null;

    private isTurboMode = false;
    private gameConfig: GameFeatureJson;
    private bigWinRange = [];

    private readonly MEGA_WIN_RATIO = 3;
    private readonly SUPER_WIN_RATIO = 6;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] onLoad called", {
            hasPfbEffectFreespin: !!this.pfbEffectFreespin,
            hasPfbEffectBigWin: !!this.pfbEffectBigWin,
            hasPfbEffectTransition: !!this.pfbEffectTransition,
            isTurboMode: this.isTurboMode,
            hasGameConfig: !!this.gameConfig,
            bigWinRange: this.bigWinRange,
            megaWinRatio: this.MEGA_WIN_RATIO,
            superWinRatio: this.SUPER_WIN_RATIO,
            willCallSuperOnLoad: true,
            willLoadGameConfig: true,
            willDestroyChildren: true,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        this.gameConfig = resourcesCache.gameFeatures;
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Game config loaded", {
            hasGameConfig: !!this.gameConfig,
            turnOnEventMascot: this.gameConfig?.turnOnEventMascot,
            timestamp: new Date().toISOString()
        });

        this.node.destroyAllChildren();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] All children destroyed", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async freeSpinEffectVisibility(isShowFreeSpinEffect: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] freeSpinEffectVisibility called", {
            isShowFreeSpinEffect,
            willSkipIfNotShowing: !isShowFreeSpinEffect,
            willDelayMascot: isShowFreeSpinEffect,
            willPlayTransition: isShowFreeSpinEffect,
            willHandleAudio: isShowFreeSpinEffect,
            willInstantiateEffect: isShowFreeSpinEffect,
            timestamp: new Date().toISOString()
        });

        if (!isShowFreeSpinEffect) {
            this.node.destroyAllChildren();
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Freespin effect hidden - destroyed all children", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        await this.delayMascotEvent();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Mascot event delay completed", {
            timestamp: new Date().toISOString()
        });

        await this.playEffectTransition();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Effect transition completed", {
            timestamp: new Date().toISOString()
        });

        if (audioManager.audioConfigs[AudioIds.STINGER_FREESPIN_WIN]) {
            this.handleFadeBGM(false);
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] BGM faded for freespin win stinger", {
                timestamp: new Date().toISOString()
            });
        }

        this.playSound(AudioIds.FREESPIN);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Freespin sound played", {
            timestamp: new Date().toISOString()
        });

        AudioUtils.playStoppableSFX(AudioIds.STINGER_FREESPIN_WIN, true);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Freespin win stinger started", {
            timestamp: new Date().toISOString()
        });

        const freespin = instantiate(this.pfbEffectFreespin);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Freespin effect instantiated", {
            hasFreespin: !!freespin,
            timestamp: new Date().toISOString()
        });

        this.node.addChild(freespin);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Freespin effect added to container", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async renderBigWinEffect(isShowBigWin: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] renderBigWinEffect called", {
            isShowBigWin,
            willSkipIfNotShowing: !isShowBigWin,
            isTurboMode: this.isTurboMode,
            willDelayMascot: isShowBigWin,
            willPlayTransition: isShowBigWin,
            willHandleAudio: isShowBigWin,
            willInstantiateEffect: isShowBigWin,
            timestamp: new Date().toISOString()
        });

        if (!isShowBigWin) {
            this.node.destroyAllChildren();
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Big win effect hidden - destroyed all children", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (audioManager.audioConfigs[AudioIds.STINGER_WINCOUNT]) {
            this.handleFadeBGM(false);
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] BGM faded for win count stinger", {
                timestamp: new Date().toISOString()
            });
        }

        await this.delayMascotEvent();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Mascot event delay completed", {
            timestamp: new Date().toISOString()
        });

        await this.playEffectTransition();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Effect transition completed", {
            timestamp: new Date().toISOString()
        });

        if (!this.isTurboMode) {
            this.playSoundCoinIncrement();
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Coin increment sound started", {
                timestamp: new Date().toISOString()
            });

            AudioUtils.playStoppableSFX(AudioIds.STINGER_WINCOUNT, true);
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Win count stinger started", {
                timestamp: new Date().toISOString()
            });
        }

        const bigwin = instantiate(this.pfbEffectBigWin);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Big win effect instantiated", {
            hasBigwin: !!bigwin,
            timestamp: new Date().toISOString()
        });

        if (bigwin) {
            bigwin.getComponent(CascadingEffectBigwin)?.setBigWinRange(this?.bigWinRange ?? []);
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Big win range set", {
                bigWinRange: this?.bigWinRange ?? [],
                timestamp: new Date().toISOString()
            });

            this.node.addChild(bigwin);
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Big win effect added to container", {
                timestamp: new Date().toISOString()
            });
        }
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] renderTurboMode called", {
            isTurboMode,
            previousIsTurboMode: this.isTurboMode,
            willUpdateTurboMode: true,
            timestamp: new Date().toISOString()
        });

        this.isTurboMode = isTurboMode;

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Turbo mode updated", {
            newIsTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] playSound called", {
            id,
            willReturnId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] playSound returning", {
            id,
            timestamp: new Date().toISOString()
        });

        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, audioId: string) => handle.playStoppableSFX(audioId))
    playSoundCoinIncrement() {
        const audioId = AudioIds.WINCOUNT_INCREMENT;
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] playSoundCoinIncrement called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] playSoundCoinIncrement returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopSoundCoinIncrement() {
        const audioId = AudioIds.WINCOUNT_INCREMENT;
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] stopSoundCoinIncrement called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] stopSoundCoinIncrement returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    private async playEffectTransition() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] playEffectTransition called", {
            hasPfbEffectTransition: !!this.pfbEffectTransition,
            willSkipIfNoTransition: !this.pfbEffectTransition,
            willInstantiate: !!this.pfbEffectTransition,
            willPlaySound: !!this.pfbEffectTransition,
            willAddChild: !!this.pfbEffectTransition,
            willDelay: !!this.pfbEffectTransition,
            willDestroy: !!this.pfbEffectTransition,
            timestamp: new Date().toISOString()
        });

        if (!this.pfbEffectTransition) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Skipping transition - no transition prefab", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const transition = instantiate(this.pfbEffectTransition);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition effect instantiated", {
            hasTransition: !!transition,
            timestamp: new Date().toISOString()
        });

        this.playSound(AudioIds.TRANSITION);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition sound played", {
            timestamp: new Date().toISOString()
        });

        this.node.addChild(transition);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition effect added to container", {
            timestamp: new Date().toISOString()
        });

        const duration = getCustomDuration("transition", this.isTurboMode);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition duration calculated", {
            duration,
            isTurboMode: this.isTurboMode,
            willDelay: true,
            timestamp: new Date().toISOString()
        });

        await AnimationUtils.delayTime(duration);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition delay completed", {
            timestamp: new Date().toISOString()
        });

        transition.destroy();
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Transition effect destroyed", {
            timestamp: new Date().toISOString()
        });
    }

    async delayMascotEvent() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] delayMascotEvent called", {
            turnOnEventMascot: this.gameConfig?.turnOnEventMascot,
            willSkipIfDisabled: !this.gameConfig?.turnOnEventMascot,
            willDelay: !!this.gameConfig?.turnOnEventMascot,
            timestamp: new Date().toISOString()
        });

        if (!this.gameConfig.turnOnEventMascot) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Skipping mascot delay - event mascot disabled", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const duration = getCustomDuration("eventMascot", this.isTurboMode);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Mascot event duration calculated", {
            duration,
            isTurboMode: this.isTurboMode,
            willDelay: true,
            timestamp: new Date().toISOString()
        });

        await AnimationUtils.delayTime(duration);
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Mascot event delay completed", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] handleFadeBGM called", {
            fadeBGM,
            willReturnFadeBGM: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] handleFadeBGM returning", {
            fadeBGM,
            timestamp: new Date().toISOString()
        });

        return fadeBGM;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateBigWinRange(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] updateBigWinRange called", {
            hasGameConfigs: !!gameConfigs,
            willSkipIfNoGameConfigs: !gameConfigs,
            willUpdateBigWinRange: !!gameConfigs,
            timestamp: new Date().toISOString()
        });

        if (!gameConfigs) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Skipping big win range update - no game configs", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        this.bigWinRange = gameConfigs?.bigWinRange ?? [0, this.MEGA_WIN_RATIO, this.SUPER_WIN_RATIO];
        cascadingSlotLogger.info("[CASCADING_EFFECT_GAME_CONTAINER] Big win range updated", {
            newBigWinRange: this.bigWinRange,
            defaultRange: [0, this.MEGA_WIN_RATIO, this.SUPER_WIN_RATIO],
            usedDefault: !gameConfigs?.bigWinRange,
            timestamp: new Date().toISOString()
        });
    }
}



