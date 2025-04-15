import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Node, Prefab, UITransform } from "cc";
import { convertData } from "db://shared-cascading-slot/cascading-slot-utils";
import { CascadingSlotBoard } from "db://shared-cascading-slot/components/slot-board/components/cascading-slot-board";
import { CascadingTumbleItem } from "db://shared-cascading-slot/components/tumbles/cascading-tumble-item";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass
export class CascadingTicketDetailItem extends Component {
    @property(Label)
    index: Label = null;

    @property(CascadingSlotBoard)
    resultBoard: CascadingSlotBoard = null;

    @property(Label)
    win: Label = null;

    @property(Prefab)
    tumbleWinDetailItemPrefab: Prefab = null;

    @property(Prefab)
    noTumbleWinDetailPrefab: Prefab = null;

    @property(Node)
    content: Node = null;

    @property({ type: Node })
    lines: Node[] = [];

    protected readonly MIN_HEIGHT_TOTALROW = 178;
    protected readonly HEIGHT_ROW = 89;

    onLoad() {
        this.resultBoard && this.resultBoard.createReels();
    }

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        let numberOfIcon = 0;
        let tumbleNode: Node;
        const countScatter = data.settlementResult.freeSpins.count;
        const countFreeSpin = data.settlementResult.freeSpins.odds;
        const isFreeSpin = countScatter > 3;
        const freeSpin = data.freeSpin;
        if (index === data.settlementResult.tumbles.length - 1 && isFreeSpin) {
            this.setDataHaveFreeSpin(countScatter, countFreeSpin, index, currWinTumble, freeSpin);
        } else {
            if (tumble.win > 0) {
                Object.entries<{ count; win }>(tumble.icons).forEach(([key, value]) => {
                    tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
                    const control = tumbleNode.getComponent(CascadingTumbleItem);
                    const { count, win } = value;
                    control.setData(+key, count, win);
                    numberOfIcon++;
                    this.content.addChild(tumbleNode);
                });
                this.calculateHeightRow(numberOfIcon);
            } else {
                tumbleNode = instantiate(this.noTumbleWinDetailPrefab);
                this.content.addChild(tumbleNode);
            }
        }

        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        this.index.string = (index + 1).toString();
    }

    setDataHaveFreeSpin(count: number, odd: number, index: number, win: number, extraFreeSpin: boolean) {
        const tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
        const control = tumbleNode.getComponent(CascadingTumbleItem);
        control.setDataForFreeSpinTumble(count, odd, extraFreeSpin);
        this.content.addChild(tumbleNode);
        this.win.string = gc.FormatUtils.numberWithCommas(win, 2, false);
        this.index.string = (index + 1).toString();
        this.calculateHeightRow(1);
    }

    setDataResultBoard(symbols: string, multiplier: number[]) {
        const board = convertData(symbols);
        this.resultBoard.setData(board, multiplier);
    }

    calculateHeightRow(numberOfIcon: number) {
        const minHeightRow = this.getMinHeightRow();
        const heightTotalRow = numberOfIcon * this.getHeightRow();
        if (heightTotalRow > minHeightRow) {
            this.node.getComponent(UITransform).height = heightTotalRow;
            this.lines.forEach((line) => {
                line.getComponent(UITransform).height = heightTotalRow;
            });
        } else if (heightTotalRow === minHeightRow) {
            this.node.getComponent(UITransform).height = minHeightRow;
        } else {
            const symbolChilds = this.content.children;
            const detail = symbolChilds[0].children;
            symbolChilds[0].getComponent(UITransform).height = detail[0].getChildByName("line").getComponent(UITransform).height =
                minHeightRow;
        }
    }

    getMinHeightRow() {
        return this.MIN_HEIGHT_TOTALROW;
    }

    getHeightRow() {
        return this.HEIGHT_ROW;
    }
}
