import gc from "@sg/game-client-base";
import { _decorator, Button, Label, Node, sp } from "cc";
import Observer from "observer";

import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { cascadingSlotLogger } from "../../cascading-slot-logger";
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
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] onLoad called", {
            nodeName: this.node?.name,
            hasButtonComponent: !!this.getComponent(Button),
            hasLabelTotalBet: !!this.labelTotalBet,
            hasNodeActive: !!this.nodeActive,
            hasSpineFreeSpin: !!this.spineFreeSpin,
            timestamp: new Date().toISOString()
        });

        this.button = this.getComponent(Button);
        this.node.active = false;
        super.onLoad();

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] onLoad completed", {
            buttonComponentFound: !!this.button,
            nodeActiveSet: this.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.enabled)
    renderEnabled(enabled: boolean) {
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderEnabled called", {
            enabled,
            previousNodeActive: this.node.active,
            willSetNodeActive: enabled,
            timestamp: new Date().toISOString()
        });

        this.node.active = enabled;

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderEnabled completed", {
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.totalBet)
    renderTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderTotalBet called", {
            totalBet,
            hasLabelTotalBet: !!this.labelTotalBet,
            previousString: this.labelTotalBet?.string,
            isZeroBet: totalBet === 0,
            timestamp: new Date().toISOString()
        });

        if (totalBet === 0) {
            cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] Setting empty string for zero bet", {
                timestamp: new Date().toISOString()
            });
            this.labelTotalBet.string = "";
            return;
        }

        const formattedBet = gc.FormatUtils.numberWithCommas(totalBet, 2, false);
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] Formatting total bet", {
            totalBet,
            formattedBet,
            timestamp: new Date().toISOString()
        });

        this.labelTotalBet.string = formattedBet;

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderTotalBet completed", {
            finalString: this.labelTotalBet.string,
            timestamp: new Date().toISOString()
        });
    }

    @handle(BuyFreespinsHandler, (handler) => handler.showBuyFsConfirmation())
    onClickBuy() {
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] onClickBuy called", {
            willPlayClickSound: true,
            timestamp: new Date().toISOString()
        });

        AudioUtils.playClick();

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] onClickBuy completed - click sound played", {
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.isActive)
    renderBuyFsActive(isActive: boolean) {
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderBuyFsActive called", {
            isActive,
            previousNodeActive: this.nodeActive?.active,
            previousLabelActive: this.labelTotalBet?.node?.active,
            hasSpineFreeSpin: !!this.spineFreeSpin,
            willSetNodeActive: isActive,
            willSetLabelActive: !isActive,
            animationName: isActive ? "show-active" : "show",
            timestamp: new Date().toISOString()
        });

        this.nodeActive.active = isActive;
        this.labelTotalBet.node.active = !isActive;
        this.spineFreeSpin?.setAnimation(0, isActive ? "show-active" : "show", true);

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderBuyFsActive completed", {
            nodeActive: this.nodeActive?.active,
            labelActive: this.labelTotalBet?.node?.active,
            spineAnimationSet: !!this.spineFreeSpin,
            timestamp: new Date().toISOString()
        });
    }

    @render(BuyFreespinsStore, (store) => store.disableBuyFs)
    renderDisableBuyFreespins(disableBuyFreespins: boolean) {
        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderDisableBuyFreespins called", {
            disableBuyFreespins,
            hasButton: !!this.button,
            previousInteractable: this.button?.interactable,
            hasSpineFreeSpin: !!this.spineFreeSpin,
            willSetInteractable: !disableBuyFreespins,
            animationName: disableBuyFreespins ? "disable" : "show",
            timestamp: new Date().toISOString()
        });

        this.button.interactable = !disableBuyFreespins;
        this.spineFreeSpin?.setAnimation(0, disableBuyFreespins ? "disable" : "show", true);

        cascadingSlotLogger.info("[BUY_FREESPINS_BUTTON] renderDisableBuyFreespins completed", {
            buttonInteractable: this.button?.interactable,
            spineAnimationSet: !!this.spineFreeSpin,
            timestamp: new Date().toISOString()
        });
    }
}
