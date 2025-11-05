import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetControlStore } from "../../stores/bet-control-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitSlotBetAmount extends ObserverComponent {
    @property(Label)
    lblBetAmount: Label = null;

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        cascadingSlotLogger.info(`[PortraitSlotBetAmount] updateTotalBet called with totalBet: ${totalBet}`);
        this.lblBetAmount.string = gc.FormatUtils.numberWithCommas(totalBet, 2, true);
        cascadingSlotLogger.info(`[PortraitSlotBetAmount] Updated bet amount label to: ${this.lblBetAmount.string}`);
    }
}



