import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetControlStore } from "../../stores/bet-control-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitSlotBetAmount extends ObserverComponent {
    @property(Label)
    lblBetAmount: Label = null;

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        this.lblBetAmount.string = gc.FormatUtils.numberWithCommas(totalBet, 6);

    }
}
