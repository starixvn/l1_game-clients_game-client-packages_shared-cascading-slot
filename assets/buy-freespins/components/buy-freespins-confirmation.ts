import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { BuyFreespinsHandler } from "../handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../handler/buy-freespins-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class BuyFreespinsConfirmation extends ObserverComponent {
    @property(Label)
    private readonly labelTotalBet: Label = null;

    onLoad(): void {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onLoad called", {
            nodeName: this.node?.name,
            hasLabelTotalBet: !!this.labelTotalBet,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        const dialogs = this.node.getComponentsInChildren(Dialog);

        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] Dialog components found", {
            dialogCount: dialogs.length,
            willSetupHideCallback: dialogs.length > 0,
            timestamp: new Date().toISOString()
        });

        if (dialogs.length > 0) {
            dialogs[0].onHideComplete = () => {
                cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] Dialog hide complete callback triggered", {
                    willDestroyNode: true,
                    timestamp: new Date().toISOString()
                });
                this.node.destroy();
            };
        }

        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onLoad completed", {
            dialogsConfigured: dialogs.length > 0,
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.totalBet)
    renderTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] renderTotalBet called", {
            totalBet,
            hasLabelTotalBet: !!this.labelTotalBet,
            previousString: this.labelTotalBet?.string,
            timestamp: new Date().toISOString()
        });

        const formattedBet = gc.FormatUtils.numberWithCommas(totalBet, 2, false);
        this.labelTotalBet.string = formattedBet;

        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] renderTotalBet completed", {
            totalBet,
            formattedBet,
            finalString: this.labelTotalBet.string,
            timestamp: new Date().toISOString()
        });
    }

    @handle(BuyFreespinsHandler, (handler) => handler.sendRequestBuyFreespins())
    sendRequestBuyFreespins() {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] sendRequestBuyFreespins called", {
            willSendRequest: true,
            timestamp: new Date().toISOString()
        });
    }

    onConfirm() {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onConfirm called", {
            willPlayClickSound: true,
            willHideBuyFreespins: true,
            willScheduleRequest: true,
            delaySeconds: 0.2,
            timestamp: new Date().toISOString()
        });

        AudioUtils.playClick();
        this.hideBuyFreespins();

        this.scheduleOnce(this.sendRequestBuyFreespins, 0.2);

        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onConfirm completed", {
            clickSoundPlayed: true,
            hideCalled: true,
            requestScheduled: true,
            timestamp: new Date().toISOString()
        });
    }

    @handle(BuyFreespinsHandler, (handler) => handler.hideBuyFreespins())
    hideBuyFreespins() {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] hideBuyFreespins called", {
            willHide: true,
            timestamp: new Date().toISOString()
        });
    }

    onCancel() {
        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onCancel called", {
            willPlayClickSound: true,
            willHideBuyFreespins: true,
            timestamp: new Date().toISOString()
        });

        AudioUtils.playClick();
        this.hideBuyFreespins();

        cascadingSlotLogger.info("[BUY_FREESPINS_CONFIRMATION] onCancel completed", {
            clickSoundPlayed: true,
            hideCalled: true,
            timestamp: new Date().toISOString()
        });
    }
}

