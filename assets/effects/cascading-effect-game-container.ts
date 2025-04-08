import { _decorator, instantiate, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
import Observer from "observer";
import { UNIT_SECOND_SPIN } from "../cascading-slot-base-configs";
import { getCustomDuration } from "../cascading-slot-utils";
import { CascadingUIHandler } from "../main-ui/cascading-ui-handler";
import { CascadingUIStore } from "../main-ui/cascading-ui-store";
import { CascadingSlotBoard } from "../slot-board/components/cascading-slot-board";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectGameContainer extends ObserverComponent {
    @property(Prefab)
    pfbEffectFreespin: Prefab = null;

    @property(Prefab)
    pfbEffectBigWin: Prefab = null;

    @property(CascadingSlotBoard)
    board: CascadingSlotBoard = null;

    private isTurboMode = false;
    private skipBigWinToContinue = false;

    onLoad() {
        super.onLoad();
        this.node.destroyAllChildren();
    }

    // async showEffectSpecialCase(data: any) {
    //     this.node.active = true;
    //     const { bigWin, freeSpins, win } = data;
    //     if (bigWin) {
    //         const bigwin = instantiate(this.pfbEffectBigWin);
    //         const comp = bigwin.getComponent(CascadingEffectBigwin);
    //         comp.winAmount = +win;
    //         this.node.addChild(bigwin);
    //         //await comp.renderBigWinEffect(this.isTurboMode);
    //         const duration = getCustomDuration("bigWin", this.isTurboMode);
    //         await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
    //         bigwin.destroy();
    //     }

    //     if (freeSpins > 0) {
    //         //await this.board.highlightScatterItems();
    //         const freespin = instantiate(this.pfbEffectFreespin);
    //         const comp = freespin.getComponent(CascadingEffectFreespin);
    //         comp.freeSpinsCount = +freeSpins;
    //         this.node.addChild(freespin);
    //         const duration = getCustomDuration("freeSpin", this.isTurboMode);
    //         await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
    //         freespin.destroy();
    //     }
    // }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async freeSpinEffectVisibility(isShowFreeSpinEffect: boolean) {
        if (!isShowFreeSpinEffect) {
            this.node.destroyAllChildren();
            return;
        }
        const freespin = instantiate(this.pfbEffectFreespin);
        this.node.addChild(freespin);
        const duration = getCustomDuration("freeSpin", this.isTurboMode);
        await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
        freespin.destroy();
        this.setFreeSpinEffectCompleted(true);
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    renderBigWinEffect(isShowBigWin: boolean) {
        if (!isShowBigWin) {
            this.node.destroyAllChildren();
            return;
        }
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
}
