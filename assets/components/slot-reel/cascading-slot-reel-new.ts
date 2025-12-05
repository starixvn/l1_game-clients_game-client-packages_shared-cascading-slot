import { _decorator, easing, Node, Prefab, v3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { CascadingSlotConfig } from "../../cascading-slot-base-configs";
import { BoardSize, GameSpeed, resourcesCache } from "../../cascading-slot-utils";
import { CascadingSlotReel } from "./cascading-slot-reel";
import { CascadingSlotReelItem } from "./cascading-slot-reel-item";
const { ccclass, property } = _decorator;

enum State {
    None,
    BounceStart,
    Spin,
    BounceStop,
    Turbo,
}

@ccclass
export class CascadingSlotReelNew extends CascadingSlotReel {
    @property(Prefab)
    itemPrefab: Prefab = null;

    @property(Node)
    effectContainer: Node = null;

    @property
    spacing = 15;

    @property
    itemSize = 145;

    get symbolGap() {
        return this.itemSize + this.spacing;
    }

    itemDisplayCount = CascadingSlotConfig.reelItemCount;
    protected items: CascadingSlotReelItem[] = [];
    public peekEffect = false;

    // Configuration constants
    protected readonly BLURRY_SPEED = 1000;

    protected readonly BOUNCE_START_DISTANCE = 20;
    protected readonly BOUNCE_START_DURATION = 0.15;

    protected readonly DELAY_SLOW_DOWN_DURATION = 2;
    protected readonly SLOW_DOWN_DURATION = 3;
    protected readonly SLOW_DOWN_DURATION_FAST = 0.4;

    protected readonly BOUNCE_STOP_DISTANCE = 25;
    protected readonly BOUNCE_STOP_DURATION = 0.2;

    protected readonly SPIN_MAX_SPEED = 4000;
    protected readonly SPIN_MAX_SPEED_2 = this.SPIN_MAX_SPEED + 500;
    protected readonly SPIN_ACCELERATION = 20000;

    protected readonly SPEED_STOP_THRESHOLD = 1;
    protected readonly SPIN_EXTRA_SYMBOLS = 18;

    protected readonly TURBO_SPIN_ITEM_COUNT = 10;
    protected readonly SLOT_ROW_MAX_INDEX = BoardSize.ROW - 1;

    public isReFillSymbols = false;

    // State tracking
    private state = State.None;
    public isFaster = false;
    private isStoppingPhase = false;

    // Movement tracking
    private movingDistance = 0;
    private finalMovingDistance = 0;

    private turboSpeed = 0;
    private currentSpeed = 0;
    private stoppingDistance = 0;
    private stoppingDuration = 0;
    private deltaTime = 0;

    // Data tracking
    private spinDuration = 0;
    private symbolsReel: number[] = [];
    private multipliersReel: number[] = [];
    private lowestIndex = 0;
    private onSpinFinishCallback = () => {};

    async spinNew(data: number[], multiplier: number[], gameSpeed: string, duration: number, onSpinEnded: () => void) {
        this.isReFillSymbols = false;
        if (gameSpeed === GameSpeed.NORMAL) {
            await this.spinNormal(duration, data, multiplier);
        } else {
            await this.spinTurbo(duration, data, multiplier);
        }
    }

    async spinv2(data: number[], multiplier: number[], gameSpeed: string, duration: number, peekEffect: any, onSpinEnded: () => void) {
        this.isReFillSymbols = false;
        if (!peekEffect) {
            await this.spinNew(data, multiplier, gameSpeed, duration, onSpinEnded);
        } else {
            this.setItemData(data, multiplier);
            this.setStartPositionForItems();
            await this.fallIn(gameSpeed, onSpinEnded);
        }
    }

    public spinNormal(spinDuration: number, data: number[], multipliers: number[]) {
        return new Promise<void>((resolve) => {
            this.onSpinFinishCallback = resolve;
            this.symbolsReel = data;
            this.multipliersReel = multipliers;
            this.clear();
            this.startBounceStart(spinDuration);
        });
    }

    private startBounceStart(spinDuration: number) {
        this.state = State.BounceStart;
        this.deltaTime = 0;
        this.spinDuration = spinDuration;
    }

    public spinTurbo(spinDuration: number, data: number[], multipliers: number[]) {
        return new Promise<void>((resolve) => {
            this.onSpinFinishCallback = resolve;
            this.symbolsReel = data;
            this.multipliersReel = multipliers;
            this.clear();
            this.state = State.Turbo;
            this.finalMovingDistance = this.symbolGap * this.TURBO_SPIN_ITEM_COUNT;
            this.turboSpeed = this.finalMovingDistance / spinDuration;
            this.syncReelData(this.symbolsReel, multipliers);
        });
    }

    private clear() {
        this.deltaTime = 0;
        this.isFaster = false;
        this.currentSpeed = 0;
        this.isStoppingPhase = false;
        this.movingDistance = 0;
    }

    private updateLowestIndex() {
        const totalSymbolsPassed = Math.round(this.finalMovingDistance / this.symbolGap) % this.items.length;
        this.lowestIndex = (this.lowestIndex + totalSymbolsPassed) % this.items.length;
    }

    protected rowIndexToItemIndex(rowIndex: number) {
        return (this.lowestIndex - rowIndex + this.SLOT_ROW_MAX_INDEX) % this.items.length;
    }

    // Main update loop
    protected update(deltaTime: number): void {
        const dt = Math.min(deltaTime, 1 / 30);
        switch (this.state) {
            case State.BounceStart:
                this.updateBounceStart(dt);
                break;
            case State.Spin:
                this.updateSpin(dt);
                break;
            case State.BounceStop:
                this.updateBounceStop(dt);
                break;
            case State.Turbo:
                this.updateTurbo(dt);
                break;
        }
    }

    private updateTurbo(dt: number) {
        const offset = this.turboSpeed * dt;
        this.movingDistance += offset;
        this.movingReelDown(offset);

        if (this.checkDistanceLessThan(this.finalMovingDistance, this.movingDistance)) {
            this.state = State.None;
            this.finalAdjustment();
            this.onSpinFinishCallback();
        }
    }

    private updateBounceStart(dt: number) {
        const prev = easing.sineOut(Math.min(1, this.deltaTime / this.BOUNCE_START_DURATION)) * this.BOUNCE_START_DISTANCE;
        this.deltaTime += dt;
        const progress = this.deltaTime / this.BOUNCE_START_DURATION;
        const current = easing.sineOut(Math.min(1, progress)) * this.BOUNCE_START_DISTANCE;
        const offset = current - prev;

        this.movingDistance -= offset;
        this.movingReelDown(-offset);
        if (progress >= 1) {
            this.startSpin(this.spinDuration);
        }
    }

    private movingReelDown(offset: number) {
        this.items.forEach((item) => {
            item.node.setPosition(item.node.position.x, item.node.position.y - offset, item.node.position.z);

            if (item.node.worldPositionY < this.node.worldPositionY - this.symbolGap / 2) {
                item.node.setPosition(item.node.position.x, item.node.position.y + this.reelHeight, item.node.position.z);
            }
        });
    }

    // Spin phase
    private startSpin(spinDuration: number) {
        this.state = State.Spin;
        this.spinDuration = spinDuration;

        if (spinDuration > 0) {
            this.scheduleOnce(() => {
                this.prepareStop(true);
            }, spinDuration - this.BOUNCE_START_DURATION - this.SLOW_DOWN_DURATION_FAST - this.BOUNCE_STOP_DURATION);
        }
    }

    public prepareStop(fast = false) {
        this.isFaster = false;
        const symbolGap = this.symbolGap;
        const currentExcess = this.movingDistance % symbolGap;
        const remainingToNext = symbolGap - currentExcess;
        const extraDistance = symbolGap * this.SPIN_EXTRA_SYMBOLS;
        this.finalMovingDistance = this.movingDistance + remainingToNext + extraDistance;
        this.stoppingDistance = remainingToNext + extraDistance + this.BOUNCE_STOP_DISTANCE;
        this.stoppingDuration = fast ? this.SLOW_DOWN_DURATION_FAST : this.SLOW_DOWN_DURATION;
        this.deltaTime = 0;
        this.isStoppingPhase = true;
        this.syncReelData(this.symbolsReel, this.multipliersReel);
    }

    syncReelData(data: number[], multiplier: number[]) {
        this.items.forEach((item, index) => {
            item.setItem(data[index]);
        });

        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.updateMultiplierItem(multiplier);
        }
        this.updateLowestIndex();
        data.forEach((row, index) => {
            const id = this.rowIndexToItemIndex(index);
            this.items[id].setItem(row);
        });
    }

    private updateSpin(dt: number) {
        this.updateCurrentSpeed(dt);
        this.updateBlurSymbols();
        const offset = this.calculateSpinOffset(dt);
        this.movingDistance += offset;

        this.movingReelDown(offset);

        if (this.isStoppingPhase) {
            if (this.currentSpeed <= this.SPEED_STOP_THRESHOLD) {
                AudioUtils.playSFX(AudioIds.REEL_STOP);
                this.startBounceStop();
            }
        }
    }

    private updateCurrentSpeed(dt: number) {
        if (this.isStoppingPhase) {
            const distance = this.stoppingDistance;
            const prev = easing.circOut(Math.min(1, this.deltaTime / this.stoppingDuration)) * distance;
            this.deltaTime += dt;
            const current = easing.circOut(Math.min(1, this.deltaTime / this.stoppingDuration)) * distance;
            this.currentSpeed = (current - prev) / dt;
        } else {
            this.currentSpeed = Math.min(this.maxSpeed, this.currentSpeed + this.acceleration * dt);
        }
    }

    private updateBlurSymbols() {
        if (this.currentSpeed > this.BLURRY_SPEED) {
            this.blurSymbols();
        } else {
            this.normalSymbols();
        }
    }

    private calculateSpinOffset(dt: number) {
        return this.currentSpeed * dt;
    }

    private startBounceStop() {
        this.deltaTime = 0;
        this.isStoppingPhase = false;
        this.state = State.BounceStop;
    }

    blurSymbols() {
        this.items.forEach((item) => {
            item.handleBlurAnim(true);
        });
    }

    normalSymbols() {
        this.items.forEach((item) => {
            item.handleBlurAnim(false);
        });
    }

    get acceleration() {
        return this.SPIN_ACCELERATION;
    }

    get maxSpeed() {
        return this.isFaster ? this.SPIN_MAX_SPEED_2 : this.SPIN_MAX_SPEED;
    }

    private updateBounceStop(dt: number) {
        const prev = easing.sineOut(Math.min(1, this.deltaTime / this.BOUNCE_STOP_DURATION)) * this.BOUNCE_STOP_DISTANCE;
        this.deltaTime += dt;
        const current = easing.sineOut(Math.min(1, this.deltaTime / this.BOUNCE_STOP_DURATION)) * this.BOUNCE_STOP_DISTANCE;

        const offset = current - prev;
        this.movingDistance -= offset;

        this.movingReelDown(-offset);

        if (this.checkDistanceLessThan(this.movingDistance, this.finalMovingDistance)) {
            this.state = State.None;
            this.finalAdjustment();
            this.onSpinFinishCallback();
            this.moveItemsBackToReelNode();
            this.clear();
        }
    }

    private checkDistanceLessThan(distance: number, targetDistance: number) {
        return distance <= targetDistance || Math.abs(distance - targetDistance) < 1;
    }

    // Final position adjustment
    private finalAdjustment() {
        const finalAdjustment = this.finalMovingDistance - this.movingDistance;
        this.movingReelDown(finalAdjustment);
        this.movingDistance = this.finalMovingDistance;
    }

    public stopSoon() {
        this.scheduleOnce(() => {
            this.prepareStop();
        }, this.DELAY_SLOW_DOWN_DURATION);
    }

    public moveFast() {
        this.isFaster = true;
    }

    // setItemData(data: number[], multiplier: number[]) {
    //     super.setItemData(data, multiplier);
    //     data.forEach((row, index) => {
    //         const id = this.rowIndexToItemIndex(index);
    //         this.items[id].setItem(row);
    //         //console.log("this.items[index]---------------------", `${this.items[index].node.name}----------row:${row}`);
    //         //console.log("this.items[id].setItem(row)---------------------", `id:${id}----------row:${row}`);
    //     });
    // }

    async highlightItem(index: number, gameSpeed: string) {
        const id = this.rowIndexToItemIndex(index);
        const item = this.items[id];
        ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
        await item.playEffect("highlight", gameSpeed);
    }

    async removeItem(index: number, gameSpeed: string) {
        const id = this.rowIndexToItemIndex(index);
        const item = this.items[id];
        if (resourcesCache.gameFeatures?.fixedExplodeDuration && gameSpeed !== GameSpeed.ULTRA) {
            item.playEffect("explode", gameSpeed).then(() => {
                item.node.destroy();
            });
            await AnimationUtils.delayTime(resourcesCache.gameFeatures.fixedExplodeDuration);
        } else {
            await item.playEffect("explode", gameSpeed);
            item.node.destroy();
        }
    }

    async removeItemsByIndex(list: number[], gameSpeed: string) {
        await Promise.all(list.map((index) => this.removeItem(index, gameSpeed)));
        this.items = this.items.filter((item, index) => !list.includes(this.rowIndexToItemIndex(index)));
    }

    getItem(index: number): CascadingSlotReelItem {
        const id = this.rowIndexToItemIndex(index);
        return this.items[id];
    }

    addItems(data: number[]): CascadingSlotReelItem[] {
        const items = [];
        data.forEach((value, index) => {
            const id = this.rowIndexToItemIndex(index);
            if (value === -1) {
                return;
            }
            const item = this.addItem();
            item.setItem(value);
            items.push(item);
            this.items[id] = item;
            item.node.position = v3(item.node.position.x, this.getItemPosY(this.itemDisplayCount + index), 0);
        });

        return items;
    }
}
