import { _decorator, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { globalEmitter, resourcesCache, SlotClientEvent } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

enum AnimationNameMascot {
    idle = "idle",
    transition = "transition",
}

@ccclass
export class CascadingMascot extends ObserverComponent {
    @property(sp.Skeleton)
    spineMascot: sp.Skeleton = null;

    private gameConfig: any;

    onLoad() {
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        this.gameConfig = resourcesCache.gameFeatures;
        this.settingMixDuration();
        super.onLoad();
        if (this.gameConfig.effectIntroMultiplier) {
            globalEmitter.on(SlotClientEvent.EFFECT_INTRO_MULTIPLIER, this.playAnimMultiplierLand, this);
        }
    }

    private settingMixDuration() {
        const mixDuration = 0.3;
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.freespinMascotAnimationName, mixDuration);
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.bigWinMascotAnimationName, mixDuration);
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.multiplierMascotAnimationName, mixDuration);
    }

    async handleAnimTransition(anim: string) {
        const durationMascot = this.spineMascot.findAnimation(anim)?.duration;
        const track1Entry = this.spineMascot.getCurrent(1);
        if (track1Entry) {
            return;
        }

        this.spineMascot.setAnimation(1, anim, false);

        await AnimationUtils.delayTime(durationMascot);
        this.spineMascot.clearTracks();
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    async playAnimFreespin() {
        await this.handleAnimTransition(this.gameConfig.freespinMascotAnimationName);
    }

    async playAnimBigwin() {
        await this.handleAnimTransition(this.gameConfig.bigWinMascotAnimationName);
    }

    async playAnimMultiplier() {
        await this.handleAnimTransition(this.gameConfig.multiplierMascotAnimationName);
    }

    async playAnimMultiplierLand() {
        await this.handleAnimTransition(this.gameConfig.multiplierLandMascotAnimationName);
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async showAnimFreeSpin(isShowFreeSpinEffect: boolean) {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        isShowFreeSpinEffect && (await this.playAnimFreespin());
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async showAnimBigWin(haveBigWin: boolean) {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        haveBigWin && (await this.playAnimBigwin());
    }

    @render(CascadingUIStore, (store) => store.triggerWinMultiplier, { fireImmediately: false })
    showAnimMultiplier(triggerWinMultiplier: any) {
        if (triggerWinMultiplier && this.gameConfig.turnOnMultiplierMascot) {
            this.playAnimMultiplier();
        }
    }
}
