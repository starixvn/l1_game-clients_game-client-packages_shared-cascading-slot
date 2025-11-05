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
import { cascadingSlotLogger } from "../../cascading-slot-logger";


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
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Component loaded, isTriggerDuringFreeSpinBonus: ${this.isTriggerDuringFreeSpinBonus}`);
        super.onLoad();
        const dialogs = this.node.getComponentsInChildren(Dialog);
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Found ${dialogs.length} dialog components`);
        if (dialogs.length > 0) {
            dialogs[0].onHideComplete = () => {
                cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Dialog hide complete, destroying node`);
                this.node.destroy();
            };
        }
        AudioUtils.playStoppableSFX(AudioIds.STINGER_WINCOUNT, true);
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Playing stinger audio, has audio config: ${!!audioManager.audioConfigs[AudioIds.STINGER_WINCOUNT]}`);
        if (audioManager.audioConfigs[AudioIds.STINGER_WINCOUNT]) {
            this.handleFadeBGM(false);
        }
    }

    @render(CascadingUIStore, (store) => store.triggerDuringFreeSpinBonus)
    triggerDuringFreeSpinBonus(triggerDuringFreeSpinBonus: boolean) {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] triggerDuringFreeSpinBonus updated to: ${triggerDuringFreeSpinBonus}`);
        this.isTriggerDuringFreeSpinBonus = triggerDuringFreeSpinBonus;
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] handleFadeBGM called with fadeBGM: ${fadeBGM}`);
        return fadeBGM;
    }

    @render(BuyFreespinsStore, (store) => store.buyFsResult)
    renderTotalWin(total: BuyFsResult) {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] renderTotalWin called with result:`, total);
        if (!total) {
            cascadingSlotLogger.info(`[BuyFreespinsCongratulation] No buyFsResult data, returning early`);
            return;
        }

        this.labelTotalWin.string = gc.FormatUtils.numberWithCommas(total.totalWin, 2, false);
        this.labelTotalFreespins.string = total.numberOfFreeSpins.toString();
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Updated labels - totalWin: ${this.labelTotalWin.string}, freeSpins: ${this.labelTotalFreespins.string}`);
    }

    @handle(BuyFreespinsHandler, (handler) => handler.closeCongratulation())
    onClose() {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] onClose called, isTriggerDuringFreeSpinBonus: ${this.isTriggerDuringFreeSpinBonus}`);
        this.handleFadeBGM(!this.isTriggerDuringFreeSpinBonus);
        AudioUtils.stopStoppableSFX(AudioIds.STINGER_WINCOUNT);
        AudioUtils.playClick();
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Stopped stinger audio and played click sound`);
    }

    @render(FSBPromotionUIStore, (store) => store.canSpinNextFSB)
    renderCanSpinNextFSB(canSpinNextFSB: boolean) {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] renderCanSpinNextFSB called with canSpinNextFSB: ${canSpinNextFSB}`);
        if (canSpinNextFSB) {
            cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Scheduling close in 3 seconds`);
            this.scheduleOnce(this.onClose, 3);
        }
    }

    onDestroy(): void {
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Component being destroyed`);
        super.onDestroy();
        this.unscheduleAllCallbacks();
        cascadingSlotLogger.info(`[BuyFreespinsCongratulation] Unscheduled all callbacks`);
    }
}
