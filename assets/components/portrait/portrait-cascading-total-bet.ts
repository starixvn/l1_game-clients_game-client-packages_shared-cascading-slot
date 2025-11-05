import { _decorator } from "cc";
import Observer from "observer";
import { CascadingTotalBet } from "../total-bet/cascading-totalBet";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingTotalBet extends CascadingTotalBet {

    onClickDecreaseTotalBet() {
        cascadingSlotLogger.info(`[PortraitCascadingTotalBet] onClickDecreaseTotalBet called`);
        this.triggerOpenBetControl();
        this.betControl?.onClickDecreaseTotalBet();
        cascadingSlotLogger.info(`[PortraitCascadingTotalBet] Triggered decrease total bet`);
    }

    onClickIncreaseTotalBet() {
        cascadingSlotLogger.info(`[PortraitCascadingTotalBet] onClickIncreaseTotalBet called`);
        this.triggerOpenBetControl();
        this.betControl?.onClickIncreaseTotalBet();
        cascadingSlotLogger.info(`[PortraitCascadingTotalBet] Triggered increase total bet`);
    }
}



