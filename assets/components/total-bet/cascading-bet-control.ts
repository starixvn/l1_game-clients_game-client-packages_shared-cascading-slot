import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { GameServiceMessageCascading } from "db://shared-cascading-slot/game-messages-cascading";
import { CascadingSlotConfigsStore } from "db://shared-cascading-slot/stores/cascading-slot-configs-store";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { BetControlHandlers } from "../../handlers/bet-control-handlers";
import { BetControlStore } from "../../stores/bet-control-store";

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

export const CalculateTotalBet = (level: number, coin: number, betMultiplier: number) => {
    return +(level * coin * betMultiplier).toFixed(1);
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

    private totalBetUnique = [];
    private currentCoinIndex = 0;
    private currentBetLevelIndex = 0;
    private currentTotalBetIndex = 0;
    private currentTotalBet = 0;
    private coinValues: number[];
    private betLevels: number[];
    private betMultiplier: number;
    private defaultCoinValue: number;
    private isTrialMode = false;

    betControlStorageKey = "CASCADING_SLOT_BET_CONTROL";
    gameId: number;

    @render(CascadingUIStore, (store) => store.isTrialMode)
    private setTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
    }

    @render(BetControlStore, (store) => store.currentBetLevelIndex)
    private setCurrentBetLevelIndex(currentBetLevelIndex: number) {
        this.currentBetLevelIndex = currentBetLevelIndex;
        this.updateBetLevelLabel();
    }

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentBetLevelIndex(index))
    private handleCurrentBetLevelIndex(currentBetLevelIndex: number) {
        return currentBetLevelIndex;
    }

    private updateBetLevelLabel() {
        if (!this.betLevels || this.betLevels.length <= 0) {
            return;
        }
        const betLevel = this.betLevels[this.currentBetLevelIndex];
        this.betLevel.string = betLevel.toString();
        this.updateBetLevel(betLevel);
    }

    @handle(BetControlHandlers, (handle, betLevel: number) => handle.updateBetLevel(betLevel))
    private updateBetLevel(betLevel: number) {
        return betLevel;
    }

    @render(BetControlStore, (store) => store.currentCoinIndex)
    private setCurrentCoinIndex(currentCoinIndex: number) {
        this.currentCoinIndex = currentCoinIndex;
        this.updateCoinValueLabel();
    }

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentCoinIndex(index))
    private handleCurrentCoinIndex(currentCoinIndex: number) {
        return currentCoinIndex;
    }

    private updateCoinValueLabel() {
        if (!this.coinValues || this.coinValues.length <= 0) {
            return;
        }

        const coinValue = this.coinValues[this.currentCoinIndex];
        this.coinValue.string = coinValue.toString();
        this.updateCoinValue(coinValue);
    }

    @handle(BetControlHandlers, (handle, coinValue: number) => handle.updateCoinValue(coinValue))
    private updateCoinValue(coinValue: number) {
        return coinValue;
    }

    @render(BetControlStore, (store) => store.currentTotalBetIndex, { fireImmediately: false })
    private setCurrentTotalBetIndex(currentTotalBetIndex: number) {
        this.currentTotalBetIndex = currentTotalBetIndex;
    }

    @handle(BetControlHandlers, (handle, index: number) => handle.updateCurrentTotalBetIndex(index))
    private handleCurrentTotalBetIndex(currentTotalBetIndex: number) {
        return currentTotalBetIndex;
    }

    @render(BetControlStore, (store) => store.isOpenBetAmountPopup)
    handleDialogVisibility(status: boolean) {
        this.node.active = status;
    }

    @handle(BetControlHandlers, (handle, status: boolean) => handle.updateStatusBetAmountPopup())
    onCloseBetControl() {}

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    private handleData(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!gameConfigs) {
            return;
        }

        const { coinValues, betLevels, betMultiplier, defaultCoinValue } = gameConfigs;

        this.updateDefaultCoinValue(defaultCoinValue);
        this.updateBetMultiplier(betMultiplier);
        this.updateBetLevels(betLevels);
        this.updateCoinValues(coinValues);
        this.prepareTotalBetData();
        this.updateAllButtonStatus();
        this.loadDataFromStorage();
        this.saveData();
    }

    private updateDefaultCoinValue(defaultCoinValue: number) {
        this.defaultCoinValue = defaultCoinValue;
    }

    private updateBetMultiplier(betMultiplier: number) {
        this.betMultiplier = betMultiplier;
    }

    private updateBetLevels(betLevels: number[]) {
        this.betLevels = [...betLevels];
        this.betLevels.sort((a, b) => a - b);
        this.updateBetLevelLabel();
    }

    private updateCoinValues(coinValues: number[]) {
        this.coinValues = [...coinValues];
        this.coinValues.sort((a, b) => a - b);
        const currentCoinIndex = this.isTrialMode ? 0 : this.findCoinIndex(this.defaultCoinValue);
        this.handleCurrentCoinIndex(currentCoinIndex);
        this.handleTotalBetWithBetValueAndCoinValue(this.betLevels[this.currentBetLevelIndex], this.coinValues[currentCoinIndex]);
        this.updateCoinValueLabel();
    }

    @handle(BetControlHandlers, (handle, totalBet: number) => handle.updateTotalBet(totalBet))
    private handleTotalBetWithBetValueAndCoinValue(betLevelValue: number, coinValue: number) {
        return CalculateTotalBet(betLevelValue, coinValue, this.betMultiplier);
    }

    @handle(BetControlHandlers, (handle, totalBet: number) => handle.updateTotalBet(totalBet))
    private handleTotalBet(totalBet: number) {
        return totalBet;
    }

    @render(BetControlStore, (store) => store.totalBet, { fireImmediately: false })
    private updateTotalBet(totalBet: number) {
        this.currentTotalBet = totalBet;
        const currentTotalBetIndex = this.totalBetUnique.findIndex((detail) => +Object.keys(detail)[0] === this.currentTotalBet);
        this.handleCurrentTotalBetIndex(currentTotalBetIndex);
        this.updateTotalBetLabel(this.currentTotalBet);
    }

    private prepareTotalBetData() {
        const uniqueIds = [];
        const totalBetIncrease = [];
        this.totalBetUnique = [];

        this.coinValues.forEach((coin, indexCoin) => {
            this.betLevels.forEach((level, indexLevel) => {
                totalBetIncrease.push({
                    [CalculateTotalBet(level, coin, this.betMultiplier)]: {
                        coin: coin,
                        level: level,
                        indexCoin: indexCoin,
                        indexLevel: indexLevel,
                    },
                });
            });
        });

        totalBetIncrease.sort((a, b) => +Object.keys(a)[0] - +Object.keys(b)[0]);
        totalBetIncrease.forEach((element) => {
            const isDuplicate = uniqueIds.includes(Object.keys(element)[0]);
            if (!isDuplicate) {
                uniqueIds.push(Object.keys(element)[0]);
                this.totalBetUnique.push(element);
            }
        });
    }

    private updateChangeByLevelOrCoin(saveData = true) {
        this.handleTotalBetWithBetValueAndCoinValue(this.betLevels[this.currentBetLevelIndex], this.coinValues[this.currentCoinIndex]);
        this.updateAllButtonStatus();
        if (saveData) {
            this.saveData();
        }
    }

    protected onClickDecreaseBetLevel() {
        this.playSoundClick();
        if (this.currentBetLevelIndex > 0) {
            this.currentBetLevelIndex--;
            this.handleCurrentBetLevelIndex(this.currentBetLevelIndex);
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickIncreaseBetLevel() {
        this.playSoundClick();
        if (this.currentBetLevelIndex < this.betLevels.length - 1) {
            this.currentBetLevelIndex++;
            this.handleCurrentBetLevelIndex(this.currentBetLevelIndex);
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickDecreaseCoinValue() {
        this.playSoundClick();
        if (this.currentCoinIndex > 0) {
            this.currentCoinIndex--;
            this.handleCurrentCoinIndex(this.currentCoinIndex);
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickIncreaseCoinValue() {
        this.playSoundClick();
        if (this.currentCoinIndex < this.coinValues.length - 1) {
            this.currentCoinIndex++;
            this.handleCurrentCoinIndex(this.currentCoinIndex);
            this.updateChangeByLevelOrCoin();
        }
    }

    onClickDecreaseTotalBet() {
        this.playSoundClick();
        if (this.currentTotalBetIndex > 0) {
            this.currentTotalBetIndex--;
            this.handleCurrentTotalBetIndex(this.currentTotalBetIndex);
            this.handleClickTotalBet();
        }
    }

    onClickIncreaseTotalBet() {
        this.playSoundClick();
        if (this.currentTotalBetIndex < this.totalBetUnique.length - 1) {
            this.currentTotalBetIndex++;
            this.handleCurrentTotalBetIndex(this.currentTotalBetIndex);
            this.handleClickTotalBet();
        }
    }

    private updateTotalBetLabel(totalBet: number) {
        this.totalBet.string = totalBet.toString();
    }

    private handleClickTotalBet() {
        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        const detail = item[total];
        this.handleTotalBet(+total);
        this.handleCurrentBetLevelIndex(detail.indexLevel);
        this.handleCurrentCoinIndex(detail.indexCoin);
        this.updateAllButtonStatus();
        this.saveData();
    }

    private saveData() {
        // const betControl = {
        //     coin: this.coinValues[this.currentCoinIndex],
        //     level: this.betLevels[this.currentBetLevelIndex],
        //     multiplier: this.betMultiplier,
        // };
        // console.log("----------------saveData", betControl);
        // gc.Shared.utils.StorageManager.set("BetControl", betControl);
    }

    private loadDataFromStorage() {
        // const betControl = gc.Shared.utils.StorageManager.get("BetControl");
        // if (!betControl) {
        //     return;
        // }
        // const { coin, level } = betControl as BetControl;
        // this.updateSelectedCoinLevel(coin, level);
    }

    updateSelectedCoinLevel(coin: number, level: number) {
        const coinIndex = this.findCoinIndex(coin);
        const levelIndex = this.betLevels.findIndex((value) => value === level);

        if (coinIndex !== -1 && levelIndex !== -1) {
            this.handleCurrentCoinIndex(coinIndex);
            this.handleCurrentBetLevelIndex(levelIndex);
            this.updateAllButtonStatus();
        }
    }

    private findCoinIndex(coin: number) {
        return this.coinValues.findIndex((value) => value === coin);
    }

    private updateAllButtonStatus() {
        this.updateCoinButtonStatus();
        this.updateLevelButtonStatus();
        this.updateTotalBetButtonStatus();
    }

    private updateLevelButtonStatus() {
        this.nodeButtons[OrderButtonNode.betIncrease].interactable = this.currentBetLevelIndex < this.betLevels.length - 1;
        this.nodeButtons[OrderButtonNode.betDecrease].interactable = this.currentBetLevelIndex > 0;
    }

    private updateCoinButtonStatus() {
        this.nodeButtons[OrderButtonNode.coinIncrease].interactable = this.currentCoinIndex < this.coinValues.length - 1;
        this.nodeButtons[OrderButtonNode.coinDecrease].interactable = this.currentCoinIndex > 0;
    }

    private updateTotalBetButtonStatus() {
        this.nodeButtons[OrderButtonNode.totalIncrease].interactable = this.currentTotalBetIndex < this.totalBetUnique.length - 1;
        this.nodeButtons[OrderButtonNode.totalDecrease].interactable = this.currentTotalBetIndex > 0;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
