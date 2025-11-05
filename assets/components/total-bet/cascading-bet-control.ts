import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { BetControlStore } from "../../stores/bet-control-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

export type TotalBetType = { coin: number; level: number; totalBet: number; increase: boolean; decrease: boolean };

export type BetMultiplier = {
    coinValues: number[];
    betLevels: number[];
    betMultiplier: number;
    defaultCoinValue: number;
};

enum OrderButtonNode {
    betDecrease = 0,
    betIncrease,
    coinDecrease,
    coinIncrease,
    totalDecrease,
    totalIncrease,
}

type BetControl = {
    coin: number;
    level: number;
    multiplier: number;
};

@ccclass("CascadingBetControl")
export class CascadingBetControl extends ObserverComponent {
    @property(Label)
    betLevel: Label = null;

    @property(Label)
    coinValue: Label = null;

    @property(Label)
    totalBet: Label = null;

    @property(StatusButton)
    nodeButtons: StatusButton[] = [];

    private isTrialMode = false;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    private setTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] setTrialMode called", {
            isTrialMode,
            previousIsTrialMode: this.isTrialMode,
            willUpdateTrialMode: true,
            timestamp: new Date().toISOString()
        });

        this.isTrialMode = isTrialMode;

        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Trial mode updated", {
            newIsTrialMode: this.isTrialMode,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup)
    handleDialogVisibility(status: boolean) {
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] handleDialogVisibility called", {
            status,
            hasNode: !!this.node,
            currentNodeActive: this.node?.active,
            willSetNodeActive: true,
            timestamp: new Date().toISOString()
        });

        this.node.active = status;

        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Dialog visibility updated", {
            status,
            finalNodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.totalBet)
    private renderTotalBet(totalBet: number) {
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] renderTotalBet called", {
            totalBet,
            hasTotalBetLabel: !!this.totalBet,
            currentTotalBetString: this.totalBet?.string,
            willFormatNumber: true,
            timestamp: new Date().toISOString()
        });

        const formattedBet = gc.FormatUtils.numberWithCommas(totalBet, 2, true);
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Formatting total bet", {
            originalBet: totalBet,
            formattedBet,
            timestamp: new Date().toISOString()
        });

        this.totalBet.string = formattedBet;

        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Total bet label updated", {
            totalBet,
            formattedBet,
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.betLevel)
    private renderBetLevel(betLevel: number) {
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] renderBetLevel called", {
            betLevel,
            hasBetLevelLabel: !!this.betLevel,
            currentBetLevelString: this.betLevel?.string,
            willConvertToString: true,
            timestamp: new Date().toISOString()
        });

        this.betLevel.string = betLevel.toString();

        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Bet level label updated", {
            betLevel,
            stringValue: betLevel.toString(),
            timestamp: new Date().toISOString()
        });
    }

    @render(BetControlStore, (store) => store.coinValue)
    private renderCoinValue(coinValue: number) {
        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] renderCoinValue called", {
            coinValue,
            hasCoinValueLabel: !!this.coinValue,
            currentCoinValueString: this.coinValue?.string,
            willConvertToString: true,
            timestamp: new Date().toISOString()
        });

        this.coinValue.string = coinValue.toString();

        cascadingSlotLogger.info("[CASCADING_BET_CONTROL] Coin value label updated", {
            coinValue,
            stringValue: coinValue.toString(),
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.dialogOpenEvent, { fireImmediately: false })
    private renderDialogOpenEvent(dialogOpenEvent: { name: string }) {
        if (dialogOpenEvent?.name !== DialogName.BET_CONTROL) {
            this.onCloseBetControl();
        }
    }

    @handle(BetControlHandlers, (handle) => handle.closeBetControl())
    onCloseBetControl() { }

    @handle(BetControlHandlers, (handle) => handle.changeBetLevel(false))
    protected onClickDecreaseBetLevel() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeBetLevel(true))
    protected onClickIncreaseBetLevel() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeCoinValue(false))
    protected onClickDecreaseCoinValue() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeCoinValue(true))
    protected onClickIncreaseCoinValue() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeTotalBet(false))
    onClickDecreaseTotalBet() {
        this.playSoundClick();
    }

    @handle(BetControlHandlers, (handle) => handle.changeTotalBet(true))
    onClickIncreaseTotalBet() {
        this.playSoundClick();
    }

    @render(BetControlStore, (store) => store.interactableBetLevel)
    private updateLevelButtonStatus(interactableBetLevel: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.betIncrease].interactable = interactableBetLevel.increase;
        this.nodeButtons[OrderButtonNode.betDecrease].interactable = interactableBetLevel.decrease;
    }

    @render(BetControlStore, (store) => store.interactableCoinValue)
    private updateCoinButtonStatus(interactableCoinValue: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.coinIncrease].interactable = interactableCoinValue.increase;
        this.nodeButtons[OrderButtonNode.coinDecrease].interactable = interactableCoinValue.decrease;
    }

    @render(BetControlStore, (store) => store.interactableTotalBet)
    private updateTotalBetButtonStatus(interactableTotalBet: { increase: boolean; decrease: boolean }) {
        this.nodeButtons[OrderButtonNode.totalIncrease].interactable = interactableTotalBet.increase;
        this.nodeButtons[OrderButtonNode.totalDecrease].interactable = interactableTotalBet.decrease;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}



