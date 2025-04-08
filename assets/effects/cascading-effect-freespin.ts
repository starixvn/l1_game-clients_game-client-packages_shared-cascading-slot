import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
import Observer from "observer";
import { UNIT_SECOND_SPIN } from "../cascading-slot-base-configs";
import { getCustomDuration } from "../cascading-slot-utils";
import { CascadingUIHandler, CascadingUIStore } from "../main-ui";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectFreespin extends ObserverComponent {
    @property(Label)
    lblFreeSpinCount: Label = null;

    freeSpinsCount = 0;
    private isTurboMode = false;

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async freeSpinEffectVisibility(isShowFreeSpinEffect: boolean) {
        console.log("freeSpinEffectVisibility", isShowFreeSpinEffect);
        this.node.active = isShowFreeSpinEffect;
        if (isShowFreeSpinEffect) {
            const duration = getCustomDuration("freeSpin", this.isTurboMode);
            await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
            this.setFreeSpinEffectCompleted(true);
        }
    }

    @render(CascadingUIStore, (store) => store.freeSpinsCount)
    renderFreeSpinsCount(freeSpinsCount: number) {
        this.freeSpinsCount = freeSpinsCount;
        this.lblFreeSpinCount.string = this.freeSpinsCount.toString();
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
