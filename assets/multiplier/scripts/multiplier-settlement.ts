import { _decorator, Component, instantiate, Node, tween, v3 } from "cc";
import { ComponentUtils, FunctionUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
import { CascadingUIHandler } from "../../main-ui";
import { CascadingSlotBoard } from "../../slot-board/components/cascading-slot-board";
import { CascadingTotalMultiplierHandler } from "../../total-multiplier/scripts";
import { CascadingTotalMultiplierStore } from "../../total-multiplier/scripts/cascading-total-multiplier-store";
import { TumbleWinWiew } from "../../tumbles/scripts/components/tumble-win-view";
import { TotalMultiplierView } from "./total-multiplier-view";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class MultiplierSettlement extends Component {
    public data: any;
    public tumbleWinView: TumbleWinWiew;
    public effectContainer: Node;
    public board: CascadingSlotBoard;
    public totalMultiplierView: TotalMultiplierView;
    public currentTotalMultiplier = 0;

    @render(CascadingTotalMultiplierStore, (store) => store.totalMultiplier)
    getTotalMultiplier(totalMultiplier: number) {
        this.currentTotalMultiplier = totalMultiplier;
    }

    async handleMultiplier() {
        const { isFreeSpin, winMultiplier } = this.data;
        const needMoveTotalMultiplier = isFreeSpin && winMultiplier && this.currentTotalMultiplier > 0;

        if (needMoveTotalMultiplier) {
            await this.tumbleWinView.shiftRightTumbleWin(this.currentTotalMultiplier);
            await this.movingMultiplier(this.totalMultiplierView.total.node, this.effectContainer, this.tumbleWinView.multiplier.node);
            this.setTotalMultiplierValue(this.currentTotalMultiplier);
        }

        if (winMultiplier) {
            const multiplierItems = this.board.getMultiplierItems();
            for (const mItem of multiplierItems) {
                //mainGame.playSound(CascadingSlotGameSound.MULTIPLIER_APPEAR);
                await mItem.playAnimationGlow();
                await this.tumbleWinView.shiftRightTumbleWin(mItem.multiplier);
                await this.movingMultiplier(mItem.value.node, this.effectContainer, this.tumbleWinView.multiplier.node);
                //mainGame.playSound(CascadingSlotGameSound.COIN);
                this.setTotalMultiplierValue(this.currentTotalMultiplier);
            }

            await FunctionUtils.delay(this.tumbleWinView.mulitiplierEffectDuration * UNIT_SECOND_SPIN);
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

    @handle(CascadingTotalMultiplierHandler, (handle, multiplier: number) => handle.handleTotalMultiplier(multiplier))
    setTotalMultiplierValue(multiplier: number) {
        return multiplier;
    }
}
