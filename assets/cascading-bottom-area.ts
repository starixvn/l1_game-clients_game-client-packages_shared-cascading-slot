import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

import { CascadingSlotSettlementStore } from "./settlements/cascading-slot-settlement-store";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends ObserverComponent {
    @property(Label)
    totalWinLabel: Label = null;

    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        if (!finishData) {
            return;
        }
        const { win } = finishData;
        ComponentUtils.floatToNumber({ label: this.totalWinLabel, amount: win, duration: 0.5, noZeroSuffix: false });
    }
}
