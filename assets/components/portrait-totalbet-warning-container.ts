import gc from "@sg/game-client-base";
import { _decorator, instantiate, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingWarningMsg } from "./cascading-warning-msg";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class PortraitTotalBetWarningContainer extends ObserverComponent {
    @property(Prefab)
    prefabTotalBetWarning: Prefab = null;

    private isOpenBetControl = false;

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup, { fireImmediately: false })
    setIsOpenBetControl(isOpenBetControl: boolean) {
        this.isOpenBetControl = isOpenBetControl;
    }
    @render(BetControlStore, (store) => store.totalBet, { fireImmediately: false })
    private updateTotalBet(totalBet: number) {
        if (!this.isOpenBetControl) {
            const warningNode = instantiate(this.prefabTotalBetWarning);
            const comp = warningNode.getComponent(CascadingWarningMsg);
            this.node.addChild(warningNode);
            comp.setData(gc.FormatUtils.numberWithCommas(totalBet, 6, true)
            );
        }
    }
}
