import { _decorator } from "cc";
import Observer from "observer";
import { CascadingTotalBet } from "../total-bet/cascading-totalBet";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingTotalBet extends CascadingTotalBet {

    onClickDecreaseTotalBet() {
        this.triggerOpenBetControl();
        this.betControl?.onClickDecreaseTotalBet();
    }

    onClickIncreaseTotalBet() {
        this.triggerOpenBetControl();
        this.betControl?.onClickIncreaseTotalBet();
    }
}
