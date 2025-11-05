import { _decorator, Component, instantiate, Node, Prefab, sp, warn } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { resourcesCache, SpecialSymbol } from "../../cascading-slot-utils";
import { MultiplierItem } from "../multiplier/multiplier-item";
import { CascadingSlotReelSymbol } from "./cascading-slot-reel-symbol";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelItem extends Component {
    @property(Prefab)
    itemPrefabs: Prefab[] = [];

    @property(Node)
    content: Node = null;

    public index = -1;
    private _effectSpine: sp.Skeleton = null;

    setItem(index: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] setItem called", {
            index,
            previousIndex: this.index,
            hasItemPrefabs: this.itemPrefabs?.length > 0,
            hasContent: !!this.content,
            willReplaceItem: true,
            willSetIndex: true,
            timestamp: new Date().toISOString()
        });

        this.replaceItem(index);
        this.index = index;

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] setItem completed", {
            newIndex: this.index,
            timestamp: new Date().toISOString()
        });
    }

    get isScatterSymbol(): boolean {
        const result = this.index === SpecialSymbol.SCATTER_SYMBOL;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] isScatterSymbol accessed", {
            index: this.index,
            scatterSymbol: SpecialSymbol.SCATTER_SYMBOL,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get isMultiplierSymbol(): boolean {
        const result = this.index >= SpecialSymbol.MULTIPLIER_SYMBOL;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] isMultiplierSymbol accessed", {
            index: this.index,
            multiplierSymbol: SpecialSymbol.MULTIPLIER_SYMBOL,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    protected replaceItem(index: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] replaceItem called", {
            index,
            currentChildrenCount: this.content?.children?.length || 0,
            hasEffectSpine: !!this._effectSpine,
            willDestroyChildren: true,
            willResetEffectSpine: true,
            timestamp: new Date().toISOString()
        });

        this.content.children.forEach((child) => child.destroy());
        this._effectSpine = null;

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Children destroyed and effect spine reset", {
            timestamp: new Date().toISOString()
        });

        if (index < 0) {
            cascadingSlotLogger.error("[CASCADING_SLOT_REEL_ITEM] replaceItem wrong index: " + index, {
                index,
                error: "Negative index not allowed",
                timestamp: new Date().toISOString()
            });
            return;
        }

        const symbolPrefabIndex = index >= SpecialSymbol.MULTIPLIER_SYMBOL ? 1 : 0;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Calculating symbol prefab index", {
            index,
            multiplierSymbol: SpecialSymbol.MULTIPLIER_SYMBOL,
            symbolPrefabIndex,
            hasItemPrefabs: this.itemPrefabs?.length > 0,
            itemPrefabsLength: this.itemPrefabs?.length,
            timestamp: new Date().toISOString()
        });

        const node = instantiate(this.itemPrefabs[symbolPrefabIndex]);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Symbol prefab instantiated", {
            symbolPrefabIndex,
            nodeCreated: !!node,
            timestamp: new Date().toISOString()
        });

        this.content.addChild(node);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Node added to content", {
            timestamp: new Date().toISOString()
        });

        const reelSymbol = node.getComponent(CascadingSlotReelSymbol);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Reel symbol component retrieved", {
            hasReelSymbol: !!reelSymbol,
            timestamp: new Date().toISOString()
        });

        const animationData = resourcesCache.slotSymbols[index];
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Setting animation", {
            index,
            animationData: !!animationData,
            willCallSetAnimation: true,
            timestamp: new Date().toISOString()
        });

        reelSymbol.setAnimation(animationData);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] replaceItem completed", {
            index,
            symbolPrefabIndex,
            timestamp: new Date().toISOString()
        });
    }

    getMultiplierItem() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] getMultiplierItem called", {
            hasContent: !!this.content,
            hasChildren: !!this.content?.children,
            childrenCount: this.content?.children?.length || 0,
            timestamp: new Date().toISOString()
        });

        // Add null check to prevent crashes during rapid hyper spin rounds
        if (!this.content || !this.content.children) {
            cascadingSlotLogger.warn("[CASCADING_SLOT_REEL_ITEM] getMultiplierItem called with null content or children", {
                hasContent: !!this.content,
                hasChildren: !!this.content?.children,
                willReturnNull: true,
                timestamp: new Date().toISOString()
            });
            return null;
        }

        const validChildren = this.content.children.filter((child) => child.isValid && child.activeInHierarchy);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Filtered valid children", {
            totalChildren: this.content.children.length,
            validChildrenCount: validChildren.length,
            timestamp: new Date().toISOString()
        });

        const items = validChildren.map((child) => child.getComponent(MultiplierItem)).filter((item) => item !== null);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Retrieved multiplier items", {
            validChildrenCount: validChildren.length,
            multiplierItemsCount: items.length,
            timestamp: new Date().toISOString()
        });

        if (items.length > 0) {
            if (items.length > 1) {
                cascadingSlotLogger.warn("[CASCADING_SLOT_REEL_ITEM] Multiple multiplier items found", {
                    itemsCount: items.length,
                    warning: "Should not have more than 1 multiplier item",
                    timestamp: new Date().toISOString()
                });
                warn("Wrong here, should not have more than 1 multiplier item !!!!!");
            }

            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Returning first multiplier item", {
                hasItem: true,
                timestamp: new Date().toISOString()
            });
            return items[0];
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] No multiplier items found", {
            willReturnNull: true,
            timestamp: new Date().toISOString()
        });
        return null;
    }

    updateMultiplierItem(multiplier: number[]) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] updateMultiplierItem called", {
            multiplier,
            multiplierLength: multiplier?.length || 0,
            index: this.index,
            multiplierSymbol: SpecialSymbol.MULTIPLIER_SYMBOL,
            isMultiplierSymbol: this.index >= SpecialSymbol.MULTIPLIER_SYMBOL,
            canUpdate: this.index >= SpecialSymbol.MULTIPLIER_SYMBOL && multiplier?.length > 0,
            timestamp: new Date().toISOString()
        });

        if (this.index >= SpecialSymbol.MULTIPLIER_SYMBOL && multiplier.length > 0) {
            const m = multiplier.shift();
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Processing multiplier update", {
                shiftedValue: m,
                remainingMultiplierLength: multiplier.length,
                willGetMultiplierItem: true,
                timestamp: new Date().toISOString()
            });

            const multiplierItem = this.getMultiplierItem();
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Multiplier item retrieved", {
                hasMultiplierItem: !!multiplierItem,
                timestamp: new Date().toISOString()
            });

            if (multiplierItem) {
                cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Setting multiplier value", {
                    value: m,
                    timestamp: new Date().toISOString()
                });
                multiplierItem.setValue(m);
            } else {
                cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] No multiplier item found, skipping value set", {
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Conditions not met for multiplier update", {
                isMultiplierSymbol: this.index >= SpecialSymbol.MULTIPLIER_SYMBOL,
                hasMultiplierValues: multiplier?.length > 0,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] updateMultiplierItem completed", {
            timestamp: new Date().toISOString()
        });
    }

    async highlightScatterItem() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] highlightScatterItem called", {
            hasEffectSpine: !!this.effectSpine,
            isScatterSymbol: this.isScatterSymbol,
            willPlayAnimation: !!this.effectSpine,
            timestamp: new Date().toISOString()
        });

        if (!this.effectSpine) {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] No effect spine, returning", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const anim = "highlight";
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Setting up highlight animation", {
            animation: anim,
            scatterSymbol: SpecialSymbol.SCATTER_SYMBOL,
            hasSkeletonData: !!resourcesCache.slotSymbols[SpecialSymbol.SCATTER_SYMBOL],
            timestamp: new Date().toISOString()
        });

        this.effectSpine.skeletonData = resourcesCache.slotSymbols[SpecialSymbol.SCATTER_SYMBOL];
        this.effectSpine.setAnimation(0, anim, true);

        const animationData = this.effectSpine.findAnimation(anim);
        const originalDuration = animationData?.duration || 0;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Animation started", {
            animation: anim,
            duration: originalDuration,
            willDelay: true,
            timestamp: new Date().toISOString()
        });

        await AnimationUtils.delayTime(originalDuration);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] highlightScatterItem completed", {
            animation: anim,
            duration: originalDuration,
            timestamp: new Date().toISOString()
        });
    }

    playIntroAnimation() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] playIntroAnimation called", {
            hasEffectSpine: !!this.effectSpine,
            willPlayAnimation: !!this.effectSpine,
            timestamp: new Date().toISOString()
        });

        if (!this.effectSpine) {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] No effect spine, returning", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Playing intro animation", {
            animation: "intro",
            loop: false,
            timestamp: new Date().toISOString()
        });

        this.effectSpine.setAnimation(0, "intro", false);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] playIntroAnimation completed", {
            timestamp: new Date().toISOString()
        });
    }

    get effectSpine(): sp.Skeleton {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] effectSpine getter called", {
            hasCachedSpine: !!this._effectSpine,
            hasContent: !!this.content,
            willSearchComponent: !this._effectSpine,
            timestamp: new Date().toISOString()
        });

        if (!this._effectSpine) {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Retrieving spine component from content", {
                timestamp: new Date().toISOString()
            });
            this._effectSpine = this.content.getComponentInChildren(sp.Skeleton);
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Spine component retrieved", {
                hasSpine: !!this._effectSpine,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Using cached spine component", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] effectSpine getter returning", {
            hasSpine: !!this._effectSpine,
            timestamp: new Date().toISOString()
        });

        return this._effectSpine;
    }

    async playEffect(animation: string) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] playEffect called", {
            animation,
            hasEffectSpine: !!this.effectSpine,
            willPlayAnimation: !!this.effectSpine,
            timestamp: new Date().toISOString()
        });

        if (!this.effectSpine) {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] No effect spine, returning", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] Playing spine animation", {
            animation,
            willUseAnimationUtils: true,
            timestamp: new Date().toISOString()
        });

        await AnimationUtils.playSpine(this.effectSpine, animation);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_ITEM] playEffect completed", {
            animation,
            timestamp: new Date().toISOString()
        });
    }
}



