import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab, tween, UIOpacity, v3, Vec3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils, FunctionUtils } from "db://shared-components/shared/utils";
import { random } from "lodash-es";
import Observer from "observer";
import { CascadingSlotConfig, UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
import { Tumble } from "../../game-messages-cascading";
import { MultiplierItem } from "../../multiplier/multiplier-item";
import { CascadingSlotReel } from "../../slot-reel/scripts/cascading-slot-reel";
import { CascadingSlotBoardStore } from "../cascading-slot-board-store";
import { convertBoardValue, SymbolBoard, WinIconDetail } from "./../../cascading-slot-utils";
const { observer, render, handle } = Observer;
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotBoard extends ObserverComponent {
    @property(Prefab)
    prfFlyLabelWin: Prefab = null;

    @property(Node)
    effectContainer: Node = null;

    protected readonly reels: CascadingSlotReel[] = [];

    public createReels() {
        if (this.reels.length > 0) {
            return;
        }
        this.node.children.forEach((child) => {
            const slotReel = child.getComponent(CascadingSlotReel);
            if (slotReel) {
                slotReel.itemDisplayCount = CascadingSlotConfig.reelItemCount;
                slotReel.createReel();
                this.reels.push(slotReel);
            }
        });
    }

    public addItems(data: number[][]) {
        this.reels.forEach((reel, index) => {
            const items = data[index];
            reel.addItems(items);
        });
    }

    initBoardFullItems() {
        this.createReels();
        this.generateRandomItems();
    }

    generateRandomBoardData() {
        const samples = [
            [9, 1, 4, 2, 4, 8, 2, 0, 2, 2, 9, 5, 4, 10, 7, 0, 2, 7, 6, 6, 5, 8, 0, 3, 1, 5, 7, 3, 7, 7],
            [3, 4, 7, 7, 5, 2, 4, 5, 5, 3, 1, 10, 0, 9, 3, 7, 8, 3, 5, 7, 6, 6, 8, 7, 3, 0, 5, 0, 2, 7],
            [7, 5, 10, 2, 1, 7, 8, 9, 8, 8, 6, 8, 6, 4, 8, 5, 1, 0, 3, 6, 7, 9, 9, 0, 2, 0, 4, 6, 3, 1],
            [0, 1, 7, 3, 2, 1, 9, 5, 2, 8, 2, 7, 3, 7, 5, 10, 0, 0, 6, 4, 5, 4, 1, 8, 6, 4, 5, 3, 6, 9],
            [3, 6, 4, 0, 5, 2, 2, 2, 3, 7, 8, 4, 4, 3, 4, 9, 7, 4, 1, 10, 0, 1, 4, 2, 5, 9, 2, 1, 9, 0],
        ];
        const multipliers = [[3], [8], [12], [15], [18]];
        const randomIndex = random(samples.length - 1);
        console.log(`B${randomIndex}`);
        return { symbols: samples[randomIndex], multipliers: multipliers[randomIndex] };
    }

    protected generateRandomItems() {
        const data = this.generateRandomBoardData();
        const multipliers = data.multipliers;
        const symbols = data.symbols;
        this.reels.forEach((reel, index) => {
            const start = index * reel.itemDisplayCount;
            const end = start + reel.itemDisplayCount;
            const itemData = symbols.slice(start, end);
            reel.setItemData(itemData, multipliers);
        });
    }

    protected async fallOut(isTurbo: boolean, delay: number) {
        for (let i = 0; i < this.reels.length; i++) {
            if (!isTurbo && i > 0) {
                await FunctionUtils.delay(delay * UNIT_SECOND_SPIN);
            }

            if (i < this.reels.length - 1) {
                this.reels[i].fallOut(isTurbo);
            } else {
                await this.reels[i].fallOut(isTurbo);
            }
        }
    }

    async handleTumbles(tumbles: Tumble[]) {
        if (!tumbles || tumbles.length <= 0) {
            return;
        }
        let multiplierCount = tumbles[0].multipliers.length;
        for (let i = 0; i < tumbles.length - 1; i++) {
            const tumble = tumbles[i];
            const { icons, win: tumbleWin, settlement } = tumble;
            const newTumbleMultipliers = [...tumbles[i + 1].multipliers];
            const getMoreMultiplier = newTumbleMultipliers.length > multiplierCount;
            if (getMoreMultiplier) {
                multiplierCount = newTumbleMultipliers.length;
            }
            const tumbleMultipliers = newTumbleMultipliers;

            const explode = convertBoardValue(settlement.explode);
            const newItems = convertBoardValue(settlement.new);

            if (tumbleWin > 0) {
                Object.keys(icons).forEach((iconKey) => {
                    const winIconDetail: WinIconDetail = icons[iconKey];
                    const node = this.getRandomWinItem(explode, +iconKey);
                    const position = ComponentUtils.convertPosition(this.effectContainer, node);
                    this.createFlyWinLabel(this.effectContainer, position, winIconDetail.win);
                });
                // mainGame.gameData.uiModel.increaseTumbleWin(tumbleWin);
            }

            await this.removeItems(explode, i);
            this.addItems(newItems);
            this.updateMultiplierItems(tumbleMultipliers);
            await this.fallIn(false);
        }
    }

    @render(CascadingSlotBoardStore, (store) => store.symbolsBoard, { fireImmediately: false })
    async handleSettlementForBoard(symbolsBoard: SymbolBoard) {
        await this.spinResult(symbolsBoard);
        await this.handleTumbles(symbolsBoard.tumbles);
    }

    public async spinResult(symbolsBoard: SymbolBoard) {
        const duration = (5 * 145) / this.reels[0].pixelPerSecond;
        const delay = 0.25 * duration;
        const { isTurbo, symbols, multipliers } = symbolsBoard;

        // if (isTurbo) {
        //     this.addSoundBoard(CascadingSlotGameSound.TURBO_DROP_IN);
        // } else {
        //     this.addSoundBoard(CascadingSlotGameSound.DROP_IN);
        // }

        await this.fallOut(isTurbo, delay);

        // const soundArray = [
        //     CascadingSlotGameSound.REEL_STOP,
        //     CascadingSlotGameSound.REEL_STOP_1,
        //     CascadingSlotGameSound.REEL_STOP_2,
        //     CascadingSlotGameSound.REEL_STOP_3,
        //     CascadingSlotGameSound.REEL_STOP_4,
        //     CascadingSlotGameSound.REEL_STOP_5
        // ];
        const playSoundOnBottomItem = (index: number) => () => {
            // if (index % 2 === 1) {
            //     this.addSoundBoard(soundArray[index]);
            // }
        };
        for (let i = 0; i < this.reels.length; i++) {
            if (!isTurbo && i > 0) {
                await FunctionUtils.delay(delay * UNIT_SECOND_SPIN);
            }

            if (i < this.reels.length - 1) {
                this.reels[i].spin(symbols[i], multipliers, isTurbo, playSoundOnBottomItem(i));
            } else {
                await this.reels[i].spin(symbols[i], multipliers, isTurbo, playSoundOnBottomItem(i));
            }
        }
    }

    getRandomWinItem(data: number[][], winIcon: number): Node {
        const list = [];
        for (let i = 0; i < this.reels.length; i++) {
            const reelData = data[i];
            for (let j = 0; j < reelData.length; j++) {
                if (reelData[j] === winIcon) {
                    list.push({ i, j });
                }
            }
        }
        const randomIndex = random(0, list.length - 1);
        const randomItem = list[randomIndex];
        return this.reels[randomItem.i].getItemNode(randomItem.j);
    }

    public async removeItems(data: number[][], tumbleIndex: number) {
        const reelItems = this.reels.map((reel, index) => {
            return data[index]
                .map((item, index) => {
                    return item !== -1 ? index : -1;
                })
                .filter((value) => value > -1);
        });

        await Promise.all(
            reelItems.map((items, index) => {
                const reel = this.reels[index];
                return reel.highlightItems(items);
            })
        );

        await Promise.all(
            reelItems.map((items, index) => {
                const reel = this.reels[index];
                return reel.removeItemsByIndex(items);
            })
        );
    }

    public async fallIn(isTurbo: boolean) {
        await Promise.all(
            this.reels.map(async (reel) => {
                await reel.fallIn(isTurbo, null);
            })
        );
    }

    public async shakeItems() {
        await Promise.all(
            this.reels.map((reel) => {
                return reel.shakeItems();
            })
        );
    }

    async highlightScatterItems() {
        await Promise.all(this.reels.map((reel) => reel.highlightScatterItems()));
    }

    public updateMultiplierItems(multipliers: number[]) {
        const multiplierItems = this.getMultiplierItems();
        multiplierItems.forEach((multiplierItem, index) => {
            this.setValueMultiplier(index, multipliers, multiplierItem);
        });
    }

    protected setValueMultiplier(index: number, multipliers: number[], multiplierItem: MultiplierItem) {
        multiplierItem.setValue(multipliers[index]);
    }

    public getMultiplierItems() {
        const items = this.reels.flatMap((reel) => [...reel.getItems()].reverse());
        return items.flatMap((item) => {
            const comp = item.content.children[0].getComponent(MultiplierItem);
            return comp ? [comp] : [];
        });
    }

    createFlyWinLabel(container: Node, position: Vec3, value: number) {
        const node = instantiate(this.prfFlyLabelWin);
        container.addChild(node);
        node.position = position;

        const label = node.getComponent(Label);
        label.string = gc.FormatUtils.numberWithCommas(value, 2, false);
        this.flyWinLabelAnimation(node);
    }

    flyWinLabelAnimation(node: Node) {
        node.scale = v3(0, 0, 0);
        node.getComponent(UIOpacity).opacity = 1;
        const t = tween(node)
            .parallel(
                tween(node.getComponent(UIOpacity))
                    .to(0.05, { opacity: 255 })
                    .delay(1)
                    .to(0.1, { opacity: 255 })
                    .to(0.1, { opacity: 190 })
                    .to(0.1, { opacity: 120 })
                    .to(0.2, { opacity: 0 }, { easing: "sineOut" }),
                tween(node)
                    .to(0.05, { scale: v3(1, 1, 1) })
                    .to(0.1, { scale: v3(1.3, 1.3, 1) })
                    .to(1.3, { scale: v3(0.9, 0.9, 1) }, { easing: "sineOut" }),
                tween(node)
                    .by(0.15, { position: v3(0, -10, 0) })
                    .by(1.3, { position: v3(0, 60, 0) }, { easing: "sineOut" })
            )

            .call(() => {
                node.destroy();
            })
            .start();
    }
}
