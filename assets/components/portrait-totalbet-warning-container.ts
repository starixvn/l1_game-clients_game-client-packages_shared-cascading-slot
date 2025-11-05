import gc from "@sg/game-client-base";
import { _decorator, instantiate, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingWarningMsg } from "./cascading-warning-msg";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class PortraitTotalBetWarningContainer extends ObserverComponent {
    @property(Prefab)
    prefabTotalBetWarning: Prefab = null;

    private isOpenBetControl = false;

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup, { fireImmediately: false })
    setIsOpenBetControl(isOpenBetControl: boolean) {
        cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] setIsOpenBetControl called", {
            isOpenBetControl,
            previousIsOpenBetControl: this.isOpenBetControl,
            hasPrefab: !!this.prefabTotalBetWarning,
            timestamp: new Date().toISOString()
        });

        this.isOpenBetControl = isOpenBetControl;

        cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] setIsOpenBetControl completed", {
            isOpenBetControl: this.isOpenBetControl,
            timestamp: new Date().toISOString()
        });
    }
    @render(BetControlStore, (store) => store.totalBet, { fireImmediately: false })
    private updateTotalBet(totalBet: number) {
        const formattedTotalBet = gc.FormatUtils.numberWithCommas(totalBet, 2, true);

        cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] updateTotalBet called", {
            totalBet,
            formattedTotalBet,
            isOpenBetControl: this.isOpenBetControl,
            hasPrefab: !!this.prefabTotalBetWarning,
            willShowWarning: !this.isOpenBetControl,
            timestamp: new Date().toISOString()
        });

        if (!this.isOpenBetControl) {
            cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] Creating warning message node", {
                willInstantiatePrefab: true,
                formattedTotalBet,
                timestamp: new Date().toISOString()
            });

            const warningNode = instantiate(this.prefabTotalBetWarning);
            const comp = warningNode.getComponent(CascadingWarningMsg);
            this.node.addChild(warningNode);
            comp.setData(formattedTotalBet);

            cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] Warning message displayed", {
                warningNodeAdded: true,
                hasComponent: !!comp,
                formattedTotalBet,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] Skipping warning display - bet control is open", {
                isOpenBetControl: this.isOpenBetControl,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[PORTRAIT_TOTALBET_WARNING_CONTAINER] updateTotalBet completed", {
            totalBet,
            warningShown: !this.isOpenBetControl,
            timestamp: new Date().toISOString()
        });
    }
}




