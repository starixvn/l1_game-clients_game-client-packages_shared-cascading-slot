import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { BuyFreespinsHandler } from "../handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsButton extends ObserverComponent {
    @property(Label)
    private readonly labelTotalBet: Label = null;

    @property(Node)
    private readonly nodeActive: Node = null;

    private button: Button = null;

    onLoad(): void {
        this.button = this.getComponent(Button);
        super.onLoad();
    }

    @render(BuyFreespinsStore, (store) => store.totalBet)
    renderTotalBet(totalBet: number) {
        if (totalBet === 0) {
            this.labelTotalBet.string = "";
            return;
        }
        this.labelTotalBet.string = gc.FormatUtils.numberWithCommas(totalBet, 2);
    }

    @handle(BuyFreespinsHandler, (handler) => handler.showBuyFsConfirmation())
    onClickBuy() {
        AudioUtils.playClick();
    }

    @render(BuyFreespinsStore, (store) => store.isActive)
    renderBuyFsActive(isActive: boolean) {
        this.nodeActive.active = isActive;
        this.labelTotalBet.node.active = !isActive;
    }

    @render(CascadingUIStore, (store) => store.disableBuyFreespins)
    renderDisableBuyFreespins(disableBuyFreespins: boolean) {
        this.button.interactable = !disableBuyFreespins;
    }
}
