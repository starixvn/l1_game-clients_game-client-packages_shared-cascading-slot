import { _decorator, Component, instantiate, Node, Prefab, tween, v3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { CascadingSlotConfig } from "../../cascading-slot-base-configs";
import { globalEmitter, resourcesCache, SlotClientEvent } from "../../cascading-slot-utils";
import { CascadingSlotReelItem } from "./cascading-slot-reel-item";
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

    private readonly MIN_DURATION_FALL_IN = 0.4;
    private readonly MIN_DURATION_FALL_OUT = 0.25;
    private readonly MIN_DURATION_TURBO_FALL_IN = 0.25;
    private readonly MIN_DURATION_TURBO_FALL_OUT = 0.1;

    private readonly DELAY_EACH_ITEM_PEEK_EFFECT = 0.33;

    private readonly ITEM_BACK_DURATION = 0.24;
    private readonly ITEM_BACK_OFFSET_Y = 4;

    public readonly DELAY_EACH_ITEM_FALL_OUT_DELAY = 0.08;
    public readonly DELAY_EACH_ITEM_FALL_IN_DELAY = 0.12;
    private readonly FALL_OUT_SPEED = 2800;
    private readonly FALL_IN_NORMAL_SPEED = 1700;
    private readonly FALL_IN_PEEK_EFFECT_SPEED = 2500;

    public isReFillSymbols = false;

    createReel() {
        for (let i = 0; i < this.itemDisplayCount; i++) {
            const item = this.addItem();
            item.node.position = v3(item.node.position.x, this.getItemPosY(i), 0);
        }
    }

    getItems() {
        return this.items;
    }

    getItemsData() {
        return this.items.map((item) => item.index);
    }

    getItemPosY(index: number) {
        const start = this.spacing + this.itemSize * 0.5;
        return start + index * (this.spacing + this.itemSize);
    }

    get reelHeight() {
        return this.itemSize * this.itemDisplayCount + this.spacing * (this.itemDisplayCount - 1);
    }

    addItem() {
        const node = this.createReelItem();
        const item = node.getComponent(CascadingSlotReelItem);
        this.items.push(item);
        return item;
    }

    createReelItem(): Node {
        const node = instantiate(this.itemPrefab);
        this.node.addChild(node);
        return node;
    }

    getItemNode(index: number): Node {
        const item = this.getItem(index);
        return item.node;
    }

    getItem(index: number): CascadingSlotReelItem {
        return this.items[index];
    }

    addItems(data: number[]): CascadingSlotReelItem[] {
        let i = 0;
        const items = [];
        data.forEach((value) => {
            if (value === -1) {
                return;
            }
            const item = this.addItem();
            item.setItem(value);
            items.push(item);
            item.node.position = v3(item.node.position.x, this.getItemPosY(this.itemDisplayCount + i), 0);
            i++;
        });

        return items;
    }

    setItemData(data: number[], multiplier: number[]) {
        this.items.forEach((item, index) => {
            item.setItem(data[index]);
        });

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.updateMultiplierItem(multiplier);
        }
    }

    async highlightItem(index: number) {
        const item = this.items[index];
        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        await item.playEffect("highlight");
    }

    async shakeItems() {
        await Promise.all(this.items.map((item) => this.shakeItem(item)));
    }

    async shakeItem(item: CascadingSlotReelItem) {
        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        await item.playEffect("shake");
        ComponentUtils.moveToOtherNode(item.node, this.node);
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

    async fallInRange(startIndex: number, endIndex: number, isTurbo: boolean, onEnded?: () => void) {
        await this.fallWithOffsetRange(startIndex, endIndex, 0, isTurbo, onEnded);
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

    protected delayFallingEachItem(duration: any, isTurbo: boolean) {
        if (this.peekEffect) {
            return this.DELAY_EACH_ITEM_PEEK_EFFECT;
        }
        if (this.isReFillSymbols && !isTurbo) {
            return 0.2 * duration;
        }
        return 0.08 * duration;
    }

    async fallWithOffset(offset: number, isTurbo: boolean, onBottomItemEnded?: () => void) {
        await this.fallWithOffsetRange(0, this.items.length, offset, isTurbo, onBottomItemEnded);
    }

    async fallWithOffsetRange(startIndex: number, endIndex: number, offset: number, isTurbo: boolean, onBottomItemEnded?: () => void) {
        const isFallOut = offset < 0;
        const speed = this.getSpeed(isTurbo, isFallOut);
        let minDuration = 0;
        if (isTurbo) {
            minDuration = isFallOut ? this.MIN_DURATION_TURBO_FALL_OUT : this.MIN_DURATION_TURBO_FALL_IN;
        } else {
            minDuration = isFallOut ? this.MIN_DURATION_FALL_OUT : this.MIN_DURATION_FALL_IN;
        }

        let duration = 0;
        for (let i = startIndex; i < endIndex && i < this.items.length; i++) {
            const item = this.items[i];
            const posY = this.getItemPosY(i + offset);
            const distance = Math.abs(posY - item.node.position.y);
            if (distance < 1) {
                continue;
            }
            duration = distance / speed;
            duration = Math.max(duration, minDuration);
            const delay = this.delayFallingEachItem(duration, isTurbo);

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
        console.log("duration", duration);
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
            .to(duration - backDuration, { position: v3(xNode, posY, 0) }, { easing: "sineIn" })

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
                tween()
                    .to(backDuration * 0.3, { position: v3(xNode, posY - backOffsetY, 0) })
                    .to(backDuration * 0.3, { position: v3(xNode, posY + 3, 0) })
                    .to(backDuration * 0.4, { position: v3(xNode, posY, 0) }, { easing: "expoOut" })
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
        this.isReFillSymbols = false;
        this.setItemData(data, multiplier);
        this.setStartPositionForItems();
        await this.fallIn(isTurbo, onSpinEnded);
    }

    async highlightItems(list: number[]) {
        await Promise.all(list.map((index) => this.highlightItem(index)));
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
