import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Node, Prefab, sys, UITransform } from "cc";
import { convertBoardValue, convertData } from "db://shared-cascading-slot/cascading-slot-utils";
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
        if (this.resultBoard) {
            this.resultBoard.renderFromStore = false;
            this.resultBoard.createReels();
        }
    }

    setData(tumble: any, index: number, data: any, currWinTumble: number, xMode: number) {
        let numberOfIcon = 0;
        let tumbleNode: Node;
        const freeSpins = data.settlementResult.freeSpins;
        const winFreeSpinOnlyCash = freeSpins?.odds === 0 && freeSpins?.win > 0;
        const isFreeSpin = freeSpins?.odds > 0 || winFreeSpinOnlyCash;
        const freeSpin = data.freeSpin;
        if (index === data.settlementResult.tumbles.length - 1 && isFreeSpin) {
            tumbleNode = this.setDataHaveFreeSpin({
                ...freeSpins,
                index,
                currWinTumble,
                extraFreeSpin: freeSpin,
            });

        } else if (tumble.win > 0) {
            Object.entries<{ count; win }>(tumble.icons).forEach(([key, value]) => {
                tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
                const control = tumbleNode.getComponent(CascadingTumbleItem);
                const { count, win } = value;
                control.setData(+key, count, win, xMode);
                numberOfIcon++;
                this.content.addChild(tumbleNode);
            });
            this.calculateHeightRow(numberOfIcon);
        }

        if (tumble.win === 0) {
            tumbleNode = instantiate(this.noTumbleWinDetailPrefab);
            this.content.addChild(tumbleNode);
        }

        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        this.updateIndexLabel(index);
    }

    protected updateIndexLabel(index: string | number) {
        this.index.string = typeof index === 'string' ? index : (index + 1).toString();
    }

    setDataHaveFreeSpin(data: FreeSpinData) {
        const tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
        const control = tumbleNode.getComponent(CascadingTumbleItem);
        control.setDataForFreeSpinTumble(data);
        this.content.addChild(tumbleNode);
        this.win.string = gc.FormatUtils.numberWithCommas(data.currWinTumble, 6);
        this.index.string = (data.index + 1).toString();
        this.calculateHeightRow(1);
        return tumbleNode;
    }

    setDataResultBoard(symbols: string, multiplier: number[]) {
        const board = convertData(symbols);
        this.resultBoard.setData(board, multiplier);
    }

    showNoWinBoard() {
        this.resultBoard.showNoWinBoard();
    }

    highlightExplodedSymbols(symbols: number[]) {
        if (symbols.length === 0) {
            return;
        }
        const values = convertBoardValue(symbols);
        this.resultBoard.highlightExplodedSymbols(values);
    }

    highlightScatterSymbolDetail() {
        this.resultBoard.highlightScatterSymbolDetail();
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
