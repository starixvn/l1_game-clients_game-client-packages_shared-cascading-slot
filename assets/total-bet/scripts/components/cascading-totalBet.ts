import { _decorator, Label, Node } from "cc";
import { CascadingSlotState, CascadingSlotStateStore } from "db://shared-cascading-slot/shared/scripts/cascading-slot-state-store";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { BetControlStore } from "../bet-control-store";
import { CascadingTotalBetHandlers } from "../cascading-total-bet-handlers";
import { CascadingBetControl } from "./cascading-bet-control";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("CascadingTotalBet")
export class CascadingTotalBet extends ObserverComponent {
    @property(StatusButton)
    buttonIncrease: StatusButton = null;

    @property(StatusButton)
    buttonDecrease: StatusButton = null;

    @property(Label)
    totalBetLabel: Label = null;

    @property(Node)
    disabled: Node = null;

    @property(CascadingBetControl)
    betControl: CascadingBetControl = null;
    protected increaseButtonStatus = true;
    protected decreaseButtonStatus = true;

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        this.totalBetLabel.string = totalBet.toString();
    }

    @render(BetControlStore, (store) => store.betLevel, { fireImmediately: false })
    hideDisabledLayer(betLevel: number[]) {
        if (!betLevel) {
            return;
        }
        this.disabled.active = false;
    }

    @handle(CascadingTotalBetHandlers, (handle, status: boolean) => handle.showBetControl())
    onClickOpenBetControl() {}

    @render(CascadingSlotStateStore, (store) => store.state)
    setAllowChangeBet(state: CascadingSlotState) {
        let status = true;
        if (state === CascadingSlotState.Spinning || state === CascadingSlotState.Start_Round) {
            status = false;
        }
        this.buttonIncrease.interactable = status && this.increaseButtonStatus;
        this.buttonDecrease.interactable = status && this.decreaseButtonStatus;
        this.disabled.active = !status;
    }

    onClickDecreaseTotalBet() {
        this.betControl?.onClickDecreaseTotalBet();
    }

    onClickIncreaseTotalBet() {
        this.betControl?.onClickIncreaseTotalBet();
    }
}
