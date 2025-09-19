import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node } from "cc";
import { CascadingTicketDetailItem } from "../../bet-details/cascading-ticket-detail-item";
import { CascadingTumbleItem } from "../../../tumbles/cascading-tumble-item";


const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingTicketDetailItem extends CascadingTicketDetailItem {

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        let tumbleNode: Node;
        const freeSpins = data.settlementResult.freeSpins;
        const winFreeSpinOnlyCash = freeSpins?.odds === 0 && freeSpins?.win > 0;
        const isFreeSpin = freeSpins?.odds > 0 || winFreeSpinOnlyCash;
        const freeSpin = data.freeSpin;
        if (index === data.settlementResult.tumbles.length - 1 && isFreeSpin) {
            this.setDataHaveFreeSpin({
                ...freeSpins,
                index,
                currWinTumble,
                extraFreeSpin: freeSpin,
            });
        } else {
            if (tumble.win > 0) {
                Object.entries<{ count; win }>(tumble.icons).forEach(([key, value]) => {
                    tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
                    const control = tumbleNode.getComponent(CascadingTumbleItem);
                    const { count, win } = value;
                    control.setData(+key, count, win);
                    this.content.addChild(tumbleNode);
                });
            }
        }
        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        if (index === 0) {
            this.index.string = 'Initial Spin';
        } else {
            this.index.string = `Tumble ${(index + 1).toString()}`;
        }
    }
    calculateHeightRow(numberOfIcon: number) { }
}
