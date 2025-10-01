import { _decorator, Node } from "cc";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingTotalBet } from "../total-bet/cascading-totalBet";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingTotalBet extends CascadingTotalBet {
    @property(Node)
    disabledIncrease: Node = null;

    @property(Node)
    disabledDecrease: Node = null;

    onClickDecreaseTotalBet() {
        this.hideSymbolPreview();
        this.betControl?.onClickDecreaseTotalBet();
    }

    onClickIncreaseTotalBet() {
        this.hideSymbolPreview();
        this.betControl?.onClickIncreaseTotalBet();
    }

    @render(CascadingUIStore, (store) => store.disabledOpenInputBet)
    setAllowIncreaseBet(disableInputBet: boolean) {
        this.disabledIncrease.active = disableInputBet;
    }

    @render(CascadingUIStore, (store) => store.disabledOpenInputBet)
    setAllowDecreaseBet(disableInputBet: boolean) {
        this.disabledDecrease.active = disableInputBet;
    }
}
