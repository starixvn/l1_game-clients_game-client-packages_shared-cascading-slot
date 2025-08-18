import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BuyFsResult } from "../handler/buy-freespins-definitions";
import { BuyFreespinsHandler } from "../handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsCongratulation extends ObserverComponent {
    @property(Label)
    private readonly labelTotalWin: Label = null;

    @property(Label)
    private readonly labelTotalFreespins: Label = null;

    onLoad(): void {
        super.onLoad();
        const dialogs = this.node.getComponentsInChildren(Dialog);
        if (dialogs.length > 0) {
            dialogs[0].onHideComplete = () => {
                this.node.destroy();
            };
        }
    }

    @render(BuyFreespinsStore, (store) => store.buyFsResult)
    renderTotalWin(total: BuyFsResult) {
        if (!total) {
            return;
        }

        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(total.totalWin, 2);
        this.labelTotalFreespins.string = total.numberOfFreeSpins.toString();
    }

    @handle(BuyFreespinsHandler, (handler) => handler.closeCongratulation())
    onClose() {
        AudioUtils.playClick();
    }
}
