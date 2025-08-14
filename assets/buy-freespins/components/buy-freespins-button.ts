import { _decorator } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BuyFreespinsHandler } from "../handler/buy-freespins-handlers";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsButton extends ObserverComponent {
    @handle(BuyFreespinsHandler, (handler) => handler.showBuyFsConfirmation())
    onClickBuy() {
        AudioUtils.playClick();
    }
}
