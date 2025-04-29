import { _decorator, Label } from "cc";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class TotalMultiplierView extends FadeAppearanceNode {
    @property(Label)
    total: Label = null;

    private isShowTotalMultiplierJoinGame = false;

    onLoad() {
        super.onLoad();
        this.showView(false, true);
    }

    @render(CascadingUIStore, (store) => store.totalMultiplier)
    setValue(totalMultiplier: number, animated = true) {
        if (totalMultiplier === 0) {
            this.showView(false);
            return;
        }

        if (animated) {
            AnimationUtils.floatToNumber({
                label: this.total,
                amount: totalMultiplier,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
            });
        } else {
            this.total.string = totalMultiplier > 0 ? `x${totalMultiplier}` : "";
        }
    }

    @render(CascadingUIStore, (store) => store.isShowTotalMultiplierJoinGame)
    renderTotalMultiplierJoinGame(isShow: boolean) {
        isShow && this.showView(true);
    }
}
