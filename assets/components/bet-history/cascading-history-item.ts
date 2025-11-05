import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Node } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Initializing CascadingHistoryItem class');

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
        cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Setting data for history item:', {
            index,
            betHistoryLogId: betHistoryLog?.id,
            hasWin: betHistoryLog?.betwin > 0,
            winAmount: betHistoryLog?.betwin,
            isFreeSpin: betHistoryLog?.freeSpin
        });

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

        cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Data set successfully:', {
            time: this.time.string,
            roundID: this.roundID.string,
            totalBet: this.totalBet.string,
            totalWin: this.totalWin.string,
            backgroundActive: this.bg.active
        });

        if (betHistoryLog.betwin > 0) {
            cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Applying highlight color for winning bet');
            this.time.node.getComponent(Label).color =
                this.betLevel.node.getComponent(Label).color =
                this.coinValue.node.getComponent(Label).color =
                this.textHighlightColor;
        } else {
            cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Applying normal color for non-winning bet');
            this.time.node.getComponent(Label).color =
                this.betLevel.node.getComponent(Label).color =
                this.coinValue.node.getComponent(Label).color =
                this.textNormalColor;
        }
    }

    @handle(gc.BetHistory.BetDetailsHandlers)
    openTicketDetail() {
        cascadingSlotLogger.info('[CASCADING_HISTORY_ITEM] Opening ticket detail for bet:', {
            betHistoryLogId: this.betHistoryLog?.id,
            roundID: this.betHistoryLog?.id,
            totalWin: this.betHistoryLog?.betwin
        });
        this.playSoundClick();
        return this.betHistoryLog;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}



