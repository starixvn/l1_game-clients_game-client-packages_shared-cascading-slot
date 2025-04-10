import { _decorator, Color, JsonAsset, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { CascadingSlotSettlementStore } from "./settlements/cascading-slot-settlement-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends ObserverComponent {
    @property(Label)
    totalWinLabel: Label = null;

    @property(JsonAsset)
    colorInfo: JsonAsset = null;

    private colorConfig: any;

    onLoad(): void {
        this.colorConfig = this.colorInfo.json;
        this.updateColor();
        super.onLoad();
    }
    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        if (!finishData) {
            return;
        }
        const { win } = finishData;
        ComponentUtils.floatToNumber({ label: this.totalWinLabel, amount: win, duration: 0.5, noZeroSuffix: false });
    }

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const labelComp = comp.node.getComponent(Label);
            if (labelComp) {
                comp.updateLabelColor(
                    comp.node.getComponent("LocalizedLabel") ? this.colorConfig.bottomAreaTextColor : this.colorConfig.bottomAreaNumberColor
                );
            } else {
                comp.updateSpriteColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });

        this.totalWinLabel.node.getComponent(Label).color = new Color().fromHEX(this.colorConfig.bottomAreaWinAmountColor);
        // GameUtils.setColorAndOpacity(bgFrameColor, this.totalWinNode);
        // GameUtils.setColorAndOpacity(bgFrameColor, this.autoSpinToggle.node.children[0]);
        // GameUtils.setColorAndOpacity(bgFrameColor, this.turboToggle.node.children[0]);
    }
}
