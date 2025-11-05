import gc from "@sg/game-client-base";
import { _decorator, Label, Node } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { cascadingSlotLogger } from "../../cascading-slot-logger";
import { DialogName, resourcesCache } from "../../cascading-slot-utils";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { BetControlStore } from "../../stores/bet-control-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingBetControl } from "./cascading-bet-control";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass("CascadingTotalBet")
export class CascadingTotalBet extends ObserverComponent {
    @property(StatusButton)
    buttonIncrease: StatusButton = null;

    @property(StatusButton)
    buttonDecrease: StatusButton = null;

    @property(Label)
    totalBetLabel: Label = null;

    @property(Node)
    disabled: Node = null;

    private colorConfig: any;

    @property(CascadingBetControl)
    betControl: CascadingBetControl = null;
    protected increaseButtonStatus = true;
    protected decreaseButtonStatus = true;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onLoad called", {
            nodeName: this.node.name,
            hasButtonIncrease: !!this.buttonIncrease,
            hasButtonDecrease: !!this.buttonDecrease,
            hasTotalBetLabel: !!this.totalBetLabel,
            hasDisabledNode: !!this.disabled,
            hasBetControl: !!this.betControl,
            timestamp: new Date().toISOString()
        });

        this.colorConfig = resourcesCache.colorJson;
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Color config loaded", {
            hasColorConfig: !!this.colorConfig,
            timestamp: new Date().toISOString()
        });

        this.updateColor();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Color update called", {
            colorUpdateCalled: true,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onLoad completed", {
            superOnLoadCalled: true,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] updateTotalBet called", {
            totalBet,
            hasTotalBetLabel: !!this.totalBetLabel,
            willFormatNumber: true,
            timestamp: new Date().toISOString()
        });

        this.totalBetLabel.string = gc.FormatUtils.numberWithCommas(totalBet, 2, true);
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Total bet label updated", {
            totalBet,
            formattedString: this.totalBetLabel.string,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] updateTotalBet completed", {
            totalBet,
            finalLabelString: this.totalBetLabel.string,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    renderChangeTotalBet(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] renderChangeTotalBet called", {
            interactableTotalBet,
            hasButtonIncrease: !!this.buttonIncrease,
            hasButtonDecrease: !!this.buttonDecrease,
            currentIncreaseInteractable: this.buttonIncrease?.interactable,
            currentDecreaseInteractable: this.buttonDecrease?.interactable,
            timestamp: new Date().toISOString()
        });

        this.buttonIncrease.interactable = interactableTotalBet.increase;
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Increase button interactable set", {
            interactableTotalBetIncrease: interactableTotalBet.increase,
            buttonIncreaseInteractable: this.buttonIncrease.interactable,
            timestamp: new Date().toISOString()
        });

        this.buttonDecrease.interactable = interactableTotalBet.decrease;
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Decrease button interactable set", {
            interactableTotalBetDecrease: interactableTotalBet.decrease,
            buttonDecreaseInteractable: this.buttonDecrease.interactable,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] renderChangeTotalBet completed", {
            finalIncreaseInteractable: this.buttonIncrease?.interactable,
            finalDecreaseInteractable: this.buttonDecrease?.interactable,
            timestamp: new Date().toISOString()
        });
    }

    @handle(BetControlHandlers, (handle) => handle.showBetControl())
    onClickOpenBetControl() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickOpenBetControl called", {
            willTriggerOpenBetControl: true,
            timestamp: new Date().toISOString()
        });

        this.triggerOpenBetControl();

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickOpenBetControl completed", {
            triggerOpenBetControlCalled: true,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.disabledOpenInputBet)
    setAllowChangeBet(disableInputBet: boolean) {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] setAllowChangeBet called", {
            disableInputBet,
            hasDisabledNode: !!this.disabled,
            currentDisabledActive: this.disabled?.active,
            timestamp: new Date().toISOString()
        });

        this.disabled.active = disableInputBet;
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Disabled node active set", {
            disableInputBet,
            disabledActive: this.disabled.active,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] setAllowChangeBet completed", {
            disableInputBet,
            finalDisabledActive: this.disabled.active,
            timestamp: new Date().toISOString()
        });
    }

    onClickDecreaseTotalBet() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickDecreaseTotalBet called", {
            willOpenBetControl: true,
            hasBetControl: !!this.betControl,
            timestamp: new Date().toISOString()
        });

        this.onClickOpenBetControl();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Bet control opened", {
            timestamp: new Date().toISOString()
        });

        this.betControl?.onClickDecreaseTotalBet();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Decrease total bet called on bet control", {
            betControlDecreaseCalled: !!this.betControl,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickDecreaseTotalBet completed", {
            timestamp: new Date().toISOString()
        });
    }

    onClickIncreaseTotalBet() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickIncreaseTotalBet called", {
            willOpenBetControl: true,
            hasBetControl: !!this.betControl,
            timestamp: new Date().toISOString()
        });

        this.onClickOpenBetControl();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Bet control opened", {
            timestamp: new Date().toISOString()
        });

        this.betControl?.onClickIncreaseTotalBet();
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Increase total bet called on bet control", {
            betControlIncreaseCalled: !!this.betControl,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] onClickIncreaseTotalBet completed", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.BET_CONTROL))
    triggerOpenBetControl() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] triggerOpenBetControl called", {
            dialogName: DialogName.BET_CONTROL,
            timestamp: new Date().toISOString()
        });

        // Empty implementation - handler will be called by decorator
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] triggerOpenBetControl completed", {
            timestamp: new Date().toISOString()
        });
    }

    updateColor() {
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] updateColor called", {
            hasNode: !!this.node,
            hasColorConfig: !!this.colorConfig,
            bottomAreaTextColor: this.colorConfig?.bottomAreaTextColor,
            bottomAreaNumberColor: this.colorConfig?.bottomAreaNumberColor,
            bottomAreaButtonBorderColor: this.colorConfig?.bottomAreaButtonBorderColor,
            timestamp: new Date().toISOString()
        });

        const changeNodeColors = this.node.getComponentsInChildren(ChangeNodeColor);
        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Found ChangeNodeColor components", {
            componentsCount: changeNodeColors.length,
            timestamp: new Date().toISOString()
        });

        changeNodeColors.forEach((comp, index) => {
            cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Processing ChangeNodeColor component", {
                index,
                componentNodeName: comp.node.name,
                timestamp: new Date().toISOString()
            });

            const labelComp = comp.node.getComponent(Label);
            cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Label component check", {
                index,
                hasLabelComponent: !!labelComp,
                timestamp: new Date().toISOString()
            });

            if (labelComp) {
                const hasLocalizedLabel = !!comp.node.getComponent("LocalizedLabel");
                const colorToUse = hasLocalizedLabel ? this.colorConfig.bottomAreaTextColor : this.colorConfig.bottomAreaNumberColor;
                cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Updating label color", {
                    index,
                    hasLocalizedLabel,
                    colorToUse,
                    timestamp: new Date().toISOString()
                });

                comp.updateColor(colorToUse);
                cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Label color updated", {
                    index,
                    colorUpdated: true,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Updating non-label color", {
                    index,
                    colorToUse: this.colorConfig.bottomAreaButtonBorderColor,
                    timestamp: new Date().toISOString()
                });

                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
                cascadingSlotLogger.info("[CASCADING_TOTAL_BET] Non-label color updated", {
                    index,
                    colorUpdated: true,
                    timestamp: new Date().toISOString()
                });
            }
        });

        cascadingSlotLogger.info("[CASCADING_TOTAL_BET] updateColor completed", {
            totalComponentsProcessed: changeNodeColors.length,
            timestamp: new Date().toISOString()
        });
    }
}


