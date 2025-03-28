import { _decorator, Label } from "cc";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingTotalMultiplierStore } from "./cascading-total-multiplier-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class TotalMultiplierView extends FadeAppearanceNode {
    @property(Label)
    total: Label = null;

    onLoad() {
        super.onLoad();
        this.showView(false, true);
    }

    @render(CascadingTotalMultiplierStore, (store) => store.totalMultiplier)
    setValue(totalMultiplier: number, animated = true) {
        console.log("setValue totalMultiplier", totalMultiplier);
        this.showView(true);
        if (animated) {
            ComponentUtils.floatToNumber({ label: this.total, amount: totalMultiplier, duration: 0.2, noZeroSuffix: true, prefixStr: "x" });
        } else {
            this.total.string = totalMultiplier > 0 ? `x${totalMultiplier}` : "";
        }
    }
}
