import gc from "@sg/game-client-base";
import { _decorator, Color, Component, instantiate, Label, Layout, Node, sp, UIRenderer, UITransform, Widget } from "cc";
import { ComponentUtils } from "db://shared-components/shared/utils";
import { SpecialSymbol } from "../../cascading-slot-utils";
import { CascadingSlotReelItem } from "../slot-reel/cascading-slot-reel-item";
const { ccclass, property } = _decorator;

export interface CascadingSymbolPreviewType {
    symbol?: any;
    spine: sp.SkeletonData;
    odds: any;
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
    private bg: Node = null;

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
        this.multiplierLabel.node.getComponent(UIRenderer).color = new Color().fromHEX(colorList[1]);
    }

    showInfoNode(status: boolean) {
        this.infoNode.active = status;
        this.multiplierLabel.node.active = !status;
    }

    setInfo(info: CascadingSymbolPreviewType) {
        this.isLowestRow = this.node.position.y <= this.LOWEST_ROW_Y;
        const nodeTmp = instantiate(info.symbolItem.content.children[0]);
        this.content.addChild(nodeTmp);
        const skeleton = nodeTmp.getComponent(sp.Skeleton);
        skeleton.setAnimation(0, "highlight", false);
        this.border.getComponent(UIRenderer).color = new Color().fromHEX(info.borderColor);
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
        const { odds, colorList, coinValue, betLevel, symbolItem } = info;
        let firstLabelWidth = 0;
        const isScatter = symbolItem.index === SpecialSymbol.SCATTER_SYMBOL;
        this.updateScatterLabel(isScatter, info.freespin[0]);

        this.infoNode.children.forEach((node, index) => {
            const values = [];
            const show = index < odds.length && odds[index].odds > 0;
            const isLast = index === odds.length - 1;
            const quantity = isScatter ? `${isLast ? "≥" : ""}${odds[index].from}` : `${odds[index].from}-${odds[index].to}`;
            values.push(...[quantity, `${gc.FormatUtils.numberWithCommas(odds[index].odds * coinValue * betLevel, 3)}`]);

            if (!show) {
                return;
            }

            node.children.forEach((child, childIndex) => {
                const label = child.getComponent(Label);
                label.string = values[childIndex];
                child.getComponent(UIRenderer).color = new Color().fromHEX(colorList[childIndex]);
                label.updateRenderData();
            });

            firstLabelWidth = this.findGreaterWidth(node, firstLabelWidth);
        });
        this.updateLabelWidth(firstLabelWidth);
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
