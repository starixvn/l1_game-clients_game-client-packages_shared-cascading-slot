import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass("cascading_history_item")
export class CascadingHistoryItem extends ObserverComponent {
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
    betHistoryLog: gc.BetHistory.BetHistoryLog = null;
    @property
    textHighlightColor: Color = Color.YELLOW;

    @property
    textNormalColor: Color = Color.WHITE;

    setData(data: any) {
        const { betHistoryLog, index } = data;
        this.betHistoryLog = betHistoryLog;
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

    @handle(gc.BetHistory.BetDetailsHandlers)
    openTicketDetail() {
        this.playSoundClick();
        return this.betHistoryLog;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
