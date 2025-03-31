import { _decorator, Component, instantiate, Node, Prefab, UITransform, v3, Vec3 } from "cc";
import Observer from "observer";
import { hideNode, prefabCache, showNode } from "../../cascading-slot-utils";
import { CascadingSlotReelItem } from "../../slot-reel/scripts/cascading-slot-reel-item";
import { CascadingSymbolPreview } from "./cascading-symbol-preview";
const { observer, render, handle } = Observer;

const { ccclass, property } = _decorator;

@ccclass
export class CascadingPreviewOddsPopup extends Component {
    @property(Node)
    previewOverlay: Node = null;

    @property(Prefab)
    prfPreviewSymbolLeft: Prefab = null;

    @property(Prefab)
    prfPreviewSymbolRight: Prefab = null;
    private currentPreviewItem: Node = null;

    addPreviewPopup(reels) {
        reels.forEach((reel, index) => {
            const isInfoOnLeft = index === reels.length - 1 || index === reels.length - 2;

            reel.items.forEach((item) => {
                this.addReelItemEvent(item, isInfoOnLeft);
            });
        });
    }

    addReelItemEvent(item, isInfoOnLeft) {
        item.node.on(Node.EventType.TOUCH_END, () => {
            if (this.currentPreviewItem === item.node) {
                this.hideSymbolPreview(true);
                return;
            }
            this.currentPreviewItem = item.node;
            const worldPosition = item.node.getComponent(UITransform).convertToWorldSpaceAR(v3());
            this.onSymbolTouched(item, worldPosition, isInfoOnLeft);
        });
    }

    showPreview(previewNode: Node, worldPosition: Vec3) {
        this.previewOverlay.active = true;
        this.hideOtherPreview();
        this.previewOverlay.addChild(previewNode);

        previewNode.position = this.previewOverlay.inverseTransformPoint(new Vec3(), worldPosition);

        showNode(previewNode);
    }

    hideOtherPreview() {
        this.previewOverlay.children.forEach((node) =>
            hideNode(node, {
                onHidden: () => {
                    node.destroy();
                    this.previewOverlay.active = this.previewOverlay.children.length > 0;
                },
            })
        );
    }

    protected onSymbolTouched(symbol: CascadingSlotReelItem, worldPosition: Vec3, isInfoOnLeft: boolean) {
        // if (this.gameId) {
        //     const storage = GameUtils.getGameSetting(this.gameId);
        //     if (!storage.autoSpin) {
        //         this.onSymbolPreview(symbol, worldPosition, isInfoOnLeft);
        //     }
        //     return;
        // }
        //this.onSymbolPreview(symbol, worldPosition, isInfoOnLeft);
        const spine = prefabCache.slotSymbols[symbol.index];
        const previewPrefab = isInfoOnLeft ? this.prfPreviewSymbolLeft : this.prfPreviewSymbolLeft;
        const previewNode = instantiate(previewPrefab);
        const symbolPreview = previewNode.getComponent(CascadingSymbolPreview);
        this.showPreview(previewNode, worldPosition);
        symbolPreview.setInfo({ symbol, spine, odds: {}, colorList: ["#000000", "#000000"], borderColor: "#000000", symbolItem: symbol });
    }

    hideSymbolPreview(hideSymbolPreview: boolean) {
        if (hideSymbolPreview) {
            this.previewOverlay.active = false;
            this.previewOverlay.destroyAllChildren();
            this.currentPreviewItem = null;
        }
    }
}
