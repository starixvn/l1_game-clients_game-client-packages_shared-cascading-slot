import { _decorator, instantiate, Node, tween, UIOpacity, v3 } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AnimationUtils, ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { TotalMultiplierView } from "../../total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "../../tumbles/tumble-win-view";
import { CascadingSlotBoard } from "./cascading-slot-board";
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
            await mItem.playAnimationGlow();
            await tumbleWinView.shiftRightTumbleWin(mItem.multiplier);

            this.playSound(AudioIds.WIN);
            this.setMultiplierValue(mItem.multiplier);

            if (this.currentTotalMultiplier > 0) {
                await this.movingMultiplier(mItem.value.node, this.effectContainer, totalMultiplierView.total.node);
                accumulatedMultiplier += +mItem.multiplier;
                totalMultiplierView.setTotalMultiplierTmp(this.currentTotalMultiplier + accumulatedMultiplier);
            } else {
                await this.movingMultiplier(mItem.value.node, this.effectContainer, tumbleWinView.multiplier.node);
            }
        }
        if (this.currentTotalMultiplier > 0) {
            await this.movingMultiplier(totalMultiplierView.total.node, this.effectContainer, tumbleWinView.multiplier.node);
        }

        await AnimationUtils.delayTime(tumbleWinView.mulitiplierEffectDuration);
    }

    movingMultiplier(multiplierNode: Node, container: Node, destNode: Node) {
        return new Promise<void>((resolve) => {
            const node = instantiate(multiplierNode);
            node.active = true;
            const startPos = ComponentUtils.convertPosition(container, multiplierNode);
            const destPos = ComponentUtils.convertPosition(container, destNode);
            container.addChild(node);
            node.position = startPos;
            const duration = 0.6;

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
                .to(duration - 0.3, { position: destPos }, { easing: "sineOut" })
                .delay(0.3)
                .call(() => {
                    resolve();
                    node.destroy();
                })
                .start();
        });
    }
}
