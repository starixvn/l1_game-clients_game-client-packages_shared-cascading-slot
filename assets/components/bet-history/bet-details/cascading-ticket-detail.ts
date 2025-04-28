import gc from "@sg/game-client-base";
import { _decorator, Button, Color, instantiate, Label, Node, Prefab, sys } from "cc";
import { Dialog } from "db://shared-components/shared/common-components/dialogs/dialog";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingTotalMultiplier } from "../cascading-total-multiplier";
import { CascadingTicketDetailItem } from "./cascading-ticket-detail-item";

const { ccclass, property } = _decorator;
const { handle } = Observer;

export type BetDetailTableType = {
    model: gc.BetHistory.BetDetailModel;
    totalMultiplierPrefab: Prefab;
    detailItemPrefab: Prefab;
};

@ccclass
export class CascadingTicketDetail extends ObserverComponent {
    @property(Label)
    roundId: Label = null;

    @property(Prefab)
    prfTicketDetailItem: Prefab = null;

    @property(Prefab)
    totalMultiplierPrefab: Prefab = null;

    @property(Node)
    content: Node = null;

    @property(Node)
    multiplierNode: Node = null;

    @property(Label)
    multiplierTotal: Label = null;

    @property(Label)
    textMultiplier: Label = null;

    @property(Label)
    winTotal: Label = null;

    @property(Label)
    reachMaxText: Label = null;

    @property(Prefab)
    prfMobileTicketDetailItem: Prefab = null;

    data: any = null;

    setData(data: any) {
        const { betHistoryLog } = data;
        if (!betHistoryLog) {
            return;
        }
        this.data = betHistoryLog;
        const freeSpin = betHistoryLog.freeSpin || false;
        this.roundId.string = freeSpin ? `${betHistoryLog.id} (Free Spin)` : `${betHistoryLog.id}`;
        const tumbles = betHistoryLog.settlementResult.tumbles;
        const isReachMaxWin = betHistoryLog.reachMaxWin;

        let currWinTumble = 0;

        tumbles.forEach((tumble, index) => {
            const detailItem = this.loadDetailItem();
            const control = detailItem.getComponent(CascadingTicketDetailItem);
            if ((index === tumbles.length - 1 && !isReachMaxWin) || index < tumbles.length - 1) {
                currWinTumble += tumble.win;
                control.setData(tumble, index, betHistoryLog, currWinTumble);
                this.content.addChild(detailItem);
            }
            const newTumbleMultipliers = [...tumble.multipliers];
            control.setDataResultBoard(tumble.originalBoard, newTumbleMultipliers);
        });
        this.handleMultiplierData(betHistoryLog);
        this.winTotal.string = gc.FormatUtils.numberWithCommas(betHistoryLog.betwin, 2, false);
        this.reachMaxText.node.active = isReachMaxWin;
    }

    loadDetailItem() {
        return sys.isMobile ? instantiate(this.prfMobileTicketDetailItem) : instantiate(this.prfTicketDetailItem);
    }

    handleMultiplierData(data: any) {
        let lbMulti = "";
        const freeSpin = data.freeSpin || false;
        const tumbles = data.settlementResult.tumbles;
        if (freeSpin) {
            if (data.totalMultipliers) {
                lbMulti = `total_multiplier`;
                this.multiplierTotal.string = data.totalMultiplier;
                this.multiplierTotal.node.getComponent(Label).color = this.textMultiplier.node.getComponent(Label).color = new Color(
                    66,
                    190,
                    254
                );
                this.multiplierNode.active = true;
            }
        } else {
            lbMulti = `multiplier`;
            this.multiplierTotal.string = data.multiplier;
            this.multiplierNode.active = tumbles.length > 1 && +data.multiplier > 0;
        }

        this.textMultiplier.string = `${gc.Translator.gameTranslate(lbMulti)}:`;
        const btnTextMulti = this.textMultiplier.getComponent(Button);
        const btnValueMulti = this.multiplierTotal.getComponent(Button);
        btnTextMulti.interactable = btnValueMulti.interactable = freeSpin;
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickMultiplier() {
        const totalMultiplier = instantiate(this.totalMultiplierPrefab);
        const totalControl = totalMultiplier.getComponent(CascadingTotalMultiplier);
        totalControl.setData(this.data);
        this.node.addChild(totalMultiplier);
    }

    showBetDetail(data: any) {
        this.setData(data);
    }

    @handle(gc.Audios.AudioHandler, (handle) => handle.playSFX(gc.Audios.AudioIds.CLICK))
    onClickClose() {
        const dialogs = this.getComponentsInChildren(Dialog);

        if (dialogs.length > 0) {
            dialogs[0].hide();
        } else {
            this.node.destroy();
        }
    }
}
