import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BuyFreespinsHandler } from "../handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsConfirmation extends ObserverComponent {
    @property(Label)
    private readonly labelTotalBet: Label = null;

    onLoad(): void {
        super.onLoad();
        const dialogs = this.node.getComponentsInChildren(Dialog);
        if (dialogs.length > 0) {
            dialogs[0].onHideComplete = () => {
                this.node.destroy();
            };
        }
    }

    @render(BuyFreespinsStore, (store) => store.totalBet)
    renderTotalBet(totalBet: number) {
        this.labelTotalBet.string = gc.FormatUtils.numberWithCommas(totalBet, 2);
    }

    @handle(BuyFreespinsHandler, (handler) => handler.sendRequestBuyFreespins())
    sendRequestBuyFreespins() {}

    onConfirm() {
        AudioUtils.playClick();
        this.hideBuyFreespins();

        this.scheduleOnce(this.sendRequestBuyFreespins, 0.2);
    }

    @handle(BuyFreespinsHandler, (handler) => handler.hideBuyFreespins())
    hideBuyFreespins() {}

    onCancel() {
        AudioUtils.playClick();
        this.hideBuyFreespins();
    }
}
