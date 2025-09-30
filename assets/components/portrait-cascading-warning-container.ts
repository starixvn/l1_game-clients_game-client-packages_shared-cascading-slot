import { _decorator } from "cc";
import Observer from "observer";

import { BetControlStore } from "../stores/bet-control-store";
import { CascadingWarningContainer } from "./cascading-warning-container";

const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class PortraitCascadingWarningContainer extends CascadingWarningContainer {
    private isOpenBetControl = false;

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup, { fireImmediately: false })
    setIsOpenBetControl(isOpenBetControl: boolean) {
        this.isOpenBetControl = isOpenBetControl;
    }
    @render(BetControlStore, (store) => store.totalBet, { fireImmediately: false })
    private updateTotalBet(totalBet: number) {
        if (!this.isOpenBetControl) {
            this.addNode(totalBet.toString());
        }
    }
}
