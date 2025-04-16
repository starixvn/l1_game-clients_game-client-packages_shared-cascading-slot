import gc from "@sg/game-client-base";
import { _decorator, instantiate, JsonAsset, Node, Prefab, UITransform, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { hideNode, resourcesCache, showNode } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingSlotReelItem } from "../slot-reel/cascading-slot-reel-item";
import { CascadingSymbolPreview } from "./cascading-symbol-preview";
const { observer, render, handle } = Observer;

const { ccclass, property } = _decorator;

@ccclass
export class CascadingPreviewOddsPopup extends ObserverComponent {
    @property(Node)
    previewOverlay: Node = null;

    @property(Prefab)
    prfPreviewSymbolLeft: Prefab = null;

    @property(Prefab)
    prfPreviewSymbolRight: Prefab = null;

    @property(JsonAsset)
    colorInfo: JsonAsset = null;

    private currentPreviewItem: Node = null;
    public odds: any;
    public betLevel = 0;
    public coinValue = 0;
    public colorConfig: any;

    onLoad() {
        this.colorConfig = this.colorInfo.json;
        super.onLoad();
    }

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
            this.playSoundClick();
            if (this.currentPreviewItem === item.node) {
                this.handleSymbolPreviewVisiblity(false);
                return;
            }
            this.currentPreviewItem = item.node;
            const worldPosition = item.node.getComponent(UITransform).convertToWorldSpaceAR(v3());
            this.onSymbolTouched(item, worldPosition, isInfoOnLeft);
        });
    }

    showPreview(previewNode: Node, worldPosition: Vec3) {
        // this.previewOverlay.active = true;
        this.hideOtherPreview();
        this.previewOverlay.addChild(previewNode);

        previewNode.position = this.previewOverlay.getComponent(UITransform).convertToNodeSpaceAR(worldPosition);

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
        const spine = resourcesCache.slotSymbols[symbol.index];
        const previewPrefab = isInfoOnLeft ? this.prfPreviewSymbolLeft : this.prfPreviewSymbolRight;
        const previewNode = instantiate(previewPrefab);
        const symbolPreview = previewNode.getComponent(CascadingSymbolPreview);
        const symbolOdds = this.odds.symbols[symbol.index];
        this.showPreview(previewNode, worldPosition);
        this.handleSymbolPreviewVisiblity(true);
        symbolPreview.setInfo({
            symbol,
            spine,
            odds: symbolOdds,
            coinValue: this.coinValue,
            betLevel: this.betLevel,
            freespin: this.odds.freeSpins.initialOdds,
            colorList: [this.colorConfig.previewOddsSymbolNumberColor, this.colorConfig.previewOddsWinValueColor],
            borderColor: this.colorConfig.previewOddsBorderColor,
            symbolItem: symbol,
        });
    }

    @render(CascadingUIStore, (store) => store.isSymbolPreviewVisible)
    hideSymbolPreview(isSymbolPreviewVisible: boolean) {
        this.previewOverlay.active = isSymbolPreviewVisible;
        if (!isSymbolPreviewVisible) {
            this.previewOverlay.destroyAllChildren();
            this.currentPreviewItem = null;
        }
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    handleSymbolPreviewVisiblity(isVisible: boolean) {
        return isVisible;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return "click";
    }
}
