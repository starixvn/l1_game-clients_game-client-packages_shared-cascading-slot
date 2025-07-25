import { _decorator, Component, instantiate, log, Node, Prefab, sp, tween, v3 } from "cc";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { CascadingSlotConfig } from "../../cascading-slot-base-configs";
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
    public readonly pixelPerSecond = 145 * 15;
    public peekEffect = false;

    private readonly MIN_DURATION_FALL_IN = 0.25;

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
        const item = this.items[index];
        return item.node;
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
        await this.effectSpineSymbol(item, "highlight");
    }

    async shakeItems() {
        await Promise.all(this.items.map((item) => this.shakeItem(item)));
    }

    async shakeItem(item) {
        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        await this.effectSpineSymbol(item, "shake");
        ComponentUtils.moveToOtherNode(item.node, this.node);
    }

    async removeItem(index: number) {
        const item = this.items[index];
        await this.effectSpineSymbol(item, "explode");
        item.node.destroy();
    }

    async removeItemsByIndex(list: number[]) {
        await Promise.all(list.map((index) => this.removeItem(index)));
        this.items = this.items.filter((item, index) => !list.includes(index));
    }

    async effectSpineSymbol(item: CascadingSlotReelItem, animation: string) {
        const effectSpine = item.getComponentInChildren(sp.Skeleton);
        effectSpine.setAnimation(0, animation, false);
        const duration = effectSpine.findAnimation(animation)?.duration || 0;
        if (duration > 0) {
            await AnimationUtils.delayTime(duration);
        }
    }

    async fallOut(isTurbo: boolean) {
        await this.fallWithOffset(-this.itemDisplayCount, isTurbo, null);
    }

    async fallIn(isTurbo: boolean, onEnded: () => void) {
        await this.fallWithOffset(0, isTurbo, onEnded);
    }

    protected getSpeed(isTurbo: boolean, isFallOut: boolean): number {
        const baseSpeed = isFallOut ? 2800 : 1800;

        if (isTurbo) {
            return baseSpeed * 1.5;
        }

        if (this.peekEffect) {
            return 2500;
        }

        return baseSpeed;
    }

    protected delayFallingEachItem(duration: any) {
        if (this.peekEffect) {
            return 0.3;
        }
        return 0.08 * duration;
    }

    async fallWithOffset(offset: number, isTurbo: boolean, onBottomItemEnded?: () => void) {
        const isFallOut = offset < 0;
        const speed = this.getSpeed(isTurbo, isFallOut);
        let duration = 0;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            const posY = this.getItemPosY(i + offset);
            const distance = Math.abs(posY - item.node.position.y);
            if (distance < 1) {
                continue;
            }
            duration = distance / speed;
            duration = Math.max(duration, this.MIN_DURATION_FALL_IN);
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
                log(`fallInWithOffset `, duration);
                this.fallInWithOffset(item, duration, posY, isBottomItem, onBottomItemEnded);
            }
        }

        duration > 0 && (await AnimationUtils.delayTime(duration));
    }

    fallInWithOffset(item: CascadingSlotReelItem, duration: number, posY: number, isBottomItem: boolean, onBottomItemEnded?: () => void) {
        const backOffsetY = 25;
        const backDuration = 0.13;
        const xNode = item.node.position.x;

        tween(item.node)
            .to(duration - backDuration, { position: v3(xNode, posY - backOffsetY, 0) }, { easing: "circOut" })
            .call(() => {
                if (isBottomItem) {
                    onBottomItemEnded && onBottomItemEnded();
                }
            })
            .to(
                backDuration,
                { position: v3(xNode, posY, 0) },
                {
                    easing: "sineOut",
                }
            )
            .start();
    }

    setStartPositionForItems() {
        this.items.forEach((item, index) => {
            item.node.position = v3(item.node.position.x, this.getItemPosY(this.itemDisplayCount + index), 0);
        });
    }

    async spin(data: number[], multiplier: number[], isTurbo: boolean, onSpinEnded: () => void) {
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
        scatterSymbols.map((item) => {
            // ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
            if (item.node.parent === this.effectContainer) {
                return;
            }
            const wPos = v3(item.node.worldPosition.x, item.node.worldPosition.y, 0);
            item.node.parent = this.effectContainer;
            item.node.worldPosition = wPos;

            item.highlightScatterItem();
        });
    }
}
