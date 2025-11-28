import { _decorator, instantiate, Node, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { GameSpeed, getConfigGameSpeed } from "db://shared-cascading-slot/cascading-slot-utils";
import { CascadingUIHandler } from "db://shared-cascading-slot/handlers/cascading-ui-handler";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { TotalMultiplierView } from "../../total-multiplier/cascading-total-multiplier-view";
import { PortraitTumbleWinWiew } from "../../tumbles/portrait-tumble-win-view";
import { TumbleWinWiew } from "../../tumbles/tumble-win-view";
import { CascadingSlotBoard } from "./cascading-slot-board";
const { render, handle } = Observer;
const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingSlotBoard extends CascadingSlotBoard {
    private totalTumbleWin = 0;
    private gameSpeed = GameSpeed.NORMAL;
    async handleMultiplier(
        isFreeSpin: boolean,
        winMultiplier: boolean,
        tumbleWinView: TumbleWinWiew,
        totalMultiplierView: TotalMultiplierView,
        gameSpeed: string
    ) {
        const needMoveTotalMultiplier = isFreeSpin && winMultiplier && this.currentTotalMultiplier > 0;

        if (needMoveTotalMultiplier) {
            this.setMultiplierValue(this.currentTotalMultiplier);
        }
        if (!winMultiplier) {
            return;
        }
        const multiplierItems = this.getMultiplierItems();
        let accumulatedMultiplier = 0;

        for (const mItem of multiplierItems) {
            this.playSound(AudioIds.MULTIPLIER_ACTIVATE);
            await mItem.playAnimationGlow(gameSpeed);
            await tumbleWinView.shiftRightTumbleWin(mItem.multiplier);

            this.playSound(AudioIds.WIN);
            this.setMultiplierValue(mItem.multiplier);

            if (this.currentTotalMultiplier > 0) {
                await this.movingMultiplierToTotalMultiplier(mItem.value.node, this.effectContainer, totalMultiplierView);
                accumulatedMultiplier += +mItem.multiplier;
                totalMultiplierView.setTotalMultiplierTmp(this.currentTotalMultiplier + accumulatedMultiplier);
            } else {
                await this.movingMultiplier(mItem.value.node, this.effectContainer, tumbleWinView.multiplier.node);
            }
        }
        if (this.currentTotalMultiplier > 0) {
            await this.movingTotalMultipliertoTotalWin(totalMultiplierView, this.effectContainer, tumbleWinView.multiplier.node);
        }
    }
    @render(CascadingUIStore, (store) => store.totalWin, { fireImmediately: false })
    setTumbleWinValuewin(totalTumbleWin: number) {
        this.totalTumbleWin = totalTumbleWin;
    }

    @render(CascadingUIStore, (store) => store.gameSpeed)
    renderTurboMode(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    async flyWinLabelAnimation(node: Node, tumbleWinView?: PortraitTumbleWinWiew) {
        if (tumbleWinView) {
            await new Promise<void>((resolve) => {
                const duration = 0.3;
                tween(node)
                    .to(duration * 0.5, { scale: v3(2, 2, 2) }, { easing: "sineOut" })
                    .to(duration * 0.5, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
                    .call(() => {
                        resolve();
                    })
                    .start();
            });
            await AnimationUtils.delayTime(getConfigGameSpeed("zoomInValueDuration", this.gameSpeed));
            if (!node || !node.isValid) {
                return;
            }

            const isBottomPosition = this.isNodeAtBottomBoard(node);
            const moveDuration = isBottomPosition
                ? getConfigGameSpeed("bottomMessageAnimDuration", this.gameSpeed)
                : getConfigGameSpeed("totalWinLabelAnimDuration", this.gameSpeed);

            await this.movingLabelToTotalWin(node, this.effectContainer, tumbleWinView.multiplier.node, moveDuration);
            tumbleWinView.totalWinNode.active = true;
            await tumbleWinView.setTotalWinValue(this.totalTumbleWin);
        }
    }

    private isNodeAtBottomBoard(node: Node): boolean {
        const threshold = 150;
        if (!node || !node.isValid) {
            return false;
        }
        if (!this.reels || this.reels.length === 0) {
            return false;
        }
        const bottomItems = this.reels.map(reel => {
            const items = reel.getItems();
            return items.length > 0 ? items[0] : null;
        }).filter(item => item !== null && item.node && item.node.isValid);
        if (bottomItems.length === 0) {
            return false;
        }
        const avgBottomY = bottomItems.reduce((sum, item) => sum + item.node.worldPosition.y, 0) / bottomItems.length;
        return Math.abs(node.worldPosition.y - avgBottomY) < threshold;
    }

    movingLabelToTotalWin(multiplierNode: Node, container: Node, destNode: Node, duration: number) {
        return new Promise<void>((resolve) => {
            const destPosTmp = ComponentUtils.convertPosition(container, destNode);
            const destPos = v3(destPosTmp.x, destPosTmp.y, destPosTmp.z);
            this.animMoveLabel(multiplierNode, destPos, duration, resolve);
        });
    }

    movingMultiplier(multiplierNode: Node, container: Node, destNode: Node) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(multiplierNode, container);
            const destPos = ComponentUtils.convertPosition(container, destNode);
            const duration = getConfigGameSpeed("totalMultiplierAnimDuration", this.gameSpeed);;
            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    movingMultiplierToTotalMultiplier(multiplierNode: Node, container: Node, totalMultiplierView: TotalMultiplierView) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(multiplierNode, container);
            const destPosTmp = ComponentUtils.convertPosition(container, totalMultiplierView.total.node);
            const totalValueWidth = totalMultiplierView.total.node.getComponent(UITransform).width;
            const destPos = v3(destPosTmp.x - totalValueWidth / 2, destPosTmp.y, 0);
            const duration = getConfigGameSpeed("totalMultiplierAnimDuration", this.gameSpeed);
            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    movingTotalMultipliertoTotalWin(totalMultiplierView: TotalMultiplierView, container: Node, totalWinView: Node) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(totalMultiplierView.total.node, container);
            const destPosTmp = ComponentUtils.convertPosition(container, totalWinView);
            const totalMultipierWidth = totalMultiplierView.total.node.getComponent(UITransform).width;
            const destPos = v3(destPosTmp.x + totalMultipierWidth, destPosTmp.y, 0);
            const duration = getConfigGameSpeed("totalMultiplierAnimDuration", this.gameSpeed);
            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    @handle(CascadingUIHandler, (handle, isShowMessages: boolean) => handle.handleShowMessages(isShowMessages))
    setShowMessages(isShowMessages: boolean) {
        return isShowMessages;
    }

    animMoveMultiplier(node: Node, position: Vec3, duration: number, resolve: () => void) {
        tween(node)
            .to(duration, { position: position }, { easing: "sineOut" })
            .delay(0.2)
            .to(duration, { scale: v3(5, 5, 5) }, { easing: "sineOut" })
            .start();
        tween(node.getComponent(UIOpacity))
            .delay(duration + 0.2)
            .to(0.3, { opacity: 0 }, { easing: "sineOut" })
            .call(() => {
                resolve();
                node.destroy();
            })
            .start();
    }

    animMoveLabel(node: Node, position: Vec3, duration: number, resolve: () => void) {
        const uiOpacity = node.getComponent(UIOpacity);
        if (!uiOpacity) {
            node.addComponent(UIOpacity);
        }
        
        
        tween(node)
            .to(duration * 0.8, { position: position })
            .call(() => {
                this.setShowMessages(false);
                resolve();
                node.destroy();
            })
            .start();
        
        tween(node.getComponent(UIOpacity))
            .delay(duration)
            .to(duration, { opacity: 0 }, { easing: "sineOut" })
            .start();
    }

    initStartNode(nodeStart: Node, container: Node) {
        const node = instantiate(nodeStart);
        node.active = true;
        const startPos = ComponentUtils.convertPosition(container, nodeStart);
        container.addChild(node);
        node.position = startPos;
        return node;
    }
}
