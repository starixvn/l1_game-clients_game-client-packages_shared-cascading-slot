import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, UITransform } from "cc";
import { CascadingTumbleItem } from "../../../tumbles/cascading-tumble-item";
import { CascadingTicketDetailItem } from "../../bet-details/cascading-ticket-detail-item";

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
            } else {
                tumbleNode = instantiate(this.noTumbleWinDetailPrefab);
                this.content.addChild(tumbleNode);
            }
        }

        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        this.index.string = (index + 1).toString();
        this.calculateHeightRow();
    }

    calculateHeightRow() {
        const groupItemNode = this.node.getChildByName("group-item");
        if (!groupItemNode) {
            return;
        }
        let totalHeight = 0;
        groupItemNode.children.forEach((child) => {
            const uiTransform = child.getComponent(UITransform);
            if (uiTransform) {
                const childHeight = uiTransform.height;
                totalHeight += childHeight;
                console.log(childHeight);
            }
        });

        this.node.getComponent(UITransform).height = totalHeight;
        console.log(totalHeight);
    }
}
