import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { resourcesCache } from "../cascading-slot-utils";
import { CascadingUIHandler } from "../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingAudioContainer } from "./cascading-audio-container";
import { cascadingSlotLogger } from "../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingFreespinsFeature extends ObserverComponent {
    @property(Node)
    bgNormal: Node = null;

    @property(Node)
    bgFreeSpin: Node = null;

    @property(CascadingAudioContainer)
    audioContainer: CascadingAudioContainer = null;

    private readonly FADE_IN_OUT_DURATION = 0.5;
    private triggerFreespin = false;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] onLoad called", {
            hasBgNormal: !!this.bgNormal,
            hasBgFreeSpin: !!this.bgFreeSpin,
            hasAudioContainer: !!this.audioContainer,
            fadeDuration: this.FADE_IN_OUT_DURATION,
            timestamp: new Date().toISOString()
        });

        this.bgNormal && (this.bgNormal.active = true);
        this.bgFreeSpin && (this.bgFreeSpin.active = false);
        super.onLoad();

        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] onLoad completed", {
            bgNormalActive: this.bgNormal?.active,
            bgFreeSpinActive: this.bgFreeSpin?.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(gc.UserSettings.UserSettingStore, (store) => store.musicEnable, { fireImmediately: false })
    enableMusic(musicEnable: boolean) {
        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] enableMusic called", {
            musicEnable,
            triggerFreespin: this.triggerFreespin,
            willPlayMusic: musicEnable && this.triggerFreespin,
            audioId: AudioIds.BGM_FREESPIN,
            delay: 0.1,
            timestamp: new Date().toISOString()
        });

        if (musicEnable && this.triggerFreespin) {
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Scheduling freespin music playback", {
                delay: 0.1,
                timestamp: new Date().toISOString()
            });
            this.scheduleOnce(() => {
                cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Playing freespin music", {
                    audioId: AudioIds.BGM_FREESPIN,
                    loop: true,
                    timestamp: new Date().toISOString()
                });
                this.playMusic(AudioIds.BGM_FREESPIN, true);
            }, 0.1);
        }

        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] enableMusic completed", {
            musicEnable,
            musicScheduled: musicEnable && this.triggerFreespin,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.triggerDuringFreeSpinBonus)
    async handleBackgroundGame(triggerDuringFreeSpinBonus: boolean) {
        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] handleBackgroundGame called", {
            triggerDuringFreeSpinBonus,
            allowFreeSpinsFeature: resourcesCache.gameFeatures?.allowFreeSpinsFeature,
            currentTriggerFreespin: this.triggerFreespin,
            hasBgNormal: !!this.bgNormal,
            hasBgFreeSpin: !!this.bgFreeSpin,
            fadeDuration: this.FADE_IN_OUT_DURATION,
            timestamp: new Date().toISOString()
        });

        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Free spins feature not allowed, returning early", {
                timestamp: new Date().toISOString()
            });
            return;
        }
        this.triggerFreespin = triggerDuringFreeSpinBonus;
        if (triggerDuringFreeSpinBonus) {
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Starting freespin mode", {
                willLoadPrefab: !!this.bgFreeSpin,
                willFadeOutNormal: !!this.bgNormal,
                willFadeBGM: false,
                willPlayMusic: true,
                musicId: AudioIds.BGM_FREESPIN,
                timestamp: new Date().toISOString()
            });

            try {
                if (this.bgFreeSpin) {
                    cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Loading freespin background prefab", {
                        prefabPath: "prefabs/bg-freespins",
                        timestamp: new Date().toISOString()
                    });
                    const prefabBgFreespin = await bundleManager.loadResourcesAsset<Prefab>("prefabs/bg-freespins", Prefab);
                    const bgFreespin = instantiate(prefabBgFreespin);
                    this.bgFreeSpin.addChild(bgFreespin);
                    AnimationUtils.fadeIn(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                    cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Freespin background loaded and fading in", {
                        fadeDuration: this.FADE_IN_OUT_DURATION,
                        timestamp: new Date().toISOString()
                    });
                }

                this.bgNormal && AnimationUtils.fadeOutAndDeactivate(this.bgNormal, this.FADE_IN_OUT_DURATION);
                cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Normal background fading out", {
                    hasBgNormal: !!this.bgNormal,
                    fadeDuration: this.FADE_IN_OUT_DURATION,
                    timestamp: new Date().toISOString()
                });

                this.handleFadeBGM(false);
                this.playMusic(AudioIds.BGM_FREESPIN, true);
                cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] BGM faded and freespin music started", {
                    timestamp: new Date().toISOString()
                });
            } catch (err) {
                cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Error during freespin mode setup", {
                    error: err,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Ending freespin mode", {
                willFadeOutFreespin: !!this.bgFreeSpin,
                willFadeInNormal: !!this.bgNormal,
                willFadeBGM: true,
                willStopMusic: true,
                musicId: AudioIds.BGM_FREESPIN,
                timestamp: new Date().toISOString()
            });

            if (this.bgFreeSpin) {
                cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Fading out freespin background", {
                    fadeDuration: this.FADE_IN_OUT_DURATION,
                    willCleanupChildren: true,
                    timestamp: new Date().toISOString()
                });
                AnimationUtils.fadeOut(this.bgFreeSpin, this.FADE_IN_OUT_DURATION).then(() => {
                    cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Freespin background fade out completed", {
                        willRemoveChildren: !this.triggerFreespin,
                        timestamp: new Date().toISOString()
                    });
                    if(!this.triggerFreespin) {
                        this.bgFreeSpin.removeAllChildren();
                        this.bgFreeSpin.active = false;
                    }
                });
            }
            this.bgNormal && AnimationUtils.fadeIn(this.bgNormal, this.FADE_IN_OUT_DURATION);
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] Normal background fading in", {
                hasBgNormal: !!this.bgNormal,
                fadeDuration: this.FADE_IN_OUT_DURATION,
                timestamp: new Date().toISOString()
            });

            this.handleFadeBGM(true);
            this.stopMusic(AudioIds.BGM_FREESPIN);
            cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] BGM faded in and freespin music stopped", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_FREESPINS_FEATURE] handleBackgroundGame completed", {
            triggerDuringFreeSpinBonus,
            finalTriggerFreespin: this.triggerFreespin,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handler, data: { id: string; loop: boolean }) => handler.playMusic(data.id, data.loop))
    playMusic(id: string, loop: boolean) {
        return { id, loop };
    }

    @handle(gc.Audios.AudioHandler, (handler, id: string) => handler.stopMusic(id))
    stopMusic(id: string) {
        return id;
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        return fadeBGM;
    }
}




