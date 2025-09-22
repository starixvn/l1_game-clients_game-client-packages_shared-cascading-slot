import gc from '@sg/game-client-base';
import { _decorator, Label } from 'cc';
import { CascadingTicketDetail } from '../../bet-details/cascading-ticket-detail';
import { CascadingBetHistoryTable } from '../../cascading-bet-history-table';
import Observer from 'observer';
const { ccclass, property } = _decorator;
const { render } = Observer;

@ccclass
export class PortraitCascadingTicketDetail extends CascadingTicketDetail {
    @property(Label)
    timeDetail: Label = null;
    @property(Label)
    coinValueDetail: Label = null;
    @property(Label)
    betLevelDetail: Label = null;
    @property(Label)
    totalBetDetail: Label = null;

    public betHistory: any[] = [];
    public betHistoryDetial: any = null;
    private currentId: number = 0;

    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: true })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        this.betHistory = betHistoryModel.betLogs;
    }

    setData(data: any) {
        super.setData(data);
        const { betHistoryLog } = data;
        if (betHistoryLog) {
            this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            this.betLevelDetail.string = betHistoryLog.betLevel;
            this.coinValueDetail.string = betHistoryLog.coinValue;
            this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2);
            this.currentId = betHistoryLog.id;
        }
    }



    handleMultiplierData(data: any) {
        super.handleMultiplierData(data);
        this.textMultiplier.string = `${gc.Translator.gameTranslate('total_multiplier')}:`;
    }

    onClickClose() {
        const betHistoryTable = this.node.scene.getComponentInChildren(CascadingBetHistoryTable);
        if (betHistoryTable) {
            betHistoryTable.onClickClose();
            super.onClickClose();
        }
    }


    onClickBackToHistory() {
        super.onClickClose();
    }

    findCurrentIndex() {
        return this.betHistory.findIndex((item) => item.id === this.currentId);
    }

    onClickPreviousHistoryDetail() {
        const index = this.findCurrentIndex();
        if (index > 0) {
            this.currentId = (this.betHistory[index - 1]).id;
            this.updateHistoryDetail();
        }
        console.log("previous", this.currentId)
    }
    onClickNextHistoryDetail() {
        const index = this.findCurrentIndex();
        if (index >= 0 && index < this.betHistory.length - 1) {
            this.currentId = (this.betHistory[index + 1]).id;
            this.updateHistoryDetail();
        }
        console.log("next", this.currentId)
    }

    updateHistoryDetail() {
        const newItem = this.betHistory.find(item => item.id === this.currentId);
        this.betHistoryDetial = {
            betHistoryLog: newItem
        }
        this.content.removeAllChildren();
        this.multiplierNode.active = false;
        this.setData(this.betHistoryDetial);
    }

}



