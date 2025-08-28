import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, v3, Vec3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingSlotState } from "../../cascading-slot-state";
import { getAudioId, hideNode, resourcesCache, showNode } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
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

    private currentPreviewItem: Node = null;
    public odds: GameServiceMessageCascading.OddsConfig;
    public betLevel = 0;
    public coinValue = 0;
    public colorConfig: any;
    private cascadingState = "";

    onLoad() {
        this.colorConfig = resourcesCache.colorJson;
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
            if (this.cascadingState === CascadingSlotState.SPINNING) {
                return;
            }
            this.playSoundClick();
            if (this.currentPreviewItem === item.node) {
                this.handleSymbolPreviewVisiblity(false);
                return;
            }
            this.currentPreviewItem = item.node;
            const worldPosition = v3(item.node.worldPosition);
            this.onSymbolTouched(item, worldPosition, isInfoOnLeft);
        });
    }

    showPreview(previewNode: Node, worldPosition: Vec3) {
        this.hideOtherPreview();
        this.previewOverlay.addChild(previewNode);

        previewNode.worldPosition = worldPosition;

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
        const clickSymbolAudioId = getAudioId("CLICK_SYMBOL");
        if (clickSymbolAudioId) {
            return clickSymbolAudioId;
        }
        return AudioIds.CLICK;
    }

    @render(CascadingUIStore, (store) => store.cascadingState)
    renderCascadingState(cascadingState: string) {
        this.cascadingState = cascadingState;
    }
}
