import { _decorator, instantiate, Node, tween, UIOpacity, UITransform, v3, Vec3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { TotalMultiplierView } from "../../total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "../../tumbles/tumble-win-view";
import { CascadingSlotBoard } from "./cascading-slot-board";
import { cascadingSlotLogger } from "../../../cascading-slot-logger";

const { observer, render, handle } = Observer;
const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingSlotBoard extends CascadingSlotBoard {
    async handleMultiplier(
        isFreeSpin: boolean,
        winMultiplier: boolean,
        tumbleWinView: TumbleWinWiew,
        totalMultiplierView: TotalMultiplierView
    ) {
        cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] handleMultiplier called with isFreeSpin: ${isFreeSpin}, winMultiplier: ${winMultiplier}, currentTotalMultiplier: ${this.currentTotalMultiplier}`);
        const needMoveTotalMultiplier = isFreeSpin && winMultiplier && this.currentTotalMultiplier > 0;
        cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] needMoveTotalMultiplier: ${needMoveTotalMultiplier}`);

        if (needMoveTotalMultiplier) {
            this.setMultiplierValue(this.currentTotalMultiplier);
            cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Set multiplier value to current total: ${this.currentTotalMultiplier}`);
        }
        if (!winMultiplier) {
            cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] No win multiplier, returning early`);
            return;
        }
        const multiplierItems = this.getMultiplierItems();
        let accumulatedMultiplier = 0;
        cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Processing ${multiplierItems.length} multiplier items`);

        for (const mItem of multiplierItems) {
            cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Processing multiplier item with value: ${mItem.multiplier}`);
            this.playSound(AudioIds.MULTIPLIER_ACTIVATE);
            await mItem.playAnimationGlow();
            await tumbleWinView.shiftRightTumbleWin(mItem.multiplier);

            this.playSound(AudioIds.WIN);
            this.setMultiplierValue(mItem.multiplier);

            if (this.currentTotalMultiplier > 0) {
                await this.movingMultiplierToTotalMultiplier(mItem.value.node, this.effectContainer, totalMultiplierView);
                accumulatedMultiplier += +mItem.multiplier;
                totalMultiplierView.setTotalMultiplierTmp(this.currentTotalMultiplier + accumulatedMultiplier);
                cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Moved multiplier to total, accumulated: ${accumulatedMultiplier}, temp total: ${this.currentTotalMultiplier + accumulatedMultiplier}`);
            } else {
                await this.movingMultiplier(mItem.value.node, this.effectContainer, tumbleWinView.multiplier.node);
                cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Moved multiplier to tumble win view`);
            }
        }
        if (this.currentTotalMultiplier > 0) {
            cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] Moving total multiplier to total win`);
            await this.movingTotalMultipliertoTotalWin(totalMultiplierView, this.effectContainer, tumbleWinView.multiplier.node);
        }
        cascadingSlotLogger.info(`[PortraitCascadingSlotBoard] handleMultiplier completed`);
    }

    movingMultiplier(multiplierNode: Node, container: Node, destNode: Node) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(multiplierNode, container);
            const destPos = ComponentUtils.convertPosition(container, destNode);
            const duration = 0.6;

            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    movingMultiplierToTotalMultiplier(multiplierNode: Node, container: Node, totalMultiplierView: TotalMultiplierView) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(multiplierNode, container);
            const destPosTmp = ComponentUtils.convertPosition(container, totalMultiplierView.total.node);
            const totalValueWidth = totalMultiplierView.total.node.getComponent(UITransform).width;
            const destPos = v3(destPosTmp.x - totalValueWidth / 2, destPosTmp.y, 0);
            const duration = 0.6;

            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    movingTotalMultipliertoTotalWin(totalMultiplierView: TotalMultiplierView, container: Node, totalWinView: Node) {
        return new Promise<void>((resolve) => {
            const node = this.initStartNode(totalMultiplierView.total.node, container);
            const destPosTmp = ComponentUtils.convertPosition(container, totalWinView);
            const totalMultipierWidth = totalMultiplierView.total.node.getComponent(UITransform).width;
            const destPos = v3(destPosTmp.x + totalMultipierWidth, destPosTmp.y, 0);
            const duration = 0.5;

            this.animMoveMultiplier(node, destPos, duration, resolve);
        });
    }

    animMoveMultiplier(node: Node, position: Vec3, duration: number, resolve: () => void) {
        tween(node)
            .to(duration - 0.4, { scale: v3(1, 1, 1) }, { easing: "sineOut" })
            .to(0.2, { scale: v3(2, 2, 2) }, { easing: "sineOut" })
            .to(0.2, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
            .start();
        tween(node.getComponent(UIOpacity))
            .delay(duration - 0.2)
            .to(0.2, { opacity: 0 }, { easing: "sineOut" })
            .start();
        tween(node)
            .to(duration - 0.3, { position: position }, { easing: "sineOut" })
            .delay(0.3)
            .call(() => {
                resolve();
                node.destroy();
            })
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


