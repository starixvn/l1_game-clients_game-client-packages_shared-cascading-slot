import { _decorator, JsonAsset, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIHandler } from "../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;
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
        super.onLoad();
    }

    async playAnimFreespinMascot() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.freespinMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    async playAnimBigwinMascot() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.bigWinMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    async playAnimMultiplierMascot() {
        await AnimationUtils.playSpine(this.spineMascot, this.gameConfig.multiplierMascotAnimationName, false);
        AnimationUtils.playSpine(this.spineMascot, "idle", true);
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async showAnimMascotFreeSpin(isShowFreeSpinEffect: boolean) {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        isShowFreeSpinEffect && (await this.playAnimFreespinMascot());
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async showAnimMascotBigWin(haveBigWin: boolean) {
        if (!this.gameConfig.turnOnEventMascot) {
            return;
        }
        haveBigWin && (await this.playAnimBigwinMascot());
    }

    @render(CascadingUIStore, (store) => store.showEventMascotMultiplier)
    showEventMascotMultiplier(showEventMascotMultiplier: boolean) {
        if (showEventMascotMultiplier && this.gameConfig.turnOnEventMascot) {
            this.playAnimMultiplierMascot();
            this.eventMascotMultiplier(false);
        }
    }

    @handle(CascadingUIHandler, (handler, show: boolean) => handler.showEventMascotMultiplier(show))
    eventMascotMultiplier(show: boolean) {
        return show;
    }
}
