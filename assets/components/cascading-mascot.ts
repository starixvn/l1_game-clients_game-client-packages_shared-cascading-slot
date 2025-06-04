import { _decorator, JsonAsset, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

enum AnimationNameMascot {
    idle = "idle",
}

@ccclass
export class CascadingMascot extends ObserverComponent {
    @property(sp.Skeleton)
    spineMascot: sp.Skeleton = null;

    @property(JsonAsset)
    gameInfo: JsonAsset = null;

    private gameConfig: any;

    onLoad() {
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        this.gameConfig = this.gameInfo.json;
        this.settingMixDuration();
        super.onLoad();
    }

    private settingMixDuration() {
        const mixDuration = 0.3;
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.freespinMascotAnimationName, mixDuration);
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.bigWinMascotAnimationName, mixDuration);
        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.multiplierMascotAnimationName, mixDuration);
    }

    async playAnimFreespin() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.freespinMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    async playAnimBigwin() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.bigWinMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    async playAnimMultiplier() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.multiplierMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
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
        if (triggerWinMultiplier && this.gameConfig.turnOnEventMascot) {
            this.playAnimMultiplier();
        }
    }
}
