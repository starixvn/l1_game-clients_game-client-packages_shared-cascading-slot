import gc from '@sg/game-client-base';
import { _decorator, Label } from 'cc';
import { CascadingTicketDetail } from '../../bet-details/cascading-ticket-detail';
const { ccclass, property } = _decorator;

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
    @property(Label)
    balanceDetail: Label = null;


    setData(data: any) {
        super.setData(data);
        const { betHistoryLog } = data;
        if (betHistoryLog) {
            console.log(betHistoryLog)
            this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            this.betLevelDetail.string = betHistoryLog.betLevel;
            this.coinValueDetail.string = betHistoryLog.coinValue;
            this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2);
        }
    }

    handleMultiplierData(data: any) {
        super.handleMultiplierData(data);
        this.textMultiplier.string = `${gc.Translator.gameTranslate('total_multiplier')}:`;
    }

}



