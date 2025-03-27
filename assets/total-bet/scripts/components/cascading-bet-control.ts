import { _decorator, Component, Label } from "cc";
import { StatusButton } from "db://shared-components/shared/common-components/button/status-button";
import { ChangeLabelColor } from "db://shared-components/shared/common-components/label/change-label-color";

const { ccclass, property } = _decorator;

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

enum StatusAction {
    decrease = "decrease",
    increase = "increase",
}

export const CalculateTotalBet = (level: number, coin: number, betMultiplier: number) => {
    return +(level * coin * betMultiplier).toFixed(1);
};

@ccclass("CascadingBetControl")
export class CascadingBetControl extends Component {
    @property(Label)
    betLevel: Label = null;

    @property(Label)
    coinValue: Label = null;

    @property(Label)
    totalBet: Label = null;

    @property(StatusButton)
    nodeButtons: StatusButton[] = [];

    private readonly TrialModeDefaultBetLevelIndex = 4;
    private readonly DefaultBetLevelIndex = 0;

    private totalBetUnique = [];
    private currentCoinIndex = 0;
    private currentBetLevelIndex = this.DefaultBetLevelIndex;
    private currentTotalBetIndex = 0;
    private currentTotalBet = 0;
    private coinValues: number[];
    private betLevels: number[];
    private betMultiplier: number;
    // private placeBetModel: CascadingSlotPlaceBetModel;
    // private uiModel: CascadingUIModel;
    private isTrialMode = false;

    betControlStorageKey = "CASCADING_SLOT_BET_CONTROL";
    gameId: number;

    closeBetControl = () => {};

    resetValues(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
        this.currentBetLevelIndex = isTrialMode ? this.TrialModeDefaultBetLevelIndex : this.DefaultBetLevelIndex;
        this.currentTotalBetIndex = 0;
        // const data = GameUtils.getGameSetting(this.gameId);
        // data.betControl = null;
        // GameUtils.setGameSetting(this.gameId, data);
    }

    init(callback: () => void) {
        this.closeBetControl = callback;
    }

    showView(status: boolean, action?: string) {
        this.node.active = status;

        action === StatusAction.increase && this.onClickIncreaseTotalBet();
        action === StatusAction.decrease && this.onClickDecreaseTotalBet();
    }

    onCloseBetControl() {
        // AudioManager.getInstance().playClick();
        this.closeBetControl();
    }

    // onSetData(data: BetMultiplier, placeBetModel: CascadingSlotPlaceBetModel, uiModel: CascadingUIModel) {
    onSetData(data: BetMultiplier, placeBetModel: any, uiModel: any) {
        // this.placeBetModel = placeBetModel;
        // this.uiModel = uiModel;
        if (data) {
            this.handleData(data);
            this.loadDataFromStorage();
            this.updatePlaceBetAndUIModel();
            this.saveData();
        }
    }

    private handleData(data: BetMultiplier) {
        this.betMultiplier = data.betMultiplier;
        this.prepareBetLevelData(data);
        this.prepareCoinData(data);
        this.prepareTotalBetData();
        this.updateChangeByLevelOrCoin(false);
    }

    private prepareBetLevelData(data) {
        this.betLevels = [...data.betLevels];
        this.betLevels.sort((a, b) => a - b);
    }

    private prepareCoinData(data) {
        this.coinValues = [...data.coinValues];
        this.coinValues.sort((a, b) => a - b);
        this.currentCoinIndex = this.isTrialMode ? 0 : this.findCoinIndex(data.defaultCoinValue);
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
        this.updateTotalBet(this.betLevels[this.currentBetLevelIndex], this.coinValues[this.currentCoinIndex]);
        this.updateDisplayLabels();
        this.updateAllButtonStatus();
        this.updatePlaceBetAndUIModel();
        saveData && this.saveData();
    }

    protected onClickDecreaseBetLevel() {
        // AudioManager.getInstance().playClick();
        if (this.currentBetLevelIndex > 0) {
            this.currentBetLevelIndex--;
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickIncreaseBetLevel() {
        // AudioManager.getInstance().playClick();
        if (this.currentBetLevelIndex < this.betLevels.length - 1) {
            this.currentBetLevelIndex++;
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickDecreaseCoinValue() {
        // AudioManager.getInstance().playClick();
        if (this.currentCoinIndex > 0) {
            this.currentCoinIndex--;
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickIncreaseCoinValue() {
        // AudioManager.getInstance().playClick();
        if (this.currentCoinIndex < this.coinValues.length - 1) {
            this.currentCoinIndex++;
            this.updateChangeByLevelOrCoin();
        }
    }

    protected onClickDecreaseTotalBet() {
        if (this.currentTotalBetIndex > 0) {
            this.currentTotalBetIndex--;
            this.handleClickTotalBet();
        }
    }

    protected onClickIncreaseTotalBet() {
        if (this.currentTotalBetIndex < this.totalBetUnique.length - 1) {
            this.currentTotalBetIndex++;
            this.handleClickTotalBet();
        }
    }

    private updateTotalBet(betLevelValue: number, coinValue: number) {
        const totalBet = CalculateTotalBet(betLevelValue, coinValue, this.betMultiplier);
        this.currentTotalBet = totalBet;
        this.currentTotalBetIndex = this.totalBetUnique.findIndex((detail) => +Object.keys(detail)[0] === this.currentTotalBet);
    }

    private updateDisplayLabels() {
        this.coinValue.string = this.coinValues[this.currentCoinIndex].toString();
        this.betLevel.string = this.betLevels[this.currentBetLevelIndex].toString();
        this.totalBet.string = this.currentTotalBet.toLocaleString("en-US");
    }

    private handleClickTotalBet() {
        const item = this.totalBetUnique[this.currentTotalBetIndex];
        const total = Object.keys(item)[0];
        const detail = item[total];
        this.currentBetLevelIndex = detail.indexLevel;
        this.currentCoinIndex = detail.indexCoin;
        this.currentTotalBet = +total;

        this.updateDisplayLabels();
        this.updateAllButtonStatus();
        this.updatePlaceBetAndUIModel();
        this.saveData();
    }

    private saveData() {
        const betControl = {
            coin: this.coinValues[this.currentCoinIndex],
            level: this.betLevels[this.currentBetLevelIndex],
            multiplier: this.betMultiplier,
        };
        // const data = GameUtils.getGameSetting(this.gameId);
        // data.betControl = betControl;
        // GameUtils.setGameSetting(this.gameId, data);
    }

    private loadDataFromStorage() {
        // const data = GameUtils.getGameSetting(this.gameId);
        // if (!data.betControl) {
        //     return;
        // }
        // const { coin, level } = data.betControl;
        // this.updateSelectedCoinLevel(coin, level);
    }

    updateSelectedCoinLevel(coin: number, level: number) {
        const coinIndex = this.findCoinIndex(coin);
        const levelIndex = this.betLevels.findIndex((value) => value === level);

        if (coinIndex !== -1 && levelIndex !== -1) {
            this.currentCoinIndex = coinIndex;
            this.currentBetLevelIndex = levelIndex;
            this.updateTotalBet(level, coin);
            this.updateDisplayLabels();
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

    updatePlaceBetAndUIModel() {
        // this.placeBetModel.change({
        //     betLevel: this.betLevels[this.currentBetLevelIndex],
        //     coinValue: this.coinValues[this.currentCoinIndex],
        //     totalBet: this.currentTotalBet,
        // });
        // this.uiModel.emit(CascadingUIModel.Events.CHANGE_TOTAL_BET, this.generateBetControlData());
    }

    private generateBetControlData(): TotalBetType {
        return {
            totalBet: this.currentTotalBet,
            coin: this.coinValues[this.currentCoinIndex],
            level: this.betLevels[this.currentBetLevelIndex],
            increase: this.nodeButtons[OrderButtonNode.totalIncrease].interactable,
            decrease: this.nodeButtons[OrderButtonNode.totalDecrease].interactable,
        };
    }

    updateColor(colorList) {
        const { textColor, numberColor, buttonBorderColor } = colorList;

        this.getComponentsInChildren(ChangeLabelColor).forEach((comp) => {
            const labelComp = comp.node.getComponent(Label);
            if (labelComp) {
                comp.updateColor(comp.node.getComponent("LocalizedLabel") ? textColor : numberColor);
            } else {
                comp.updateColor(buttonBorderColor);
            }
        });
    }
}
