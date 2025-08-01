import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Node, Prefab, sys, UITransform } from "cc";
import { convertData } from "db://shared-cascading-slot/cascading-slot-utils";
import { CascadingSlotBoard } from "db://shared-cascading-slot/components/slot-board/components/cascading-slot-board";
import { CascadingTumbleItem } from "db://shared-cascading-slot/components/tumbles/cascading-tumble-item";
import Observer from "observer";

const { ccclass, property } = _decorator;
const { handle } = Observer;

export type FreeSpinData = {
    count: number;
    odds: number;
    win?: number;
    index: number;
    currWinTumble: number;
    extraFreeSpin: boolean;
};

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
    private readonly MIN_HEIGHT_TOTALROW_MOBILE = 250;
    private readonly HEIGHT_ROW_MOBILE = 125;

    onLoad() {
        this.resultBoard && this.resultBoard.createReels();
    }

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        let numberOfIcon = 0;
        let tumbleNode: Node;
        const freeSpins = data.settlementResult.freeSpins;
        const isFreeSpin = freeSpins?.odds > 0 || freeSpins?.win > 0;
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

    setDataHaveFreeSpin(data: FreeSpinData) {
        const tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
        const control = tumbleNode.getComponent(CascadingTumbleItem);
        control.setDataForFreeSpinTumble(data);
        this.content.addChild(tumbleNode);
        this.win.string = gc.FormatUtils.numberWithCommas(data.currWinTumble, 2, false);
        this.index.string = (data.index + 1).toString();
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
        return sys.isMobile ? this.MIN_HEIGHT_TOTALROW_MOBILE : this.MIN_HEIGHT_TOTALROW;
    }

    getHeightRow() {
        return sys.isMobile ? this.HEIGHT_ROW_MOBILE : this.HEIGHT_ROW;
    }
}
