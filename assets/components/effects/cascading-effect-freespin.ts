import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectFreespin extends ObserverComponent {
    @property(Label)
    lblFreeSpinCount: Label = null;

    freeSpinsCount = 0;
    private isTurboMode = false;

    @render(CascadingUIStore, (store) => store.freeSpinsByRound)
    renderFreeSpinsCount(freeSpinsCount: number) {
        this.freeSpinsCount = freeSpinsCount;
        this.lblFreeSpinCount.string = this.freeSpinsCount.toString();
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }
}
