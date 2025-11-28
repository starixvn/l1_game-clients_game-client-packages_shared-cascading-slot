import gc from "@sg/game-client-base";
import { _decorator, Color, instantiate, Label, Node, NodePool, Prefab, sp, tween, UIOpacity, UIRenderer, v3, Vec3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { CascadingSlotState } from "db://shared-cascading-slot/cascading-slot-state";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import { random } from "lodash-es";
import Observer from "observer";
import { CascadingSlotConfig } from "../../../cascading-slot-base-configs";
import {
    BoardSize,
    convertBoardValue,
    GameSpeed,
    getConfigGameSpeed,
    globalEmitter,
    resourcesCache,
    SlotClientEvent,
    SlotNotification,
    SpecialSymbol,
    SymbolBoard,
    WinIconDetail,
} from "../../../cascading-slot-utils";
import { GameServiceMessageCascading, Tumble } from "../../../game-messages-cascading";
import { CascadingSlotTumblesHandlers } from "../../../handlers/cascading-slot-tumbles-handlers";
import { CascadingUIHandler } from "../../../handlers/cascading-ui-handler";
import { BetControlStore } from "../../../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../../stores/cascading-ui-store";
import { MultiplierItem } from "../../multiplier/multiplier-item";
import { CascadingPreviewOddsPopup } from "../../preview-symbol/cascading-preview-odds-popup";
import { CascadingSlotReel } from "../../slot-reel/cascading-slot-reel";
import { TotalMultiplierView } from "../../total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "../../tumbles/tumble-win-view";
const { observer, render, handle } = Observer;
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotBoard extends ObserverComponent {
    @property(Prefab)
    prfFlyLabelWin: Prefab = null;

    @property(Node)
    effectContainer: Node = null;

    @property(CascadingPreviewOddsPopup)
    previewPopup: CascadingPreviewOddsPopup = null;

    @property(Node)
    peekEffectOverlay: Node = null;

    @property(Node)
    peekEffectContainer: Node = null;

    effectMultiplierPrefab: Prefab = null;
    peekEffectTumblePrefab: Prefab = null;
    peekEffectNode: Node = null;

    protected peekEffectTumblePool: NodePool = new NodePool();
    protected readonly reels: CascadingSlotReel[] = [];
    public renderFromStore = true;
    public currentTotalMultiplier = 0;
    public colorInfo: any;
    public minPeekScatterCount = 3;
    public gameSpeed = GameSpeed.NORMAL;

    protected readonly PEEK_EFFECT_DURATION = 1;

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

    public addItems(data: number[][], peekEffect: boolean) {
        this.reels.forEach((reel, index) => {
            const items = data[index];
            const reelItems = reel.addItems(items);
            peekEffect && reel.peekEffectHighlightItems(reelItems);
            const isInfoOnLeft = index === this.reels.length - 1 || index === this.reels.length - 2;
            reelItems.forEach((item) => {
                this.previewPopup.addReelItemEvent(item, isInfoOnLeft);
            });
        });
    }

    initBoardFullItems() {
        this.createReels();
        this.generateRandomItems();
        this.changeCascadingState(CascadingSlotState.READY_BET);
    }

    generateRandomBoardData() {
        const samples = [
            [9, 1, 4, 2, 4, 8, 2, 0, 2, 2, 9, 5, 4, 10, 7, 0, 2, 7, 6, 6, 5, 8, 0, 3, 1, 5, 7, 3, 7, 7],
            [3, 4, 7, 7, 5, 2, 4, 5, 5, 3, 1, 10, 0, 9, 3, 7, 8, 3, 5, 7, 6, 6, 8, 7, 3, 0, 5, 0, 2, 7],
            [7, 5, 10, 2, 1, 7, 8, 9, 8, 8, 6, 8, 6, 4, 8, 5, 1, 0, 3, 6, 7, 9, 9, 0, 2, 0, 4, 6, 3, 1],
            [0, 1, 7, 3, 2, 1, 9, 5, 2, 8, 2, 7, 3, 7, 5, 10, 0, 0, 6, 4, 5, 4, 1, 8, 6, 4, 5, 3, 6, 9],
            [3, 6, 4, 0, 5, 2, 2, 2, 3, 7, 8, 4, 4, 3, 4, 9, 7, 4, 1, 10, 0, 1, 4, 2, 5, 9, 2, 1, 9, 0],
        ];
        const multipliers = resourcesCache.gameFeatures?.newMultiplierRange ? [[3], [8], [12], [20], [100]] : [[3], [8], [12], [15], [18]];
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
        this.previewPopup.addPreviewPopup(this.reels);
    }

    public setData(symbols: number[][], multiplier: number[]) {
        for (let i = 0; i < this.reels.length; i++) {
            this.reels[i].setItemData(symbols[i], multiplier);
        }
    }

    protected async fallOut(gameSpeed: string, delay: number) {
        for (let i = 0; i < this.reels.length; i++) {
            if (gameSpeed === GameSpeed.NORMAL && i > 0) {
                await AnimationUtils.delayTime(delay);
            }

            if (i < this.reels.length - 1) {
                this.reels[i].fallOut(gameSpeed);
            } else {
                await this.reels[i].fallOut(gameSpeed);
            }
        }
    }

    @handle(CascadingUIHandler, (handler, isShowMessages: boolean) => handler.handleShowMessages(isShowMessages))
    handleShowMessages(isShowMessages: boolean) {
        return isShowMessages;
    }

    async handleTumbles(tumbles: Tumble[], gameSpeed: string, tumbleWinView?: TumbleWinWiew) {
        if (!tumbles || tumbles.length <= 1) {
            return;
        }

        this.handleBottomMessage(SlotNotification.TUMBLE_WIN);

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
                    this.createFlyWinLabel(this.effectContainer, position, winIconDetail.win, tumbleWinView);
                });
                this.handleShowMessages(true);
                this.setTumbles(tumbles);
                this.handleTotalWinTumble(tumbleWin);
                this.setTumbleIcons(tumble);
                this.playSound(AudioIds.SYMBOL_MATCH);
            }

            await this.removeItems(explode, i, gameSpeed);
            await AnimationUtils.delayTime(getConfigGameSpeed("delayBeforeRefillSymbols", gameSpeed));

            const remains = this.reels.map((reel) => reel.getItemsData());
            // Store old items count before adding new items
            const oldItemsCount = this.reels.map((reel) => reel.getItems().length);
            const hasPeekEffect = gameSpeed === GameSpeed.NORMAL ? this.checkPeekEffectInTumbles(remains) : null;
            if (hasPeekEffect) {
                await this.fallInConcurrently(gameSpeed);
                this.reels.forEach((reel) => reel.peekEffectScatterItems());
                AudioUtils.playStoppableSFX(AudioIds.PEEK_EFFECT_REEL, true);

                this.showPeekEffectInTumbles(newItems);
                await AnimationUtils.delayTime(this.PEEK_EFFECT_DURATION);
            }

            this.addItems(newItems, hasPeekEffect);
            this.updateMultiplierItems(tumbleMultipliers);
            await this.fallIn(hasPeekEffect, gameSpeed, oldItemsCount);
            AudioUtils.stopStoppableSFX(AudioIds.PEEK_EFFECT_REEL);
            if (hasPeekEffect && i === tumbles.length - 2) {
                await AnimationUtils.delayTime(this.PEEK_EFFECT_DURATION);
            }
        }

        this.hidePeekEffects();
    }

    @handle(CascadingUIHandler, (handler, tumbleWin: number) => handler.handleTotalWinTumble(tumbleWin))
    handleTotalWinTumble(tumbleWin: number) {
        return tumbleWin;
    }

    public async spinResult(symbolsBoard: SymbolBoard, gameSpeed: string) {
        const delayEachReelFallOut = this.reels[0].DELAY_EACH_ITEM_FALL_OUT_DELAY;
        const delayEachReelFallIn = this.reels[0].DELAY_EACH_ITEM_FALL_IN_DELAY;
        const { symbols, multipliers } = symbolsBoard;
        console.time("spinResult");

        this.playSpinAudio(gameSpeed);

        await this.fallOut(gameSpeed, delayEachReelFallOut);

        const peekEffect = gameSpeed === GameSpeed.NORMAL ? this.checkPeekEffect(symbols) : null;
        for (let i = 0; i < this.reels.length; i++) {
            if (gameSpeed === GameSpeed.NORMAL && i > 0) {
                await AnimationUtils.delayTime(delayEachReelFallIn);
            }
            const reelSymbols = symbols[i];
            const awaitReelIndex = peekEffect?.peekIndex || this.reels.length - 1;
            if (i < awaitReelIndex) {
                this.reels[i].spin(reelSymbols, multipliers, gameSpeed, this.playSoundOnBottomItem(i));
            } else if (i === awaitReelIndex) {
                await this.reels[i].spin(reelSymbols, multipliers, gameSpeed, this.playSoundOnBottomItem(i));
            } else {
                this.showScattersOnPreviousReels(i);
                const begin = i === awaitReelIndex + 1;
                begin && AudioUtils.playStoppableSFX(AudioIds.PEEK_EFFECT_REEL, true);
                this.showPeekEffect(false, i);
                await AnimationUtils.delayTime(this.PEEK_EFFECT_DURATION);
                this.reels[i].peekEffectHighlightAllItems();
                await this.reels[i].spin(reelSymbols, multipliers, gameSpeed, this.playSoundOnBottomItem(i));
            }
        }
        console.timeEnd("spinResult");
        AudioUtils.stopStoppableSFX(AudioIds.PEEK_EFFECT_REEL);
        this.hidePeekEffects();
    }

    private showScattersOnPreviousReels(i: number) {
        this.reels.forEach((reel, index) => {
            if (index < i) {
                reel.moveItemsBackToReelNode();
                reel.peekEffectScatterItems();
            }
        });
    }

    private playSoundOnBottomItem(index: number) {
        if (index % 2 === 0) {
            return null;
        }

        return () => {
            this.playSound(AudioIds.REEL_STOP);
        };
    }

    private playSpinAudio(gameSpeed: string) {
        if (gameSpeed === GameSpeed.NORMAL) {
            this.playSound(AudioIds.SPINNING_NORMAL);
        } else {
            this.playSound(AudioIds.SPINNING_TURBO);
        }
    }

    getRandomWinItem(data: number[][], winIcon: number): Node {
        // First, try to find symbols in middle columns (excluding first and last)
        let matchingItems = this.findMatchingSymbols(data, winIcon, true);

        // If no symbols found in middle columns, search in all columns (including first and last)
        if (matchingItems.length === 0) {
            matchingItems = this.findMatchingSymbols(data, winIcon, false);
        }

        const randomIndex = random(0, matchingItems.length - 1);
        const { reelIndex, itemIndex } = matchingItems[randomIndex];
        return this.reels[reelIndex].getItemNode(itemIndex);
    }

    private findMatchingSymbols(
        data: number[][],
        winIcon: number,
        excludeEdgeColumns: boolean
    ): Array<{ reelIndex: number; itemIndex: number }> {
        const matchingItems: Array<{ reelIndex: number; itemIndex: number }> = [];
        const startIndex = excludeEdgeColumns ? 1 : 0;
        const endIndex = excludeEdgeColumns ? this.reels.length - 1 : this.reels.length;

        for (let reelIndex = startIndex; reelIndex < endIndex; reelIndex++) {
            const reelData = data[reelIndex];
            for (let itemIndex = 0; itemIndex < reelData.length; itemIndex++) {
                if (reelData[itemIndex] === winIcon) {
                    matchingItems.push({ reelIndex, itemIndex });
                }
            }
        }

        return matchingItems;
    }

    public async removeItems(data: number[][], tumbleIndex: number, gameSpeed: string) {
        console.time("removeItems");
        const reelItems = this.reels.map((reel, index) => {
            return data[index]
                .map((item, index) => {
                    return item !== -1 ? index : -1;
                })
                .filter((value) => value > -1);
        });
        gameSpeed !== GameSpeed.ULTRA && (this.peekEffectOverlay.active = true);
        await Promise.all(
            reelItems.map((items, index) => {
                const reel = this.reels[index];
                return reel.highlightItems(items, gameSpeed);
            })
        );
        this.peekEffectOverlay.active = false;
        await Promise.all(
            reelItems.map((items, index) => {
                const reel = this.reels[index];
                return reel.removeItemsByIndex(items, gameSpeed);
            })
        );
        console.timeEnd("removeItems");
    }

    public async fallInConcurrently(gameSpeed: string) {
        await Promise.all(
            this.reels.map((reel) => {
                return reel.fallIn(gameSpeed, null);
            })
        );
    }

    public async fallIn(peekEffect: boolean, gameSpeed: string, remainSymbolsCount?: number[]) {
        if (peekEffect) {
            for (let i = 0; i < this.reels.length; i++) {
                const reel = this.reels[i];
                await reel.fallIn(gameSpeed, null);
                reel.moveItemsBackToReelNode();
                reel.peekEffectScatterItems();
                this.hidePeekEffectAtIndex(i);
            }
        } else {
            const delay = gameSpeed === GameSpeed.ULTRA ? 0 : 0.1;
            // For each reel: fall in remaining items, wait for it to finish, delay 0.1s, then fall in new items
            // Each reel starts 0.1s after the previous reel starts (reels run in parallel, not waiting for completion)
            const reelPromises = this.reels.map(async (reel, reelIndex) => {
                await AnimationUtils.delayTime(reelIndex * delay);
                const oldCount = remainSymbolsCount[reelIndex];
                const newCount = reel.getItems().length;

                // Fall in remaining items and wait for it to finish
                if (oldCount > 0) {
                    reel.isReFillSymbols = true;
                    await reel.fallInRange(0, oldCount, gameSpeed, null);
                }

                // Delay 0.1s before falling in new items
                await AnimationUtils.delayTime(delay);

                // Fall in new items
                if (newCount > oldCount) {
                    reel.isReFillSymbols = true;
                    await reel.fallInRange(oldCount, newCount, gameSpeed, null);
                }
            });

            await Promise.all(reelPromises);
        }
    }

    public async shakeItems(gameSpeed: string) {
        await Promise.all(
            this.reels.map((reel) => {
                return reel.shakeItems(gameSpeed);
            })
        );
    }

    @render(CascadingUIStore, (store) => store.isShowHighlightScatters)
    private async highlightScatterItems(highlightScatters: boolean) {
        if (!this.renderFromStore) {
            return;
        }
        if (!highlightScatters) {
            return;
        }
        await Promise.all(this.reels.map((reel) => reel.highlightScatterItems()));
        this.handleHighlightScattersCompleted(true);
    }

    showNoWinBoard() {
        if (!this.effectContainer) {
            return;
        }
        this.effectContainer.active = true;
        const uiRenderer = this.effectContainer.getComponent(UIRenderer);
        const color = uiRenderer.color;
        uiRenderer.color = new Color(color.r, color.g, color.b, color.a * 0.7);
    }

    highlightExplodedSymbols(explodedSymbols: number[][]) {
        if (!this.effectContainer) {
            return;
        }
        this.effectContainer.active = true;
        explodedSymbols.forEach((symbols, reelIndex) => {
            symbols.forEach((symbol, index) => {
                if (symbol !== -1) {
                    const item = this.reels[reelIndex].getItem(index);
                    ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
                }
            });
        });

        this.reels.forEach((reel) => {
            const items = reel.getItems();
            items.forEach((item) => {
                if (item.isMultiplierSymbol) {
                    ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
                }
            });
        });
    }

    highlightScatterSymbolDetail() {
        if (!this.effectContainer) {
            return;
        }
        this.effectContainer.active = true;
        this.reels.forEach((reel) => {
            const items = reel.getItems();
            items.forEach((item) => {
                if (item.isScatterSymbol) {
                    ComponentUtils.moveToOtherNode(item.node, this.effectContainer);
                }
            });
        });
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
            const comp = item.getMultiplierItem();
            return comp ? [comp] : [];
        });
    }

    createFlyWinLabel(container: Node, position: Vec3, value: number, tumbleWinView?: TumbleWinWiew) {
        const node = instantiate(this.prfFlyLabelWin);
        container.addChild(node);
        node.position = position;

        const label = node.getComponent(Label);
        label.string = gc.FormatUtils.numberWithCommas(value, 2, false);
        this.flyWinLabelAnimation(node, tumbleWinView);
    }

    flyWinLabelAnimation(node: Node, tumbleWinView?: TumbleWinWiew) {
        node.scale = v3(0, 0, 0);
        node.getComponent(UIOpacity).opacity = 1;
        tween(node)
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

    @render(CascadingUIStore, (store) => store.totalMultiplier)
    private getTotalMultiplier(totalMultiplier: number) {
        if (!this.renderFromStore) {
            return;
        }
        this.currentTotalMultiplier = totalMultiplier;
    }

    async handleMultiplier(
        isFreeSpin: boolean,
        winMultiplier: boolean,
        tumbleWinView: TumbleWinWiew,
        totalMultiplierView: TotalMultiplierView,
        gameSpeed: string
    ) {
        const needMoveTotalMultiplier = isFreeSpin && winMultiplier && this.currentTotalMultiplier > 0;

        if (needMoveTotalMultiplier) {
            await tumbleWinView.shiftRightTumbleWin(this.currentTotalMultiplier);
            await this.movingMultiplier(totalMultiplierView.total.node, this.effectContainer, tumbleWinView.multiplier.node);
            this.setMultiplierValue(this.currentTotalMultiplier);
        }

        if (winMultiplier) {
            const multiplierItems = this.getMultiplierItems();
            for (const mItem of multiplierItems) {
                this.playSound(AudioIds.MULTIPLIER_ACTIVATE);
                await mItem.playAnimationGlow(gameSpeed);
                await tumbleWinView.shiftRightTumbleWin(mItem.multiplier);
                await this.movingMultiplier(mItem.value.node, this.effectContainer, tumbleWinView.multiplier.node);
                this.playSound(AudioIds.WIN);
                this.setMultiplierValue(mItem.multiplier);
            }

            await AnimationUtils.delayTime(tumbleWinView.mulitiplierEffectDuration);
        }
    }

    movingMultiplier(multiplierNode: Node, container: Node, destNode: Node) {
        return new Promise<void>((resolve) => {
            const node = instantiate(multiplierNode);
            node.active = true;
            const startPos = ComponentUtils.convertPosition(container, multiplierNode);
            const destPos = ComponentUtils.convertPosition(container, destNode);
            container.addChild(node);
            node.position = startPos;

            const distance = startPos.subtract(destPos).length();
            const pixelPerSecond = 750;
            const duration = distance / pixelPerSecond;
            tween(node)
                .to(duration * 0.3, { scale: v3(1.5, 1.5, 1.5) }, { easing: "sineOut" })
                .to(duration * 0.69, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
                .start();
            tween(node)
                .to(duration, { position: destPos }, { easing: "sineOut" })
                .call(() => {
                    resolve();
                    node.destroy();
                })
                .start();
        });
    }

    @handle(CascadingUIHandler, (handle, multiplier: number) => handle.handleMultiplier(multiplier))
    setMultiplierValue(multiplier: number) {
        return multiplier;
    }

    @handle(CascadingSlotTumblesHandlers, (handler, tumbles: Tumble[]) => handler.handleTumbles(tumbles))
    setTumbles(tumbles: Tumble[]) {
        return tumbles;
    }

    @handle(CascadingSlotTumblesHandlers, (handler, tumble: any) => handler.setTumble(tumble))
    setTumbleIcons(tumble: any) {
        return tumble;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs, { fireImmediately: false })
    private getOdds(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!this.renderFromStore) {
            return;
        }
        if (!gameConfigs) {
            return;
        }
        this.previewPopup.odds = gameConfigs.odds;
    }

    @render(CascadingUIStore, (store) => store.minPeekScatterCount)
    private getMinPeekScatterCount(minPeekScatterCount: number) {
        if (!this.renderFromStore) {
            return;
        }
        this.minPeekScatterCount = minPeekScatterCount;
    }

    @render(BetControlStore, (store) => store.betLevel)
    private setBetLevel(betLevel: number) {
        if (!this.renderFromStore) {
            return;
        }
        if (!this.previewPopup) {
            return;
        }
        this.previewPopup.betLevel = betLevel;
    }

    @render(BetControlStore, (store) => store.coinValue)
    private setCoinValue(coinValue: number) {
        if (!this.renderFromStore) {
            return;
        }
        if (!this.previewPopup) {
            return;
        }
        this.previewPopup.coinValue = coinValue;
    }

    @handle(CascadingUIHandler, (handler, state: string) => handler.handleBottomMessage(state))
    handleBottomMessage(state: string) {
        return state;
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleHighlightScattersCompleted(completed))
    handleHighlightScattersCompleted(completed: boolean) {
        return completed;
    }

    @handle(CascadingUIHandler, (handler, state: string) => handler.changeCascadingState(state))
    changeCascadingState(state: string) {
        return state;
    }

    onLoad() {
        super.onLoad();

        if (this.effectContainer) {
            if (resourcesCache.gameFeatures?.effectIntroMultiplier) {
                this.loadEffectMultiplierPrefab();
                globalEmitter.on(SlotClientEvent.EFFECT_INTRO_MULTIPLIER, this.playEffectIntroMultiplier, this);
            }

            if (resourcesCache.gameFeatures?.enablePeekEffect) {
                this.loadPeekEffectPrefab().then(() => {
                    this.initPeekEffectPool();
                });
            }
        }
    }

    onDestroy(): void {
        globalEmitter.targetOff(this);
    }

    async loadEffectMultiplierPrefab() {
        this.effectMultiplierPrefab = await bundleManager.loadResourcesAsset("prefabs/effect-multiplier", Prefab);
    }

    async loadPeekEffectPrefab() {
        const prefab = await bundleManager.loadResourcesAsset<Prefab>("prefabs/peek-effect", Prefab);
        this.peekEffectNode = instantiate(prefab);
        this.peekEffectNode.active = false;
        this.peekEffectTumblePrefab = await bundleManager.loadResourcesAsset("prefabs/peek-effect-tumble", Prefab);
    }

    protected initPeekEffectPool() {
        // Pre-instantiate a few nodes for the pool
        for (let i = 0; i < BoardSize.COLUMN; i++) {
            const node = instantiate(this.peekEffectTumblePrefab);
            this.peekEffectTumblePool.put(node);
        }
    }

    @handle(CascadingUIHandler, (handler, show: boolean) => handler.setPeekEffect(show))
    setPeekEffect(show: boolean) {
        return show;
    }

    @render(CascadingUIStore, (store) => store.gameSpeed)
    renderGameSpeed(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    showPeekEffect(inTumble: boolean, reelIndex: number, row = 0) {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return;
        }
        this.setPeekEffect(true);
        this.peekEffectOverlay.active = true;
        this.peekEffectContainer.active = true;

        const shouldShiftAnimation = !inTumble ? this.peekEffectNode.active : false;

        const nodeName = this.getNamePeekEffectNode(reelIndex);
        const peekEffectNode = !inTumble
            ? this.peekEffectNode
            : this.peekEffectContainer.getChildByName(nodeName) ?? this.peekEffectTumblePool.get();

        peekEffectNode.parent = this.peekEffectContainer;
        peekEffectNode.name = nodeName;
        peekEffectNode.active = true;

        const reel = this.reels[reelIndex];
        reel.peekEffect = true;
        const position = reel.node.position;
        const y = row * (reel.itemSize + reel.spacing);
        const duration = 0.4;
        if (shouldShiftAnimation) {
            AudioUtils.playSFX(AudioIds.PEEK_EFFECT_SHIFT);
            tween(peekEffectNode)
                .to(duration, { position: v3(position.x, y) })
                .start();
        } else {
            peekEffectNode.setPosition(v3(position.x, y));
            AnimationUtils.fadeIn(peekEffectNode, duration);
        }

        const spine = peekEffectNode.getComponentInChildren(sp.Skeleton);
        spine.setAnimation(0, "show", true);
    }

    getNamePeekEffectNode(reelIndex: number) {
        return `reel-${reelIndex}`;
    }

    async hidePeekEffectAtIndex(reelIndex: number) {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return;
        }
        this.reels[reelIndex].peekEffect = false;
        const node = this.peekEffectContainer.getChildByName(this.getNamePeekEffectNode(reelIndex));
        if (node) {
            await AnimationUtils.fadeOut(node, 0.3);
            this.peekEffectTumblePool.put(node);
        }
    }

    hidePeekEffects() {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return;
        }
        this.peekEffectOverlay.active = false;
        this.peekEffectContainer.active = false;

        // Return all peek effect nodes to the pool
        const peekEffectNodes = this.peekEffectContainer.children.slice(); // Create a copy to avoid modification during iteration
        peekEffectNodes.forEach((node) => {
            node.name = "";
            if (node !== this.peekEffectNode) {
                this.peekEffectTumblePool.put(node);
            } else {
                this.peekEffectNode.active = false;
            }
        });

        this.reels.forEach((reel) => {
            reel.peekEffect = false;
            reel.moveItemsBackToReelNode();
        });
    }

    checkPeekEffect(symbols: number[][]) {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return null;
        }

        const result: {
            peekIndex?: number;
        } = {};
        const SCATTER_SYMBOL = SpecialSymbol.SCATTER_SYMBOL;

        let peekReelIndex = -1;
        // Count scatters in each reel up to current index
        for (let reelIndex = 1; reelIndex < symbols.length; reelIndex++) {
            let scatterCount = 0;

            // Check all previous reels
            for (let prevReel = 0; prevReel <= reelIndex; prevReel++) {
                // Count scatters in this previous reel
                scatterCount += symbols[prevReel].filter((symbol) => symbol === SCATTER_SYMBOL).length;
            }

            // If we found this.minPeekScatterCount scatters in previous reels, this is our peek column
            if (scatterCount >= this.minPeekScatterCount) {
                peekReelIndex = reelIndex;
                break;
            }
        }

        const maxPeekIndex = symbols.length - 1;
        if (peekReelIndex > -1 && peekReelIndex < maxPeekIndex) {
            result.peekIndex = peekReelIndex;
            return result;
        }

        return null;
    }

    checkPeekEffectInTumbles(symbols: number[][]) {
        if (!resourcesCache.gameFeatures?.enablePeekEffect) {
            return false;
        }
        const SCATTER_SYMBOL = SpecialSymbol.SCATTER_SYMBOL;

        const scatterCount = symbols.flat().reduce((acc, symbol) => {
            return acc + (symbol === SCATTER_SYMBOL ? 1 : 0);
        }, 0);

        return scatterCount >= this.minPeekScatterCount;
    }

    showPeekEffectInTumbles(symbols: number[][]) {
        const reels = symbols.map((symbol, index) => {
            return symbol.findIndex((value) => {
                return value !== -1;
            });
        });

        for (let i = 0; i < reels.length; i++) {
            const row = reels[i];
            if (row > -1) {
                this.showPeekEffect(true, i, row);
            }
        }
    }

    playEffectIntroMultiplier(data: { worldPosition: Vec3; level: number; node: Node; position: Vec3 }) {
        if (!this.effectMultiplierPrefab) {
            return;
        }

        AudioUtils.playSFX(AudioIds.MULTIPLIER_LAND);

        const { level, node, position } = data;
        const effectNode = instantiate(this.effectMultiplierPrefab);
        this.effectContainer.addChild(effectNode);
        effectNode.position = ComponentUtils.convertPosition(this.effectContainer, node.parent, position);
        effectNode.active = true;

        const spine = effectNode.getComponentInChildren(sp.Skeleton);
        const ratioSpeed = getConfigGameSpeed("ratioMatchAndExplosionSymbol", this.gameSpeed);
        const duration = spine.findAnimation(`level${level}`).duration * ratioSpeed;
        AnimationUtils.playSpine(spine, `level${level}`, false, duration).then(() => {
            effectNode.destroy();
        });
    }
}
