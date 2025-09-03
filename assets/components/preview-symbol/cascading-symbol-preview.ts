import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Layout, log, Node, sp, UITransform, Widget } from "cc";
import { ComponentUtils } from "db://shared-components/shared/utils";
import { SpecialSymbol } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotReelItem } from "../slot-reel/cascading-slot-reel-item";
const { ccclass, property } = _decorator;

export interface CascadingSymbolPreviewType {
    symbol?: any;
    spine: sp.SkeletonData;
    odds: GameServiceMessageCascading.Odd[];
    colorList: [string, string];
    borderColor: string;
    coinValue?: number;
    betLevel?: number;
    freespin?: any;
    symbolItem: CascadingSlotReelItem;
}

@ccclass
export class CascadingSymbolPreview extends Component {
    @property(sp.Skeleton)
    icon: sp.Skeleton = null;

    @property(Node)
    infoNode: Node = null;

    @property(Node)
    border: Node = null;

    @property(Node)
    textImages: Node = null;

    @property(Label)
    multiplierLabel: Label = null;

    @property(Node)
    content: Node = null;

    @property(Label)
    scatterLabel: Label = null;

    @property
    padding = 10;

    protected isLowestRow = false;
    protected readonly LOWEST_ROW_Y = -200;
    protected bg: Node = null;
    protected hasSymbolOdds = false;

    protected onLoad(): void {
        this.bg = this.node.getChildByName("bg");
        this.scatterLabel && (this.scatterLabel.node.active = false);
    }

    hidePreview() {
        this.node.parent.active = false;
        this.node.destroy();
    }

    renderInfo(info: CascadingSymbolPreviewType) {
        const { symbolItem } = info;
        if (symbolItem.index >= SpecialSymbol.MULTIPLIER_SYMBOL) {
            this.showInfoNode(false);
            this.renderMultiplierSymbol(info);
        } else {
            this.showInfoNode(true);
            this.renderNormalSymbol(info);
        }
    }

    renderMultiplierSymbol(info: CascadingSymbolPreviewType) {
        const { colorList } = info;
        ComponentUtils.setNodeColor(this.multiplierLabel.node, colorList[1]);
    }

    showInfoNode(status: boolean) {
        this.infoNode.active = status;
        this.multiplierLabel.node.active = !status;
    }

    setInfo(info: CascadingSymbolPreviewType) {
        this.hasSymbolOdds = !!info.odds && Object.values(info.odds).some((value) => value.odds > 0);
        log(`hasSymbolOdds `, this.hasSymbolOdds);
        this.isLowestRow = this.node.position.y <= this.LOWEST_ROW_Y;
        const nodeTmp = instantiate(info.symbolItem.content.children[0]);
        this.content.addChild(nodeTmp);
        const skeleton = nodeTmp.getComponent(sp.Skeleton);
        skeleton.setAnimation(0, "highlight", false);

        ComponentUtils.setNodeColor(this.border, info.borderColor);
        this.renderInfo(info);
        this.scheduleOnce(this.updateBackground, 0); //trick, delay to wait labels update width
    }

    updateBackground() {
        if (!this.bg) {
            return;
        }

        const layouts = this.getComponentsInChildren(Layout);
        const verticalLayout = layouts.find((layout) => layout.node.name === "vertical");
        verticalLayout.verticalDirection = this.isLowestRow
            ? Layout.VerticalDirection.TOP_TO_BOTTOM
            : Layout.VerticalDirection.BOTTOM_TO_TOP;
        verticalLayout.updateLayout();

        const horizontalLayout = layouts.find((layout) => layout.node.name === "horizon");
        horizontalLayout.updateLayout();

        const widthScatterLabel = this.scatterLabel?.node?.active
            ? this.scatterLabel.node.getComponent(UITransform)?.getBoundingBox().width
            : 0;
        const horizonWidth = horizontalLayout.getComponent(UITransform).width;

        const width = Math.max(horizonWidth, widthScatterLabel) + 2 * this.padding;
        const height = verticalLayout.getComponent(UITransform).height;
        ComponentUtils.setNodeTransform(this.bg, {
            width,
            height,
        });
        const bgChildWidget = this.bg.getComponentInChildren(Widget);
        bgChildWidget.updateAlignment();

        const bgWidget = this.bg.getComponent(Widget);
        const verticalWidget = verticalLayout.node.getComponent(Widget);
        const widgets = [bgWidget, verticalWidget];
        widgets.forEach((widget) => {
            const offset = 0;
            widget.bottom = offset;
            widget.top = offset;
            widget.isAlignBottom = this.isLowestRow;
            widget.isAlignTop = !this.isLowestRow;

            widget.updateAlignment();
        });
    }

    renderNormalSymbol(info: CascadingSymbolPreviewType) {
        const { odds, colorList, coinValue, betLevel, symbolItem, freespin } = info;
        let firstLabelWidth = 0;
        const isScatter = symbolItem.index === SpecialSymbol.SCATTER_SYMBOL;
        if (isScatter) {
            if (this.hasSymbolOdds) {
                this.updateScatterLabel(isScatter, info.freespin[0]);
            } else {
                this.updateFreespinImages(info);
            }
        }

        const infoOdds = isScatter && !this.hasSymbolOdds ? freespin : odds;

        this.infoNode.children.forEach((node, index) => {
            const values = [];
            const show = index < infoOdds.length && infoOdds[index].odds > 0;
            const isLast = index === infoOdds.length - 1;
            const quantity = this.createQuantityString({ isScatter, isLast, infoOdds, index, freespin });
            const value = this.createValueString({ isScatter, freespin, index, infoOdds, coinValue, betLevel });
            values.push(...[quantity, value]);

            if (!show) {
                return;
            }

            node.children.forEach((child, childIndex) => {
                const label = child.getComponent(Label);
                label.string = values[childIndex];
                ComponentUtils.setNodeColor(child, colorList[childIndex]);
                label.updateRenderData();
            });

            firstLabelWidth = this.findGreaterWidth(node, firstLabelWidth);
        });
        this.updateLabelWidth(firstLabelWidth);
    }

    private roundUp(value: number, decimals: number = 2): number {
        const multiplier = Math.pow(10, decimals);
        return Math.ceil(value * multiplier) / multiplier;
    }

    private createValueString(data: {
        isScatter: boolean;
        freespin: any;
        index: number;
        infoOdds: any;
        coinValue: number;
        betLevel: number;
    }) {
        const { isScatter, freespin, index, infoOdds, coinValue, betLevel } = data;
        if (isScatter && !this.hasSymbolOdds) {
            return `${freespin[index].odds}`;
        }

        const calculatedValue = infoOdds[index].odds * coinValue * betLevel;
        const roundedValue = this.roundUp(calculatedValue);
        return `${gc.FormatUtils.numberWithCommas(roundedValue, 3)}`;
    }

    private createQuantityString(data: { isScatter: boolean; isLast: boolean; infoOdds: any; index: number; freespin: any }) {
        const { isScatter, isLast, infoOdds, index, freespin } = data;
        let quantity = "";

        if (isScatter) {
            if (this.hasSymbolOdds) {
                quantity = `${isLast ? "≥" : ""}${infoOdds[index].from}`;
            } else {
                quantity = `${isLast ? "≥" : ""}${freespin[index].count}`;
            }
        } else {
            quantity = `${infoOdds[index].from}-${infoOdds[index].to}`;
        }
        return quantity;
    }

    updateFreespinImages(info) {
        this.textImages.active = true;
        this.textImages.children.forEach((node) => {
            ComponentUtils.setNodeColor(node, info.colorList[1]);
        });
    }

    findGreaterWidth(node, firstLabelWidth) {
        const firstLabel = node.children[0].getComponent(Label);
        const labelWidth = firstLabel.node.getComponent(UITransform).width;
        labelWidth > firstLabelWidth && (firstLabelWidth = labelWidth);
        return firstLabelWidth;
    }

    updateLabelWidth(newWidth: number) {
        this.infoNode.children.forEach((node) => {
            const firstLabel = node.children[0].getComponent(Label);
            firstLabel.overflow = Label.Overflow.CLAMP;
            firstLabel.node.getComponent(UITransform).width = newWidth;
            firstLabel.enableWrapText = false;
        });
    }

    updateScatterLabel(isScatter: boolean, data: { count: number; odds: number }) {
        if (this.scatterLabel) {
            if (isScatter) {
                this.scatterLabel.string = gc.Translator.translate("cascadingslot.scatter_odds_preview", {
                    numOfScatters: data.count,
                    numOfSpins: data.odds,
                });
            }
            this.scatterLabel.node.active = isScatter;
        }
    }
}
