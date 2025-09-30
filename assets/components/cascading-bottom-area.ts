import { _decorator, Color, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { LocalizedLabel } from "../../../i18n/assets/LocalizedLabel";
import { resourcesCache } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends ObserverComponent {
    @property(Label)
    totalWinLabel: Label = null;

    protected colorConfig: any;

    onLoad(): void {
        this.colorConfig = resourcesCache.colorJson;
        this.updateColor();
        super.onLoad();
    }
    @render(CascadingUIStore, (store) => store.totalWin, { fireImmediately: false })
    async handleSettlement(totalTumbleWin: number) {
        if (totalTumbleWin === 0) {
            this.totalWinLabel.string = totalTumbleWin.toString();
            return;
        }
        AnimationUtils.floatToNumber({ label: this.totalWinLabel, amount: totalTumbleWin, duration: 0.5, noZeroSuffix: false });
    }

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const labelComp = comp.node.getComponent(Label);
            if (labelComp) {
                comp.updateColor(this.updateColorLabel(comp));
            } else {
                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });

        this.totalWinLabel.node.getComponent(Label).color = new Color().fromHEX(this.colorConfig.bottomAreaWinAmountColor);
    }

    updateColorLabel(comp: ChangeNodeColor) {
        return comp.node.getComponent(LocalizedLabel) ? this.colorConfig.bottomAreaTextColor : this.colorConfig.bottomAreaNumberColor;
    }
}
