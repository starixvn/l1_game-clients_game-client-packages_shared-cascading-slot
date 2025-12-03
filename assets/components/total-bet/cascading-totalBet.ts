import { _decorator, Label, Node } from "cc";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { DialogName, resourcesCache } from "../../cascading-slot-utils";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { BetControlStore } from "../../stores/bet-control-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingBetControl } from "./cascading-bet-control";
import { formatStringXMode } from "db://shared-common-slot/x-mode/scripts/utils/xMode-utils";

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

    private colorConfig: any;

    @property(CascadingBetControl)
    betControl: CascadingBetControl = null;
    protected increaseButtonStatus = true;
    protected decreaseButtonStatus = true;

    onLoad() {
        this.colorConfig = resourcesCache.colorJson;
        this.updateColor();
        super.onLoad();
    }

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        this.totalBetLabel.string = formatStringXMode(totalBet);
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    renderChangeTotalBet(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        this.buttonIncrease.interactable = interactableTotalBet.increase;
        this.buttonDecrease.interactable = interactableTotalBet.decrease;
    }

    @handle(BetControlHandlers, (handle) => handle.showBetControl())
    onClickOpenBetControl() {
        AudioUtils.playClick();
        this.triggerOpenBetControl();
    }

    @render(CascadingUIStore, (store) => store.disabledOpenInputBet)
    setAllowChangeBet(disableInputBet: boolean) {
        this.disabled.active = disableInputBet;
    }

    onClickDecreaseTotalBet() {
        this.onClickOpenBetControl();
        this.betControl?.onClickDecreaseTotalBet();
    }

    onClickIncreaseTotalBet() {
        this.onClickOpenBetControl();
        this.betControl?.onClickIncreaseTotalBet();
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.BET_CONTROL))
    triggerOpenBetControl() {}

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const labelComp = comp.node.getComponent(Label);
            if (labelComp) {
                comp.updateColor(
                    comp.node.getComponent("LocalizedLabel") ? this.colorConfig.bottomAreaTextColor : this.colorConfig.bottomAreaNumberColor
                );
            } else {
                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });
    }
}
