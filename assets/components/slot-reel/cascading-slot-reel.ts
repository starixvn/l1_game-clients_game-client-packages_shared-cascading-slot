import { _decorator, Component, instantiate, Node, Prefab, tween, v3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { CascadingSlotConfig } from "../../cascading-slot-base-configs";
import { globalEmitter, resourcesCache, SlotClientEvent } from "../../cascading-slot-utils";
import { CascadingSlotReelItem } from "./cascading-slot-reel-item";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReel extends Component {
    @property(Prefab)
    itemPrefab: Prefab = null;

    @property(Node)
    effectContainer: Node = null;

    @property
    spacing = 15;

    @property
    itemSize = 145;

    itemDisplayCount = CascadingSlotConfig.reelItemCount;
    protected items: CascadingSlotReelItem[] = [];
    public peekEffect = false;

    private readonly MIN_DURATION_FALL_IN = 0.25;
    private readonly MIN_DURATION_FALL_IN_TURBO = 0.1;

    private readonly DELAY_EACH_ITEM_PEEK_EFFECT = 0.33;

    private readonly ITEM_BACK_DURATION = 0.13;
    private readonly ITEM_BACK_OFFSET_Y = 25;

    public readonly DELAY_EACH_ITEM_FALL_OUT_DELAY = 0.08;
    private readonly FALL_OUT_SPEED = 2800;
    private readonly FALL_IN_NORMAL_SPEED = 1800;
    private readonly FALL_IN_PEEK_EFFECT_SPEED = 2500;

    createReel() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] createReel called", {
            itemDisplayCount: this.itemDisplayCount,
            itemSize: this.itemSize,
            spacing: this.spacing,
            hasItemPrefab: !!this.itemPrefab,
            hasEffectContainer: !!this.effectContainer,
            peekEffect: this.peekEffect,
            timestamp: new Date().toISOString()
        });

        for (let i = 0; i < this.itemDisplayCount; i++) {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Creating item", {
                index: i,
                willAddItem: true,
                willSetPosition: true,
                timestamp: new Date().toISOString()
            });

            const item = this.addItem();
            const posY = this.getItemPosY(i);
            item.node.position = v3(item.node.position.x, posY, 0);

            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item created and positioned", {
                itemIndex: i,
                itemNodeName: item.node.name,
                position: item.node.position,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] createReel completed", {
            totalItemsCreated: this.itemDisplayCount,
            itemsArrayLength: this.items.length,
            timestamp: new Date().toISOString()
        });
    }

    getItems() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItems called", {
            itemsCount: this.items.length,
            hasItems: this.items.length > 0,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItems returning", {
            itemsCount: this.items.length,
            timestamp: new Date().toISOString()
        });

        return this.items;
    }

    getItemsData() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemsData called", {
            itemsCount: this.items.length,
            willMapIndices: true,
            timestamp: new Date().toISOString()
        });

        const data = this.items.map((item) => item.index);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemsData returning", {
            data,
            dataLength: data.length,
            timestamp: new Date().toISOString()
        });

        return data;
    }

    getItemPosY(index: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemPosY called", {
            index,
            itemSize: this.itemSize,
            spacing: this.spacing,
            willCalculatePosition: true,
            timestamp: new Date().toISOString()
        });

        const start = this.spacing + this.itemSize * 0.5;
        const position = start + index * (this.spacing + this.itemSize);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemPosY calculated", {
            index,
            start,
            position,
            timestamp: new Date().toISOString()
        });

        return position;
    }

    get reelHeight() {
        const height = this.itemSize * this.itemDisplayCount + this.spacing * (this.itemDisplayCount - 1);

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] reelHeight getter accessed", {
            itemSize: this.itemSize,
            itemDisplayCount: this.itemDisplayCount,
            spacing: this.spacing,
            height,
            timestamp: new Date().toISOString()
        });

        return height;
    }

    addItem() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] addItem called", {
            currentItemsCount: this.items.length,
            willCreateReelItem: true,
            willGetComponent: true,
            willPushToItems: true,
            timestamp: new Date().toISOString()
        });

        const node = this.createReelItem();
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Reel item node created", {
            nodeName: node.name,
            timestamp: new Date().toISOString()
        });

        const item = node.getComponent(CascadingSlotReelItem);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Reel item component retrieved", {
            hasComponent: !!item,
            componentName: item?.constructor.name,
            timestamp: new Date().toISOString()
        });

        this.items.push(item);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item added to items array", {
            newItemsCount: this.items.length,
            timestamp: new Date().toISOString()
        });

        return item;
    }

    createReelItem(): Node {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] createReelItem called", {
            hasItemPrefab: !!this.itemPrefab,
            willInstantiate: true,
            willAddToNode: true,
            timestamp: new Date().toISOString()
        });

        const node = instantiate(this.itemPrefab);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Prefab instantiated", {
            nodeName: node.name,
            hasNode: !!node,
            timestamp: new Date().toISOString()
        });

        this.node.addChild(node);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Node added as child", {
            parentNodeName: this.node.name,
            childNodeName: node.name,
            timestamp: new Date().toISOString()
        });

        return node;
    }

    getItemNode(index: number): Node {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemNode called", {
            index,
            validIndex: index >= 0 && index < this.items.length,
            itemsCount: this.items.length,
            willGetItem: true,
            willReturnNode: true,
            timestamp: new Date().toISOString()
        });

        const item = this.getItem(index);
        const node = item.node;

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItemNode returning", {
            index,
            nodeName: node.name,
            hasNode: !!node,
            timestamp: new Date().toISOString()
        });

        return node;
    }

    getItem(index: number): CascadingSlotReelItem {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItem called", {
            index,
            validIndex: index >= 0 && index < this.items.length,
            itemsCount: this.items.length,
            willReturnItem: true,
            timestamp: new Date().toISOString()
        });

        const item = this.items[index];

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] getItem returning", {
            index,
            hasItem: !!item,
            itemIndex: item?.index,
            timestamp: new Date().toISOString()
        });

        return item;
    }

    addItems(data: number[]): CascadingSlotReelItem[] {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] addItems called", {
            data,
            dataLength: data?.length,
            currentItemsCount: this.items.length,
            itemDisplayCount: this.itemDisplayCount,
            willProcessData: true,
            timestamp: new Date().toISOString()
        });

        let i = 0;
        const items = [];

        data.forEach((value, dataIndex) => {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Processing data item", {
                dataIndex,
                value,
                isValidValue: value !== -1,
                willSkip: value === -1,
                timestamp: new Date().toISOString()
            });

            if (value === -1) {
                return;
            }

            const item = this.addItem();
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item added", {
                dataIndex,
                value,
                itemIndex: item.index,
                timestamp: new Date().toISOString()
            });

            item.setItem(value);
            items.push(item);

            const posY = this.getItemPosY(this.itemDisplayCount + i);
            item.node.position = v3(item.node.position.x, posY, 0);

            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item positioned", {
                dataIndex,
                value,
                positionY: posY,
                newPosition: item.node.position,
                timestamp: new Date().toISOString()
            });

            i++;
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] addItems completed", {
            processedItemsCount: i,
            returnedItemsCount: items.length,
            totalItemsCount: this.items.length,
            timestamp: new Date().toISOString()
        });

        return items;
    }

    setItemData(data: number[], multiplier: number[]) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] setItemData called", {
            data,
            dataLength: data?.length,
            multiplier,
            multiplierLength: multiplier?.length,
            itemsCount: this.items.length,
            willSetItemData: true,
            willUpdateMultipliers: true,
            timestamp: new Date().toISOString()
        });

        this.items.forEach((item, index) => {
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Setting item data", {
                itemIndex: index,
                dataValue: data?.[index],
                currentItemIndex: item.index,
                timestamp: new Date().toISOString()
            });

            item.setItem(data[index]);
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] All item data set, now updating multipliers", {
            willProcessMultipliers: true,
            timestamp: new Date().toISOString()
        });

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Updating multiplier for item", {
                itemIndex: i,
                itemSymbolIndex: item.index,
                isMultiplierSymbol: item.isMultiplierSymbol,
                willUpdateMultiplier: true,
                timestamp: new Date().toISOString()
            });

            item.updateMultiplierItem(multiplier);
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] setItemData completed", {
            dataSet: true,
            multipliersUpdated: true,
            timestamp: new Date().toISOString()
        });
    }

    async highlightItem(index: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] highlightItem called", {
            index,
            validIndex: index >= 0 && index < this.items.length,
            hasEffectContainer: !!this.effectContainer,
            willMoveToEffectContainer: true,
            willPlayEffect: true,
            timestamp: new Date().toISOString()
        });

        const item = this.items[index];
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Highlighting item", {
            index,
            itemIndex: item?.index,
            itemSymbol: item?.isScatterSymbol ? "scatter" : item?.isMultiplierSymbol ? "multiplier" : "regular",
            timestamp: new Date().toISOString()
        });

        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item moved to effect container", {
            index,
            timestamp: new Date().toISOString()
        });

        await item.playEffect("highlight");
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Highlight effect completed", {
            index,
            timestamp: new Date().toISOString()
        });
    }

    async shakeItems() {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] shakeItems called", {
            itemsCount: this.items.length,
            willShakeAllItems: true,
            timestamp: new Date().toISOString()
        });

        await Promise.all(this.items.map((item) => this.shakeItem(item)));

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] shakeItems completed", {
            itemsCount: this.items.length,
            timestamp: new Date().toISOString()
        });
    }

    async shakeItem(item: CascadingSlotReelItem) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] shakeItem called", {
            itemIndex: item?.index,
            hasEffectContainer: !!this.effectContainer,
            willMoveToEffectContainer: true,
            willPlayShakeEffect: true,
            willMoveBackToReel: true,
            timestamp: new Date().toISOString()
        });

        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item moved to effect container for shake", {
            timestamp: new Date().toISOString()
        });

        await item.playEffect("shake");
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Shake effect completed", {
            timestamp: new Date().toISOString()
        });

        ComponentUtils.moveToOtherNode(item.node, this.node);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item moved back to reel node", {
            timestamp: new Date().toISOString()
        });
    }

    async removeItem(index: number) {
        const item = this.items[index];
        if (resourcesCache.gameFeatures?.fixedExplodeDuration) {
            item.playEffect("explode").then(() => {
                item.node.destroy();
            });
            await AnimationUtils.delayTime(resourcesCache.gameFeatures.fixedExplodeDuration);
        } else {
            await item.playEffect("explode");
            item.node.destroy();
        }
    }

    async removeItemsByIndex(list: number[]) {
        await Promise.all(list.map((index) => this.removeItem(index)));
        this.items = this.items.filter((item, index) => !list.includes(index));
    }

    async fallOut(isTurbo: boolean) {
        await this.fallWithOffset(-this.itemDisplayCount, isTurbo, null);
    }

    async fallIn(isTurbo: boolean, onEnded: () => void) {
        await this.fallWithOffset(0, isTurbo, onEnded);
    }

    protected getSpeed(isTurbo: boolean, isFallOut: boolean): number {
        const baseSpeed = isFallOut ? this.FALL_OUT_SPEED : this.FALL_IN_NORMAL_SPEED;

        if (isTurbo) {
            return baseSpeed * 1.5;
        }

        if (this.peekEffect) {
            return this.FALL_IN_PEEK_EFFECT_SPEED;
        }

        return baseSpeed;
    }

    protected delayFallingEachItem(duration: any) {
        if (this.peekEffect) {
            return this.DELAY_EACH_ITEM_PEEK_EFFECT;
        }
        return 0.08 * duration;
    }

    async fallWithOffset(offset: number, isTurbo: boolean, onBottomItemEnded?: () => void) {
        const isFallOut = offset < 0;
        const speed = this.getSpeed(isTurbo, isFallOut);
        const minDuration = isTurbo ? this.MIN_DURATION_FALL_IN_TURBO : this.MIN_DURATION_FALL_IN;

        let duration = 0;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const posY = this.getItemPosY(i + offset);
            const distance = Math.abs(posY - item.node.position.y);
            if (distance < 1) {
                continue;
            }
            duration = distance / speed;
            duration = Math.max(duration, minDuration);
            const delay = this.delayFallingEachItem(duration);
            if (!isTurbo) {
                await AnimationUtils.delayTime(delay);
            }
            const isBottomItem = i === 0;
            if (isFallOut) {
                tween(item.node)
                    .to(
                        duration,
                        { position: v3(item.node.position.x, posY, 0) },
                        {
                            easing: "sineIn",
                        }
                    )
                    .start();
            } else {
                this.fallInWithOffset(item, duration, posY, isBottomItem, onBottomItemEnded);
            }
        }

        duration > 0 && (await AnimationUtils.delayTime(duration));
    }

    fallInWithOffset(item: CascadingSlotReelItem, duration: number, posY: number, isBottomItem: boolean, onBottomItemEnded?: () => void) {
        this.peekEffect && AudioUtils.playSFX(AudioIds.PEEK_EFFECT_ITEM);
        const backOffsetY = this.ITEM_BACK_OFFSET_Y;
        const backDuration = this.ITEM_BACK_DURATION;
        const xNode = item.node.position.x;
        const fromOutSide = item.node.position.y >= this.reelHeight;
        const destPosition = v3(item.node.position.x, posY, 0);
        if (item.isScatterSymbol && fromOutSide) {
            if (this.peekEffect) {
                AudioUtils.playSFX(AudioIds.SYMBOL_SCATTER_WIN);
            } else {
                AudioUtils.playSFX(AudioIds.SYMBOL_SCATTER);
            }
        }

        const effectIntroMultiplier = resourcesCache.gameFeatures?.effectIntroMultiplier && item.isMultiplierSymbol && fromOutSide;

        tween(item.node)
            .to(duration - backDuration, { position: v3(xNode, posY - backOffsetY, 0) }, { easing: "circOut" })
            .call(() => {
                if (isBottomItem) {
                    onBottomItemEnded && onBottomItemEnded();
                }
            })
            .parallel(
                tween().call(() => {
                    effectIntroMultiplier &&
                        globalEmitter.emit(SlotClientEvent.EFFECT_INTRO_MULTIPLIER, {
                            position: destPosition,
                            node: item.node,
                            level: item.getMultiplierItem()?.multiplierRange ?? 0,
                        });
                }),
                tween().to(
                    backDuration,
                    { position: v3(xNode, posY, 0) },
                    {
                        easing: "sineOut",
                    }
                )
            )
            .call(() => {
                effectIntroMultiplier && item.playIntroAnimation();
            })
            .start();
    }

    setStartPositionForItems() {
        this.items.forEach((item, index) => {
            item.node.position = v3(item.node.position.x, this.getItemPosY(this.itemDisplayCount + index), 0);
        });
    }

    async spin(data: number[], multiplier: number[], isTurbo: boolean, onSpinEnded: () => void) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] spin called", {
            data,
            dataLength: data?.length,
            multiplier,
            multiplierLength: multiplier?.length,
            isTurbo,
            hasOnSpinEnded: !!onSpinEnded,
            itemsCount: this.items.length,
            willSetItemData: true,
            willSetStartPositions: true,
            willFallIn: true,
            timestamp: new Date().toISOString()
        });

        this.setItemData(data, multiplier);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Item data set", {
            timestamp: new Date().toISOString()
        });

        this.setStartPositionForItems();
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Start positions set", {
            timestamp: new Date().toISOString()
        });

        await this.fallIn(isTurbo, onSpinEnded);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] Fall in completed", {
            timestamp: new Date().toISOString()
        });
    }

    async highlightItems(list: number[]) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] highlightItems called", {
            list,
            listLength: list?.length,
            hasEffectContainer: !!this.effectContainer,
            willHighlightMultipleItems: true,
            timestamp: new Date().toISOString()
        });

        await Promise.all(list.map((index) => this.highlightItem(index)));

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL] highlightItems completed", {
            highlightedCount: list?.length,
            timestamp: new Date().toISOString()
        });
    }

    async highlightScatterItems() {
        this.items.forEach((item) => ComponentUtils.moveToOtherNode(item.node, this.effectContainer));
        const scatterSymbols = this.items.filter((item) => item.isScatterSymbol);
        await Promise.all(scatterSymbols.map((item) => item.highlightScatterItem()));
        this.moveItemsBackToReelNode();
    }

    public moveItemsBackToReelNode() {
        this.items.forEach((item) => ComponentUtils.moveToOtherNode(item.node, this.node));
    }

    async peekEffectScatterItems() {
        const scatterSymbols = this.items.filter((item) => item.isScatterSymbol);
        scatterSymbols.forEach((item) => {
            if (item.node.parent === this.effectContainer) {
                return;
            }
            ComponentUtils.moveToOtherNode(item.node, this.effectContainer);

            item.highlightScatterItem();
        });
    }

    peekEffectHighlightAllItems() {
        this.peekEffectHighlightItems(this.items);
    }

    peekEffectHighlightItems(items: CascadingSlotReelItem[]) {
        items.forEach((item) => {
            if (item.node.parent === this.effectContainer) {
                return;
            }
            ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        });
    }
}



