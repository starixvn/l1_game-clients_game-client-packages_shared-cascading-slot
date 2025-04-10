import { _decorator, JsonAsset, Label, Node } from "cc";
import { CascadingSlotState } from "db://shared-cascading-slot/cascading-slot-state";
import { CascadingUIHandler, CascadingUIStore } from "db://shared-cascading-slot/main-ui";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
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

    @property(JsonAsset)
    colorInfo: JsonAsset = null;

    private colorConfig: any;

    @property(CascadingBetControl)
    betControl: CascadingBetControl = null;
    protected increaseButtonStatus = true;
    protected decreaseButtonStatus = true;

    onLoad() {
        this.colorConfig = this.colorInfo.json;
        this.updateColor();
        super.onLoad();
    }

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
    onClickOpenBetControl() {
        this.hideSymbolPreview();
    }

    @render(CascadingUIStore, (store) => store.cascadingState)
    setAllowChangeBet(state: string) {
        let status = true;
        if (state === CascadingSlotState.SPINNING || state === CascadingSlotState.START_ROUND) {
            status = false;
        }

        this.buttonIncrease.interactable = status && this.increaseButtonStatus;
        this.buttonDecrease.interactable = status && this.decreaseButtonStatus;
        this.disabled.active = !status;
    }

    onClickDecreaseTotalBet() {
        this.hideSymbolPreview();
        this.betControl?.onClickDecreaseTotalBet();
    }

    onClickIncreaseTotalBet() {
        this.hideSymbolPreview();
        this.betControl?.onClickIncreaseTotalBet();
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    hideSymbolPreview() {
        return false;
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
    }
}
