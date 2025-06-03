import { _decorator, Component, instantiate, Node, Prefab, sp, tween, v3 } from "cc";
import { ComponentUtils, FunctionUtils } from "db://shared-components/shared/utils";
import { CascadingSlotConfig, UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
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

    createReel() {
        for (let i = 0; i < this.itemDisplayCount; i++) {
            const item = this.addItem();
            item.node.position = v3(item.node.position.x, this.getItemPosY(i), 0);
        }
    }

    getItems() {
        return this.items;
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
        if (item && item.node && item.node.isValid) {
            ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
            await this.effectSpineSymbol(item, "highlight");
        }
    }

    async shakeItems() {
        await Promise.all(this.items.map((item) => this.shakeItem(item)));
    }

    async shakeItem(item) {
        if (item && item.node && item.node.isValid) {
            ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
            await this.effectSpineSymbol(item, "shake");
            ComponentUtils.moveToOtherNode(item.node, this.node);
        }
    }

    async removeItem(index: number) {
        const item = this.items[index];
        if (item && item.node && item.node.isValid) {
            await this.effectSpineSymbol(item, "explode");
            item.node.destroy();
        }
    }

    async removeItemsByIndex(list: number[]) {
        await Promise.all(list.map((index) => this.removeItem(index)));
        this.items = this.items.filter((item, index) => !list.includes(index));
    }

    async effectSpineSymbol(item: CascadingSlotReelItem, animation: string) {
        if (!item || !item.node || !item.node.isValid) {
            return;
        }
        const effectSpine = item.getComponentInChildren(sp.Skeleton);
        if (effectSpine) {
            effectSpine.setAnimation(0, animation, false);
            const duration = effectSpine.findAnimation(animation)?.duration || 0;
            if (duration > 0) {
                await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
            }
        }
    }

    async fallOut(isTurbo: boolean) {
        await this.fallWithOffset(-this.itemDisplayCount, isTurbo, null);
    }

    async fallIn(isTurbo: boolean, onEnded: () => void) {
        await this.fallWithOffset(0, isTurbo, onEnded);
    }

    protected getSpeed(isTurbo: boolean, isFallOut: boolean): number {
        const baseSpeed = isFallOut ? 1.3 * this.pixelPerSecond : this.pixelPerSecond;
        return isTurbo ? baseSpeed * 1.5 : baseSpeed;
    }

    async fallWithOffset(offset: number, isTurbo: boolean, onBottomItemEnded?: () => void) {
        const isFallOut = offset < 0;
        const speed = this.getSpeed(isTurbo, isFallOut);
        let duration;

        const backDuration = 0.2;
        for (let i = 0; i < this.items.length; i++) {
            const item = this.items[i];
            if (!item || !item.node || !item.node.isValid) {
                continue;
            }
            const posY = this.getItemPosY(i + offset);
            const distance = Math.abs(posY - item.node.position.y);
            if (distance < 1) {
                continue;
            }
            duration = distance / speed;
            const delay = 0.08 * duration;
            if (!isTurbo) {
                await FunctionUtils.delay(delay * UNIT_SECOND_SPIN);
            }
            const isBottomItem = i === 0;
            if (isFallOut) {
                if (item.node && item.node.isValid) {
                    tween(item.node)
                        .to(duration, { position: v3(item.node.position.x, posY, 0) }, { easing: "sineIn" })
                        .start();
                }
            } else {
                this.fallInWithOffset(item, duration, posY, isBottomItem, onBottomItemEnded);
            }
        }

        await FunctionUtils.delay(this.getDelayTimeAfterFall(isFallOut, duration, backDuration));
    }

    protected getDelayTimeAfterFall(isFallOut: boolean, duration: number, backDuration: number): number {
        return isFallOut ? duration * UNIT_SECOND_SPIN : (duration + backDuration) * UNIT_SECOND_SPIN;
    }

    fallInWithOffset(item: CascadingSlotReelItem, duration: number, posY: number, isBottomItem: boolean, onBottomItemEnded?: () => void) {
        if (!item || !item.node || !item.node.isValid) {
            return;
        }

        const backOffsetY = this.itemSize * 1.8;
        const backDuration = 0.2;
        const xNode = item.node.position.x;

        tween(item.node)
            .to(duration - backDuration, { position: v3(xNode, posY + backOffsetY, 0) })
            .call(() => {
                if (isBottomItem) {
                    onBottomItemEnded && onBottomItemEnded();
                }
            })
            .to(backDuration, { position: v3(xNode, posY, 0) }, { easing: "backOut" })
            .start();
    }

    setStartPositionForItems() {
        this.items.forEach((item, index) => {
            if (item && item.node && item.node.isValid) {
                item.node.position = v3(item.node.position.x, this.getItemPosY(this.itemDisplayCount + index), 0);
            }
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
        this.items.forEach((item) => ComponentUtils.moveToOtherNode(item.node, this.node));
    }
}
