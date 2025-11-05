import gc from "@sg/game-client-base";
import { _decorator, Component, instantiate, Label, Layout, log, Node, sp, UITransform, Widget } from "cc";
import { ComponentUtils } from "db://shared-components/shared/utils";
import { SpecialSymbol } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotReelItem } from "../slot-reel/cascading-slot-reel-item";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] onLoad called", {
            hasNode: !!this.node,
            hasIcon: !!this.icon,
            hasInfoNode: !!this.infoNode,
            hasBorder: !!this.border,
            hasTextImages: !!this.textImages,
            hasMultiplierLabel: !!this.multiplierLabel,
            hasContent: !!this.content,
            hasScatterLabel: !!this.scatterLabel,
            padding: this.padding,
            isLowestRow: this.isLowestRow,
            lowestRowY: this.LOWEST_ROW_Y,
            hasSymbolOdds: this.hasSymbolOdds,
            willGetBgNode: true,
            willDeactivateScatterLabel: !!this.scatterLabel,
            timestamp: new Date().toISOString()
        });

        this.bg = this.node.getChildByName("bg");
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Background node retrieved", {
            hasBg: !!this.bg,
            timestamp: new Date().toISOString()
        });

        this.scatterLabel && (this.scatterLabel.node.active = false);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Scatter label deactivated", {
            hasScatterLabel: !!this.scatterLabel,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    hidePreview() {
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] hidePreview called", {
            hasNode: !!this.node,
            hasParent: !!this.node?.parent,
            parentActive: this.node?.parent?.active,
            willDeactivateParent: true,
            willDestroyNode: true,
            timestamp: new Date().toISOString()
        });

        this.node.parent.active = false;
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Parent deactivated", {
            timestamp: new Date().toISOString()
        });

        this.node.destroy();
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Node destroyed", {
            timestamp: new Date().toISOString()
        });
    }

    renderInfo(info: CascadingSymbolPreviewType) {
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] renderInfo called", {
            info,
            hasSymbolItem: !!info?.symbolItem,
            symbolItemIndex: info?.symbolItem?.index,
            multiplierSymbol: SpecialSymbol.MULTIPLIER_SYMBOL,
            isMultiplierSymbol: info?.symbolItem?.index >= SpecialSymbol.MULTIPLIER_SYMBOL,
            willShowInfoNode: info?.symbolItem?.index < SpecialSymbol.MULTIPLIER_SYMBOL,
            willRenderMultiplierSymbol: info?.symbolItem?.index >= SpecialSymbol.MULTIPLIER_SYMBOL,
            willRenderNormalSymbol: info?.symbolItem?.index < SpecialSymbol.MULTIPLIER_SYMBOL,
            timestamp: new Date().toISOString()
        });

        const { symbolItem } = info;
        if (symbolItem.index >= SpecialSymbol.MULTIPLIER_SYMBOL) {
            cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Rendering multiplier symbol", {
                symbolIndex: symbolItem.index,
                timestamp: new Date().toISOString()
            });
            this.showInfoNode(false);
            this.renderMultiplierSymbol(info);
        } else {
            cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Rendering normal symbol", {
                symbolIndex: symbolItem.index,
                timestamp: new Date().toISOString()
            });
            this.showInfoNode(true);
            this.renderNormalSymbol(info);
        }

        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] renderInfo completed", {
            symbolIndex: symbolItem.index,
            timestamp: new Date().toISOString()
        });
    }

    renderMultiplierSymbol(info: CascadingSymbolPreviewType) {
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] renderMultiplierSymbol called", {
            info,
            colorList: info?.colorList,
            hasMultiplierLabel: !!this.multiplierLabel,
            willSetNodeColor: true,
            timestamp: new Date().toISOString()
        });

        const { colorList } = info;
        ComponentUtils.setNodeColor(this.multiplierLabel.node, colorList[1]);

        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Multiplier label color set", {
            color: colorList[1],
            timestamp: new Date().toISOString()
        });
    }

    showInfoNode(status: boolean) {
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] showInfoNode called", {
            status,
            hasInfoNode: !!this.infoNode,
            hasMultiplierLabel: !!this.multiplierLabel,
            currentInfoNodeActive: this.infoNode?.active,
            currentMultiplierLabelActive: this.multiplierLabel?.node?.active,
            willSetInfoNodeActive: true,
            willSetMultiplierLabelActive: true,
            timestamp: new Date().toISOString()
        });

        this.infoNode.active = status;
        this.multiplierLabel.node.active = !status;

        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Info node and multiplier label visibility set", {
            infoNodeActive: this.infoNode.active,
            multiplierLabelActive: this.multiplierLabel.node.active,
            timestamp: new Date().toISOString()
        });
    }

    setInfo(info: CascadingSymbolPreviewType) {
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] setInfo called", {
            info,
            hasOdds: !!info?.odds,
            hasSymbolItem: !!info?.symbolItem,
            hasColorList: !!info?.colorList,
            hasBorderColor: !!info?.borderColor,
            hasFreespin: !!info?.freespin,
            coinValue: info?.coinValue,
            betLevel: info?.betLevel,
            willCheckSymbolOdds: true,
            willCheckLowestRow: true,
            willInstantiateSymbol: true,
            willSetBorderColor: true,
            willRenderInfo: true,
            willScheduleBackgroundUpdate: true,
            timestamp: new Date().toISOString()
        });

        this.hasSymbolOdds = !!info.odds && Object.values(info.odds).some((value) => value.odds > 0);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Symbol odds checked", {
            hasSymbolOdds: this.hasSymbolOdds,
            oddsCount: info?.odds ? Object.keys(info.odds).length : 0,
            timestamp: new Date().toISOString()
        });

        log(`hasSymbolOdds `, this.hasSymbolOdds);

        this.isLowestRow = this.node.position.y <= this.LOWEST_ROW_Y;
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Lowest row checked", {
            nodePositionY: this.node.position.y,
            lowestRowY: this.LOWEST_ROW_Y,
            isLowestRow: this.isLowestRow,
            timestamp: new Date().toISOString()
        });

        const nodeTmp = instantiate(info.symbolItem.content.children[0]);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Symbol content instantiated", {
            hasNodeTmp: !!nodeTmp,
            contentChildrenCount: info?.symbolItem?.content?.children?.length || 0,
            timestamp: new Date().toISOString()
        });

        this.content.addChild(nodeTmp);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Node added to content", {
            timestamp: new Date().toISOString()
        });

        const skeleton = nodeTmp.getComponent(sp.Skeleton);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Skeleton component retrieved", {
            hasSkeleton: !!skeleton,
            timestamp: new Date().toISOString()
        });

        skeleton.setAnimation(0, "highlight", false);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Highlight animation set", {
            animation: "highlight",
            loop: false,
            track: 0,
            timestamp: new Date().toISOString()
        });

        ComponentUtils.setNodeColor(this.border, info.borderColor);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Border color set", {
            borderColor: info.borderColor,
            timestamp: new Date().toISOString()
        });

        this.renderInfo(info);
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Info rendered", {
            timestamp: new Date().toISOString()
        });

        this.scheduleOnce(this.updateBackground, 0); //trick, delay to wait labels update width
        cascadingSlotLogger.info("[CASCADING_SYMBOL_PREVIEW] Background update scheduled", {
            delay: 0,
            timestamp: new Date().toISOString()
        });
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

    private createValueString(data: {
        isScatter: boolean;
        freespin: any;
        index: number;
        infoOdds: any;
        coinValue: number;
        betLevel: number;
    }) {
        const { isScatter, freespin, index, infoOdds, coinValue, betLevel } = data;
        return isScatter && !this.hasSymbolOdds
            ? `${freespin[index].odds}`
            : `${gc.FormatUtils.numberWithCommas(infoOdds[index].odds * coinValue * betLevel, 2)}`;
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



