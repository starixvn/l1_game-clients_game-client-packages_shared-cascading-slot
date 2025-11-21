import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node, sp } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
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

    @property(sp.Skeleton)
    private readonly spineFreeSpin: sp.Skeleton = null;

    private button: Button = null;

    onLoad(): void {
        this.button = this.getComponent(Button);
        this.node.active = false;
        super.onLoad();
    }

    @render(BuyFreespinsStore, (store) => store.enabled)
    renderEnabled(enabled: boolean) {
        this.node.active = enabled;
    }

    @render(BuyFreespinsStore, (store) => store.totalBet)
    renderTotalBet(totalBet: number) {
        if (totalBet === 0) {
            this.labelTotalBet.string = "";
            return;
        }
        this.labelTotalBet.string = gc.FormatUtils.numberWithCommas(totalBet, 2, false);
    }

    @handle(BuyFreespinsHandler, (handler) => handler.showBuyFsConfirmation())
    onClickBuy() {
        AudioUtils.playClick();
    }

    @render(BuyFreespinsStore, (store) => store.isActive)
    renderBuyFsActive(isActive: boolean) {
        this.nodeActive.active = isActive;
        this.labelTotalBet.node.active = !isActive;
        this.spineFreeSpin?.setAnimation(0, isActive ? "show-active" : "show", true);
    }

    @render(BuyFreespinsStore, (store) => store.disableBuyFs)
    renderDisableBuyFreespins(disableBuyFreespins: boolean) {
        this.button.interactable = !disableBuyFreespins;
        this.spineFreeSpin?.setAnimation(0, disableBuyFreespins ? "disable" : "show", true);
    }
}
