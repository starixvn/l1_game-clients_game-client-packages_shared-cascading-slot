import { _decorator, sp } from "cc";
import { GameSpeedStore } from "db://shared-common-slot/game-speed";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { GameSpeed, getConfigGameSpeed, globalEmitter, resourcesCache, SlotClientEvent } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

export enum AnimationNameMascot {
    idle = "idle",
    transition = "transition",
}

@ccclass
export class CascadingMascot extends ObserverComponent {
    @property(sp.Skeleton)
    spineMascot: sp.Skeleton = null;

    private gameConfig: any;
    private gameSpeed = GameSpeed.NORMAL;

    onLoad() {
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        this.gameConfig = resourcesCache.gameFeatures;
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

    @render(GameSpeedStore, (store) => store.gameSpeed)
    getGameSpeed(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    async handleAnimTransition(anim: string) {
        const isPlayingAnim = AnimationUtils.isAnimationPlaying(this.spineMascot, anim);
        if (isPlayingAnim) {
            return;
        }
        const duration = getConfigGameSpeed("ratioEventSpineSpeed", this.gameSpeed);
        await AnimationUtils.playSpine(this.spineMascot, anim, false, duration);
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
        this.gameConfig.multiplierLandMascotAnimationName &&
            (await this.handleAnimTransition(this.gameConfig?.multiplierLandMascotAnimationName));
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
