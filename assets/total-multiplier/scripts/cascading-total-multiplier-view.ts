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
        this.showView(false, true);
    }

    @render(CascadingTotalMultiplierStore, (store) => store.needShowTotalMultiplier)
    showTotalMultiplier(needShowTotalMultiplier: boolean) {
        this.showView(needShowTotalMultiplier, true);
    }

    setValue(value: number, animated: boolean) {
        if (animated) {
            ComponentUtils.floatToNumber({ label: this.total, amount: value, duration: 0.2, noZeroSuffix: true, prefixStr: "x" });
        } else {
            this.total.string = value > 0 ? `x${value}` : "";
        }
    }
}
