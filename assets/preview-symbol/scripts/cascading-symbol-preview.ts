import gc from "@sg/game-client-base";
import { _decorator, Color, Component, instantiate, Label, Node, sp, Sprite, SpriteAtlas, UIRenderer, UITransform } from "cc";
import { SpecialSymbol } from "../../cascading-slot-utils";
import { CascadingSlotReelItem } from "../../slot-reel/scripts/cascading-slot-reel-item";
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
    bg: Node = null;

    @property(Node)
    textImages: Node = null;

    @property(Label)
    multiplierLabel: Label = null;

    @property(Node)
    content: Node = null;

    @property(SpriteAtlas)
    gameAtlas: SpriteAtlas = null;

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
        const nodeTmp = instantiate(info.symbolItem.content.children[0]);
        this.content.addChild(nodeTmp);
        const skeleton = nodeTmp.getComponent(sp.Skeleton);
        skeleton.setAnimation(0, "highlight", false);
        this.border.getComponent(UIRenderer).color = new Color().fromHEX(info.borderColor);
        //this.renderInfo(info);
        //this.checkShowSpecialSymbol(info);
    }

    renderNormalSymbol(info: CascadingSymbolPreviewType) {
        const { odds, colorList, coinValue, betLevel, symbolItem, freespin } = info;
        let firstLabelWidth = 0;

        this.infoNode.children.forEach((node, index) => {
            let values;
            let show;

            if (symbolItem.index === SpecialSymbol.SCATTER_SYMBOL) {
                show = index < freespin.length && freespin[index].odds > 0;
                const count = freespin[index].count >= 6 ? `≥${freespin[index].count}` : `${freespin[index].count}`;
                values = [count, `${freespin[index].odds}`];
            } else {
                show = index < odds.length && odds[index].odds > 0;
                values = [
                    `${odds[index].from}-${odds[index].to}`,
                    `${gc.FormatUtils.numberWithCommas(odds[index].odds * coinValue * betLevel, 3)}`,
                ];
            }

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

    showSymbolText(symbolNumber: number, textColor: string) {
        const showText = symbolNumber === SpecialSymbol.FREESPIN || symbolNumber === SpecialSymbol.BONUS;

        if (!showText) {
            return;
        }

        this.textImages.active = true;
        const symbolName = this.getSymbolName(symbolNumber);
        this.textImages.children.forEach((node) => {
            const nodeImage = node.getComponent(Sprite);

            // nodeImage.spriteFrame = this.gameAtlas.getSpriteFrame(`text-symbol-${symbolName}`);
            // nodeImage.node.color = new Color().fromHEX(textColor);
        });
    }

    findGreaterWidth(node, firstLabelWidth) {
        const firstLabel = node.children[0].getComponent(Label);
        const labelWidth = firstLabel.node.width;
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

    checkShowSpecialSymbol(info) {
        const index = info.symbolItem.index;
        if (index === 9) {
            this.textImages.active = true;
            this.textImages.children.forEach((node) => {
                const lbl = node.getComponent(Label);
                lbl.color = new Color().fromHEX(info.colorList[1]);
            });
        }
    }

    getSymbolName(symbolNumber: number): string {
        let symbolName = "";
        switch (symbolNumber) {
            case SpecialSymbol.FREESPIN:
                symbolName = "freespins";
                break;
            case SpecialSymbol.BONUS:
                symbolName = "bonus";
                break;
        }

        return symbolName;
    }
}
