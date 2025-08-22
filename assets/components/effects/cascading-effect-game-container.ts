import gc from "@sg/game-client-base";
import { _decorator, instantiate, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import Observer from "observer";
import { GameFeatureJson, getCustomDuration, resourcesCache } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
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

    private readonly Sound = {
        FREE_SPIN_SOUND: "free_spin",
        BIG_WIN_SOUND: "big_win",
        INCREMENT: "increment",
        INCREMENT_END: "increment_stop",
        TRANSITION: "transition",
    };

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
        this.playSound(this.Sound.FREE_SPIN_SOUND);
        const freespin = instantiate(this.pfbEffectFreespin);
        this.node.addChild(freespin);
        const duration = getCustomDuration("freeSpin", this.isTurboMode);
        await AnimationUtils.delayTime(duration);
        freespin.destroy();
        this.setFreeSpinEffectCompleted(true);
        this.handleTriggerDuringFreeSpinBonus();
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async renderBigWinEffect(isShowBigWin: boolean) {
        if (!isShowBigWin) {
            this.node.destroyAllChildren();
            return;
        }
        await this.delayMascotEvent();
        await this.playEffectTransition();
        !this.isTurboMode && this.playSoundCoinIncrement();

        this.playSound(this.Sound.BIG_WIN_SOUND);
        const bigwin = instantiate(this.pfbEffectBigWin);
        this.node.addChild(bigwin);
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    setFreeSpinEffectCompleted(completed: boolean) {
        return completed;
    }

    @handle(CascadingUIHandler, (handler, trigger: any) => handler.handleTriggerDuringFreeSpinBonus(trigger))
    handleTriggerDuringFreeSpinBonus() {
        return {};
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, audioId: string) => handle.playStoppableSFX(audioId))
    playSoundCoinIncrement() {
        return this.Sound.INCREMENT;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopSoundCoinIncrement() {
        return this.Sound.INCREMENT;
    }

    private async playEffectTransition() {
        if (!this.pfbEffectTransition) {
            return;
        }
        const transition = instantiate(this.pfbEffectTransition);
        this.playSound(this.Sound.TRANSITION);
        this.node.addChild(transition);
        const duration = getCustomDuration("transition", this.isTurboMode);
        await AnimationUtils.delayTime(duration);
        transition.destroy();
    }

    async delayMascotEvent() {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        const duration = getCustomDuration("eventMascot", this.isTurboMode);
        await AnimationUtils.delayTime(duration);
    }
}
