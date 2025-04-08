import gc from "@sg/game-client-base";
import { _decorator, Color, Component, Label, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("cascading_history_item")
export class CascadingHistoryItem extends Component {
    @property(Node)
    bg: Node = null;

    @property(Label)
    time: Label = null;

    @property(Label)
    roundID: Label = null;

    @property(Label)
    betLevel: Label = null;

    @property(Label)
    coinValue: Label = null;

    @property(Label)
    totalBet: Label = null;

    @property(Label)
    totalWin: Label = null;

    data: any = null;
    @property
    textHighlightColor: Color = Color.YELLOW;

    @property
    textNormalColor: Color = Color.WHITE;

    setData(data: any) {
        const { betHistoryLog, index } = data;
        const win = betHistoryLog.betwin;
        this.node.active = true;
        this.bg.active = index % 2 > 0;
        this.time.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
        this.roundID.string = betHistoryLog.id;
        this.betLevel.string = betHistoryLog.betLevel;
        this.coinValue.string = betHistoryLog.coinValue;
        this.totalBet.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2);
        this.totalWin.string = gc.FormatUtils.numberWithCommas(win, 2, false);
        this.data = betHistoryLog;

        if (betHistoryLog.betwin > 0) {
            this.time.node.getComponent(Label).color =
                this.betLevel.node.getComponent(Label).color =
                this.coinValue.node.getComponent(Label).color =
                    this.textHighlightColor;
        } else {
            this.time.node.getComponent(Label).color =
                this.betLevel.node.getComponent(Label).color =
                this.coinValue.node.getComponent(Label).color =
                    this.textNormalColor;
        }
    }
}
