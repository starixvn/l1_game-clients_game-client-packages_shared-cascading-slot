import gc from "@sg/game-client-base";
const { MainPlayerStore } = gc.Player;
import { _decorator, Label } from "cc";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { getXMode } from "db://shared-common-slot/x-mode/scripts/utils/xMode-utils";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class TotalMultiplierView extends FadeAppearanceNode {
    @property(Label)
    total: Label = null;

    onLoad() {
        this.showView(false, true);
        super.onLoad();
    }

    @render(CascadingUIStore, (store) => store.totalMultiplier)
    setValue(totalMultiplier: number, animated = true) {
        if (totalMultiplier === 0) {
            this.showView(false).then(() => {
                this.total.string = "";
            });
            return;
        }

        if (animated) {
            AnimationUtils.floatToNumber({
                label: this.total,
                amount: totalMultiplier,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
                xMode: getXMode(),
            });
        } else {
            this.total.string = totalMultiplier > 0 ? `x${totalMultiplier}` : "";
        }
    }

    @render(CascadingUIStore, (store) => store.isShowTotalMultiplierJoinGame)
    renderTotalMultiplierJoinGame(isShow: boolean) {
        isShow && this.showView(true);
    }

    setTotalMultiplierTmp(totalMultiplier: number) {
        this.total.string = `x${totalMultiplier}`;
    }
}
