import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import Observer from "observer";

import { AudioIds } from "db://assets/game/audios/AudioIds";
import { FSBPromotionUIStore } from "db://shared-common-slot/index";
import { audioManager } from "db://shared-components/game/audios/scripts/audio-manager";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
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
    private isTriggerDuringFreeSpinBonus = false;

    onLoad() {
        super.onLoad();
        const dialogs = this.node.getComponentsInChildren(Dialog);
        if (dialogs.length > 0) {
            dialogs[0].onHideComplete = () => {
                this.node.destroy();
            };
        }
        AudioUtils.playStoppableSFX(AudioIds.STINGER_WINCOUNT, true);
        if (audioManager.audioConfigs[AudioIds.STINGER_WINCOUNT]) {
            this.handleFadeBGM(false);
        }
    }

    @render(CascadingUIStore, (store) => store.triggerDuringFreeSpinBonus)
    triggerDuringFreeSpinBonus(triggerDuringFreeSpinBonus: boolean) {
        this.isTriggerDuringFreeSpinBonus = triggerDuringFreeSpinBonus;
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        return fadeBGM;
    }

    @render(BuyFreespinsStore, (store) => store.buyFsResult)
    renderTotalWin(total: BuyFsResult) {
        if (!total) {
            return;
        }

        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(total.totalWin, 2, false);
        this.labelTotalFreespins.string = total.numberOfFreeSpins.toString();
    }

    @handle(BuyFreespinsHandler, (handler) => handler.closeCongratulation())
    onClose() {
        this.handleFadeBGM(!this.isTriggerDuringFreeSpinBonus);
        AudioUtils.stopStoppableSFX(AudioIds.STINGER_WINCOUNT);
        AudioUtils.playClick();
    }

    @render(FSBPromotionUIStore, (store) => store.canSpinNextFSB)
    renderCanSpinNextFSB(canSpinNextFSB: boolean) {
        if (canSpinNextFSB) {
            this.scheduleOnce(this.onClose, 3);
        }
    }

    onDestroy(): void {
        super.onDestroy();
        this.unscheduleAllCallbacks();
    }
}
