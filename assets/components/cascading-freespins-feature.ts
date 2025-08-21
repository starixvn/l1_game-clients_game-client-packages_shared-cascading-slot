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
        this.bgNormal.active = true;
        this.bgFreeSpin.active = false;
    }

    @render(CascadingUIStore, (store) => store.isFreeSpins)
    async handleBackgroundGame(isInFreeSpinMode: boolean) {
        if (resourcesCache.gameFeatures?.allowBackgroundChangeOnFreeSpins) {
            if (isInFreeSpinMode) {
                try {
                    const prefabBgFreespin = await bundleManager.loadResourcesAsset<Prefab>("prefabs/bg-freespins", Prefab);
                    const bgFreespin = instantiate(prefabBgFreespin);
                    this.bgFreeSpin.addChild(bgFreespin);
                    AnimationUtils.fadeOutAndDeactivate(this.bgNormal, this.FADE_IN_OUT_DURATION);
                    AnimationUtils.fadeIn(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                    this.audioContainer.updateVolumeMusicSource(0.1, 2);
                    this.playSound(AudioIds.TRANSFORM_FREESPINS);
                } catch (err) {
                    console.log(err);
                }
            } else {
                AnimationUtils.fadeOutAndDeactivate(this.bgFreeSpin, this.FADE_IN_OUT_DURATION);
                AnimationUtils.fadeIn(this.bgNormal, this.FADE_IN_OUT_DURATION);
                this.audioContainer.updateVolumeMusicSource(1, 2);
                this.stopSound(AudioIds.TRANSFORM_FREESPINS);
                this.bgFreeSpin.removeAllChildren();
            }
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
