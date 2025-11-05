import { _decorator, Label } from "cc";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class TotalMultiplierView extends FadeAppearanceNode {
    @property(Label)
    total: Label = null;

    onLoad() {
        cascadingSlotLogger.info(`[TotalMultiplierView] Component loaded, showing view as hidden`);
        this.showView(false, true);
        super.onLoad();
    }

    @render(CascadingUIStore, (store) => store.totalMultiplier)
    setValue(totalMultiplier: number, animated = true) {
        cascadingSlotLogger.info(`[TotalMultiplierView] setValue called with totalMultiplier: ${totalMultiplier}, animated: ${animated}`);
        if (totalMultiplier === 0) {
            cascadingSlotLogger.info(`[TotalMultiplierView] Total multiplier is 0, hiding view and clearing text`);
            this.showView(false).then(() => {
                this.total.string = "";
            });
            return;
        }

        if (animated) {
            cascadingSlotLogger.info(`[TotalMultiplierView] Animating multiplier to: ${totalMultiplier}`);
            AnimationUtils.floatToNumber({
                label: this.total,
                amount: totalMultiplier,
                duration: 0.2,
                noZeroSuffix: true,
                prefixStr: "x",
            });
        } else {
            this.total.string = totalMultiplier > 0 ? `x${totalMultiplier}` : "";
            cascadingSlotLogger.info(`[TotalMultiplierView] Set multiplier text to: ${this.total.string}`);
        }
    }

    @render(CascadingUIStore, (store) => store.isShowTotalMultiplierJoinGame)
    renderTotalMultiplierJoinGame(isShow: boolean) {
        cascadingSlotLogger.info(`[TotalMultiplierView] renderTotalMultiplierJoinGame called with isShow: ${isShow}`);
        isShow && this.showView(true);
    }

    setTotalMultiplierTmp(totalMultiplier: number) {
        cascadingSlotLogger.info(`[TotalMultiplierView] setTotalMultiplierTmp called with totalMultiplier: ${totalMultiplier}`);
        this.total.string = `x${totalMultiplier}`;
        cascadingSlotLogger.info(`[TotalMultiplierView] Set temporary multiplier text to: ${this.total.string}`);
    }
}



