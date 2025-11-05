import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Node, Prefab, sys, UITransform } from "cc";
import { convertBoardValue, convertData } from "db://shared-cascading-slot/cascading-slot-utils";
import { CascadingSlotBoard } from "db://shared-cascading-slot/components/slot-board/components/cascading-slot-board";
import { CascadingTumbleItem } from "db://shared-cascading-slot/components/tumbles/cascading-tumble-item";
import Observer from "observer";
import { cascadingSlotLogger } from "../../../cascading-slot-logger";


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
        cascadingSlotLogger.info("CascadingTicketDetailItem: onLoad called");
        if (this.resultBoard) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: configuring resultBoard");
            this.resultBoard.renderFromStore = false;
            this.resultBoard.createReels();
            cascadingSlotLogger.info("CascadingTicketDetailItem: resultBoard configured");
        }
    }

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        cascadingSlotLogger.info("CascadingTicketDetailItem: setData called with", { tumble, index, data, currWinTumble });
        let numberOfIcon = 0;
        let tumbleNode: Node;
        const freeSpins = data.settlementResult.freeSpins;
        cascadingSlotLogger.info("CascadingTicketDetailItem: freeSpins data", freeSpins);
        const winFreeSpinOnlyCash = freeSpins?.odds === 0 && freeSpins?.win > 0;
        const isFreeSpin = freeSpins?.odds > 0 || winFreeSpinOnlyCash;
        cascadingSlotLogger.info("CascadingTicketDetailItem: isFreeSpin", isFreeSpin, "winFreeSpinOnlyCash", winFreeSpinOnlyCash);
        const freeSpin = data.freeSpin;
        if (index === data.settlementResult.tumbles.length - 1 && isFreeSpin) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: setting data for free spin tumble");
            tumbleNode = this.setDataHaveFreeSpin({
                ...freeSpins,
                index,
                currWinTumble,
                extraFreeSpin: freeSpin,
            });

        } else if (tumble.win > 0) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: processing tumble with win > 0", tumble.win);
            Object.entries<{ count; win }>(tumble.icons).forEach(([key, value]) => {
                cascadingSlotLogger.info("CascadingTicketDetailItem: processing icon", key, value);
                tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
                const control = tumbleNode.getComponent(CascadingTumbleItem);
                const { count, win } = value;
                control.setData(+key, count, win);
                numberOfIcon++;
                this.content.addChild(tumbleNode);
            });
            this.calculateHeightRow(numberOfIcon);
        }

        if (tumble.win === 0) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: tumble has no win, creating no win detail");
            tumbleNode = instantiate(this.noTumbleWinDetailPrefab);
            this.content.addChild(tumbleNode);
        }

        this.win.string = gc.FormatUtils.numberWithCommas(currWinTumble, 2, false);
        cascadingSlotLogger.info("CascadingTicketDetailItem: win string set to", this.win.string);
        this.updateIndexLabel(index);
    }

    protected updateIndexLabel(index: string | number) {
        this.index.string = typeof index === 'string' ? index : (index + 1).toString();
    }

    setDataHaveFreeSpin(data: FreeSpinData) {
        cascadingSlotLogger.info("CascadingTicketDetailItem: setDataHaveFreeSpin called with", data);
        const tumbleNode = instantiate(this.tumbleWinDetailItemPrefab);
        cascadingSlotLogger.info("CascadingTicketDetailItem: instantiated tumbleWinDetailItemPrefab");
        const control = tumbleNode.getComponent(CascadingTumbleItem);
        control.setDataForFreeSpinTumble(data);
        this.content.addChild(tumbleNode);
        this.win.string = gc.FormatUtils.numberWithCommas(data.currWinTumble, 2, false);
        cascadingSlotLogger.info("CascadingTicketDetailItem: win string set to", this.win.string);
        this.index.string = (data.index + 1).toString();
        cascadingSlotLogger.info("CascadingTicketDetailItem: index string set to", this.index.string);
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
        cascadingSlotLogger.info("CascadingTicketDetailItem: calculateHeightRow called with numberOfIcon", numberOfIcon);
        const minHeightRow = this.getMinHeightRow();
        const heightTotalRow = numberOfIcon * this.getHeightRow();
        cascadingSlotLogger.info("CascadingTicketDetailItem: minHeightRow", minHeightRow, "heightTotalRow", heightTotalRow);
        if (heightTotalRow > minHeightRow) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: setting height to heightTotalRow", heightTotalRow);
            this.node.getComponent(UITransform).height = heightTotalRow;
            this.lines.forEach((line) => {
                line.getComponent(UITransform).height = heightTotalRow;
            });
        } else if (heightTotalRow === minHeightRow) {
            cascadingSlotLogger.info("CascadingTicketDetailItem: setting height to minHeightRow", minHeightRow);
            this.node.getComponent(UITransform).height = minHeightRow;
        } else {
            cascadingSlotLogger.info("CascadingTicketDetailItem: adjusting symbol child height");
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
