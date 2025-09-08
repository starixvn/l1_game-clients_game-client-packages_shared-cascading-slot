import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { resourcesCache } from "../cascading-slot-utils";
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

    onLoad() {
        super.onLoad();
        this.bgNormal && (this.bgNormal.active = true);
        this.bgFreeSpin && (this.bgFreeSpin.active = false);
    }

    @render(CascadingUIStore, (store) => store.triggerDuringFreeSpinBonus)
    async handleBackgroundGame(triggerDuringFreeSpinBonus: boolean) {
        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            return;
        }

        if (triggerDuringFreeSpinBonus) {
            try {
                if (this.bgFreeSpin) {
                    const prefabBgFreespin = await bundleManager.loadResourcesAsset<Prefab>("prefabs/bg-freespins", Prefab);
                    const bgFreespin = instantiate(prefabBgFreespin);
                    this.bgFreeSpin.addChild(bgFreespin);
                    AnimationUtils.fadeIn(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                }

                this.bgNormal && AnimationUtils.fadeOutAndDeactivate(this.bgNormal, this.FADE_IN_OUT_DURATION);

                this.audioContainer.updateVolumeMusicSource(0.1, 1);
                this.playSound(AudioIds.BGM_FREESPIN);
            } catch (err) { }
        } else {
            if (this.bgFreeSpin) {
                AnimationUtils.fadeOutAndDeactivate(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                this.bgFreeSpin.removeAllChildren();
            }
            this.bgNormal && AnimationUtils.fadeIn(this.bgNormal, this.FADE_IN_OUT_DURATION);

            this.audioContainer.updateVolumeMusicSource(1, 1);
            this.stopSound(AudioIds.BGM_FREESPIN);
        }
    }

    @handle(gc.Audios.AudioHandler, (handler, id: string) => handler.playStoppableSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handler, id: string) => handler.stopStoppableSFX(id))
    stopSound(id: string) {
        return id;
    }
}
