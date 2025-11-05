import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, v3, Vec3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingSlotState } from "../../cascading-slot-state";
import { DialogName, hideNode, resourcesCache, showNode } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingSlotReelItem } from "../slot-reel/cascading-slot-reel-item";
import { CascadingSymbolPreview } from "./cascading-symbol-preview";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] onLoad called", {
            hasPreviewOverlay: !!this.previewOverlay,
            hasPrfPreviewSymbolLeft: !!this.prfPreviewSymbolLeft,
            hasPrfPreviewSymbolRight: !!this.prfPreviewSymbolRight,
            currentPreviewItem: !!this.currentPreviewItem,
            odds: !!this.odds,
            betLevel: this.betLevel,
            coinValue: this.coinValue,
            cascadingState: this.cascadingState,
            willLoadColorConfig: true,
            timestamp: new Date().toISOString()
        });

        this.colorConfig = resourcesCache.colorJson;
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Color config loaded", {
            hasColorConfig: !!this.colorConfig,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    addPreviewPopup(reels) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] addPreviewPopup called", {
            reelsCount: reels?.length,
            hasReels: !!reels,
            willProcessReels: true,
            timestamp: new Date().toISOString()
        });

        reels.forEach((reel, index) => {
            const isInfoOnLeft = index > reels.length - 4;
            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Processing reel", {
                reelIndex: index,
                reelItemsCount: reel?.items?.length,
                isInfoOnLeft,
                willAddReelItemEvents: true,
                timestamp: new Date().toISOString()
            });

            reel.items.forEach((item) => {
                cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Adding event to item", {
                    reelIndex: index,
                    itemIndex: item?.index,
                    itemSymbol: item?.isScatterSymbol ? "scatter" : item?.isMultiplierSymbol ? "multiplier" : "regular",
                    timestamp: new Date().toISOString()
                });
                this.addReelItemEvent(item, isInfoOnLeft);
            });
        });

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] addPreviewPopup completed", {
            totalReelsProcessed: reels?.length,
            timestamp: new Date().toISOString()
        });
    }

    addReelItemEvent(item, isInfoOnLeft) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] addReelItemEvent called", {
            itemIndex: item?.index,
            isInfoOnLeft,
            hasItemNode: !!item?.node,
            willAddTouchEvent: true,
            timestamp: new Date().toISOString()
        });

        item.node.on(Node.EventType.TOUCH_END, () => {
            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Symbol touched", {
                itemIndex: item?.index,
                cascadingState: this.cascadingState,
                isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
                currentPreviewItem: this.currentPreviewItem === item.node,
                willHandleTouch: this.cascadingState !== CascadingSlotState.SPINNING,
                timestamp: new Date().toISOString()
            });

            if (this.cascadingState === CascadingSlotState.SPINNING) {
                cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Ignoring touch during spinning", {
                    timestamp: new Date().toISOString()
                });
                return;
            }

            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Playing sound click", {
                timestamp: new Date().toISOString()
            });
            this.playSoundClick();

            if (this.currentPreviewItem === item.node) {
                cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Same item touched, closing preview", {
                    timestamp: new Date().toISOString()
                });
                this.triggerOpenPreviewOdd(false);
                return;
            }

            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] New item touched, showing preview", {
                timestamp: new Date().toISOString()
            });
            this.currentPreviewItem = item.node;
            const worldPosition = v3(item.node.worldPosition);
            this.onSymbolTouched(item, worldPosition, isInfoOnLeft);
        });

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Touch event added successfully", {
            itemIndex: item?.index,
            isInfoOnLeft,
            timestamp: new Date().toISOString()
        });
    }

    showPreview(previewNode: Node, worldPosition: Vec3) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] showPreview called", {
            hasPreviewNode: !!previewNode,
            worldPosition,
            hasPreviewOverlay: !!this.previewOverlay,
            willHideOtherPreview: true,
            willAddChild: true,
            willSetWorldPosition: true,
            willShowNode: true,
            timestamp: new Date().toISOString()
        });

        this.hideOtherPreview();
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Other previews hidden", {
            timestamp: new Date().toISOString()
        });

        this.previewOverlay.addChild(previewNode);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview node added to overlay", {
            timestamp: new Date().toISOString()
        });

        previewNode.worldPosition = worldPosition;
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] World position set", {
            worldPosition,
            timestamp: new Date().toISOString()
        });

        showNode(previewNode);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview node shown", {
            timestamp: new Date().toISOString()
        });
    }

    hideOtherPreview() {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] hideOtherPreview called", {
            previewOverlayChildrenCount: this.previewOverlay?.children?.length,
            hasPreviewOverlay: !!this.previewOverlay,
            willHideAllChildren: true,
            timestamp: new Date().toISOString()
        });

        this.previewOverlay.children.forEach((node, index) =>
            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Hiding child node", {
                childIndex: index,
                nodeName: node.name,
                willDestroyNode: true,
                willUpdateOverlayActive: true,
                timestamp: new Date().toISOString()
            }),
            hideNode(node, {
                onHidden: () => {
                    cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Child node hidden, destroying", {
                        nodeName: node.name,
                        remainingChildrenCount: this.previewOverlay.children.length,
                        timestamp: new Date().toISOString()
                    });
                    node.destroy();
                    this.previewOverlay.active = this.previewOverlay.children.length > 0;
                    cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Overlay active updated", {
                        overlayActive: this.previewOverlay.active,
                        remainingChildrenCount: this.previewOverlay.children.length,
                        timestamp: new Date().toISOString()
                    });
                },
            })
        );

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] hideOtherPreview completed", {
            timestamp: new Date().toISOString()
        });
    }

    protected onSymbolTouched(symbol: CascadingSlotReelItem, worldPosition: Vec3, isInfoOnLeft: boolean) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] onSymbolTouched called", {
            symbolIndex: symbol?.index,
            worldPosition,
            isInfoOnLeft,
            hasSymbol: !!symbol,
            hasOdds: !!this.odds,
            hasColorConfig: !!this.colorConfig,
            willGetSpineData: true,
            willInstantiatePreview: true,
            willShowPreview: true,
            willTriggerOpenDialog: true,
            willSetPreviewInfo: true,
            timestamp: new Date().toISOString()
        });

        const spine = resourcesCache.slotSymbols[symbol.index];
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Spine data retrieved", {
            symbolIndex: symbol.index,
            hasSpine: !!spine,
            timestamp: new Date().toISOString()
        });

        const previewPrefab = isInfoOnLeft ? this.prfPreviewSymbolLeft : this.prfPreviewSymbolRight;
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview prefab selected", {
            isInfoOnLeft,
            hasPreviewPrefab: !!previewPrefab,
            prefabName: isInfoOnLeft ? "Left" : "Right",
            timestamp: new Date().toISOString()
        });

        const previewNode = instantiate(previewPrefab);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview node instantiated", {
            hasPreviewNode: !!previewNode,
            timestamp: new Date().toISOString()
        });

        const symbolPreview = previewNode.getComponent(CascadingSymbolPreview);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Symbol preview component retrieved", {
            hasSymbolPreview: !!symbolPreview,
            timestamp: new Date().toISOString()
        });

        const symbolOdds = this.odds.symbols[symbol.index];
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Symbol odds retrieved", {
            symbolIndex: symbol.index,
            hasSymbolOdds: !!symbolOdds,
            oddsData: symbolOdds,
            timestamp: new Date().toISOString()
        });

        this.showPreview(previewNode, worldPosition);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview shown", {
            timestamp: new Date().toISOString()
        });

        this.triggerOpenPreviewOdd(true);
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview dialog triggered", {
            timestamp: new Date().toISOString()
        });

        const info = {
            symbol,
            spine,
            odds: symbolOdds,
            coinValue: this.coinValue,
            betLevel: this.betLevel,
            freespin: this.odds.freeSpins.initialOdds,
            colorList: [this.colorConfig.previewOddsSymbolNumberColor, this.colorConfig.previewOddsWinValueColor],
            borderColor: this.colorConfig.previewOddsBorderColor,
            symbolItem: symbol,
        };

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Setting preview info", {
            info,
            timestamp: new Date().toISOString()
        });

        symbolPreview.setInfo(info);

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] onSymbolTouched completed", {
            symbolIndex: symbol?.index,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isSymbolPreviewVisible)
    hideSymbolPreview(isSymbolPreviewVisible: boolean) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] hideSymbolPreview called", {
            isSymbolPreviewVisible,
            hasPreviewOverlay: !!this.previewOverlay,
            currentOverlayActive: this.previewOverlay?.active,
            previewOverlayChildrenCount: this.previewOverlay?.children?.length,
            hasCurrentPreviewItem: !!this.currentPreviewItem,
            willSetOverlayActive: true,
            willDestroyChildren: !isSymbolPreviewVisible,
            willResetCurrentPreviewItem: !isSymbolPreviewVisible,
            timestamp: new Date().toISOString()
        });

        this.previewOverlay.active = isSymbolPreviewVisible;
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Preview overlay active set", {
            isSymbolPreviewVisible,
            overlayActive: this.previewOverlay.active,
            timestamp: new Date().toISOString()
        });

        if (!isSymbolPreviewVisible) {
            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Destroying all children and resetting preview item", {
                childrenToDestroy: this.previewOverlay.children.length,
                timestamp: new Date().toISOString()
            });

            this.previewOverlay.destroyAllChildren();
            this.currentPreviewItem = null;

            cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Children destroyed and preview item reset", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] hideSymbolPreview completed", {
            isSymbolPreviewVisible,
            finalOverlayActive: this.previewOverlay.active,
            finalChildrenCount: this.previewOverlay.children.length,
            hasCurrentPreviewItem: !!this.currentPreviewItem,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.triggerOpenDialog(isVisible ? DialogName.PREVIEW_ODDS : DialogName.DUMMY_DIALOG))
    triggerOpenPreviewOdd(isVisible: boolean) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] triggerOpenPreviewOdd called", {
            isVisible,
            dialogName: isVisible ? DialogName.PREVIEW_ODDS : DialogName.DUMMY_DIALOG,
            willTriggerDialog: true,
            willReturnIsVisible: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] triggerOpenPreviewOdd returning", {
            isVisible,
            timestamp: new Date().toISOString()
        });

        return isVisible;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = AudioIds.CLICK_SYMBOL;
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.cascadingState)
    renderCascadingState(cascadingState: string) {
        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] renderCascadingState called", {
            cascadingState,
            previousCascadingState: this.cascadingState,
            willUpdateCascadingState: true,
            timestamp: new Date().toISOString()
        });

        this.cascadingState = cascadingState;

        cascadingSlotLogger.info("[CASCADING_PREVIEW_ODDS_POPUP] Cascading state updated", {
            newCascadingState: this.cascadingState,
            timestamp: new Date().toISOString()
        });
    }
}



