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
        super.onLoad();
        this.bgNormal && (this.bgNormal.active = true);
        this.bgFreeSpin && (this.bgFreeSpin.active = false);
    }

    @render(gc.UserSettings.UserSettingStore, (store) => store.musicEnable, { fireImmediately: false })
    enableMusic(musicEnable: boolean) {
        if (musicEnable && this.triggerFreespin) {
            this.scheduleOnce(() => {
                this.playMusic(AudioIds.BGM_FREESPIN, true);
            }, 0.1);
        }
    }

    @render(CascadingUIStore, (store) => store.triggerDuringFreeSpinBonus)
    async handleBackgroundGame(triggerDuringFreeSpinBonus: boolean) {
        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            return;
        }
        this.triggerFreespin = triggerDuringFreeSpinBonus;
        if (triggerDuringFreeSpinBonus) {
            try {
                if (this.bgFreeSpin) {
                    const prefabBgFreespin = await bundleManager.loadResourcesAsset<Prefab>("prefabs/bg-freespins", Prefab);
                    const bgFreespin = instantiate(prefabBgFreespin);
                    this.bgFreeSpin.addChild(bgFreespin);
                    AnimationUtils.fadeIn(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                }

                this.bgNormal && AnimationUtils.fadeOutAndDeactivate(this.bgNormal, this.FADE_IN_OUT_DURATION);

                this.handleFadeBGM(false);
                this.playMusic(AudioIds.BGM_FREESPIN, true);
            } catch (err) {}
        } else {
            if (this.bgFreeSpin) {
                AnimationUtils.fadeOutAndDeactivate(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                this.bgFreeSpin.removeAllChildren();
            }
            this.bgNormal && AnimationUtils.fadeIn(this.bgNormal, this.FADE_IN_OUT_DURATION);

            this.handleFadeBGM(true);
            this.stopMusic(AudioIds.BGM_FREESPIN);
        }
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
