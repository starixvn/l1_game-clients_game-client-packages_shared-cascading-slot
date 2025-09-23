import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, UITransform } from "cc";
import { CascadingTicketDetailItem } from "../../bet-details/cascading-ticket-detail-item";
import { CascadingTumbleItem } from "../../../tumbles/cascading-tumble-item";


const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingTicketDetailItem extends CascadingTicketDetailItem {

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        // let numberOfIcon = 0;
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
                    // numberOfIcon++
                    this.content.addChild(tumbleNode);
                });
                // this.calculateHeightRow(numberOfIcon);
            }
        }
        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        if (index === 0) {
            this.index.string = 'Initial Spin';
        } else {
            this.index.string = `Tumble ${(index).toString()}`;
        }
    }
    calculateHeightRow(numberOfIcon: number) {
        // let tumbleHeight = this.tumbleWinDetailItemPrefab.data.getComponent(UITransform).height;
        // let newTumbleHeight = numberOfIcon * tumbleHeight;
        // if (newTumbleHeight) {
        //     this.tumbleWinDetailItemPrefab.data.getComponent(UITransform).height = newTumbleHeight;
        // }
        // console.log(tumbleHeight)
    }
}
