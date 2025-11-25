import gc from "@sg/game-client-base";
import { _decorator, instantiate, Prefab } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { audioManager } from "db://shared-components/game/audios/scripts/audio-manager";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { GameFeatureJson, GameSpeed, getConfigGameSpeed, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingEffectBigwin } from "./cascading-effect-bigwin";
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

    private gameSpeed = GameSpeed.NORMAL;
    private gameConfig: GameFeatureJson;
    private bigWinRange = [];

    private readonly MEGA_WIN_RATIO = 3;
    private readonly SUPER_WIN_RATIO = 6;

    onLoad() {
        super.onLoad();
        this.gameConfig = resourcesCache.gameFeatures;
        this.node.destroyAllChildren();
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async freeSpinEffectVisibility(isShowFreeSpinEffect: boolean) {
        if (!isShowFreeSpinEffect) {
            this.node.destroyAllChildren();
            return;
        }

        await this.delayMascotEvent();
        await this.playEffectTransition();
        if (audioManager.audioConfigs[AudioIds.STINGER_FREESPIN_WIN]) {
            this.handleFadeBGM(false);
        }
        this.playSound(AudioIds.FREESPIN);
        AudioUtils.playStoppableSFX(AudioIds.STINGER_FREESPIN_WIN, true);
        const freespin = instantiate(this.pfbEffectFreespin);
        this.node.addChild(freespin);
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async renderBigWinEffect(isShowBigWin: boolean) {
        if (!isShowBigWin) {
            this.node.destroyAllChildren();
            return;
        }
        if (audioManager.audioConfigs[AudioIds.STINGER_WINCOUNT]) {
            this.handleFadeBGM(false);
        }
        await this.delayMascotEvent();
        await this.playEffectTransition();
        if (!this.gameSpeed) {
            this.playSoundCoinIncrement();
            AudioUtils.playStoppableSFX(AudioIds.STINGER_WINCOUNT, true);
        }
        const bigwin = instantiate(this.pfbEffectBigWin);
        if (bigwin) {
            bigwin.getComponent(CascadingEffectBigwin)?.setBigWinRange(this?.bigWinRange ?? []);
            this.node.addChild(bigwin);
        }
    }

    @render(CascadingUIStore, (store) => store.gameSpeed)
    renderTurboMode(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, audioId: string) => handle.playStoppableSFX(audioId))
    playSoundCoinIncrement() {
        return AudioIds.WINCOUNT_INCREMENT;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopSoundCoinIncrement() {
        return AudioIds.WINCOUNT_INCREMENT;
    }

    private async playEffectTransition() {
        if (!this.pfbEffectTransition) {
            return;
        }
        const transition = instantiate(this.pfbEffectTransition);
        this.playSound(AudioIds.TRANSITION);
        this.node.addChild(transition);
        const duration = getConfigGameSpeed("transition", this.gameSpeed);
        await AnimationUtils.delayTime(duration);
        transition.destroy();
    }

    async delayMascotEvent() {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        const duration = getConfigGameSpeed("eventMascot", this.gameSpeed);
        await AnimationUtils.delayTime(duration);
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        return fadeBGM;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateBigWinRange(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!gameConfigs) {
            return;
        }
        this.bigWinRange = gameConfigs?.bigWinRange ?? [0, this.MEGA_WIN_RATIO, this.SUPER_WIN_RATIO];
    }
}
