import gc from "@sg/game-client-base";
import { _decorator, Label, Layout, Node, tween, v3 } from "cc";
import Observer from "observer";
import { TumbleWinWiew } from "./tumble-win-view";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitTumbleWinWiew extends TumbleWinWiew {
    @property(Node)
    totalWinNode: Node = null;

    @property(Label)
    totalWinLabel: Label = null;

    @property({ type: Layout, visible: false, override: true })
    tumbleLayout: Layout = null;

    @property({ type: Label, visible: false, override: true })
    tumbleLabel: Label = null;

    @property({ type: Label, visible: false, override: true })
    totalWin: Label = null;

    setTumbleWinValuewin(totalTumbleWin: number) {
        if (totalTumbleWin === 0) {
            return;
        }
    }

    setIsShowTumbleWinFrame(isShowTumbleWinFrame: boolean) {
        this.totalWinNode.active = false;
        this.node.active = isShowTumbleWinFrame;
    }

    setMultiplier(value: number) {
        //NOSONAR
    }

    animTotalWinNode(totalTumbleWin: number) {
        tween(this.totalWinNode)
            .call(() => {
                this.totalWinNode.scale = v3(0, 0, 0);
                this.totalWinLabel.string = gc.FormatUtils.numberWithCommas(totalTumbleWin, 2, false);
            })
            .to(0.2, { scale: v3(1.2, 1.2, 1.2) }, { easing: "sineOut" })
            .to(0.1, { scale: v3(1, 1, 1) }, { easing: "sineOut" })
            .start();
        
    }

    setTotalWinValue(value: number) {
        return new Promise<void>((resolve) => {
            this.animTotalWinNode(value);
            resolve();
        });
    }

    resetPositionTumbleLabel() {}
    showTotalWin(show: boolean) {}
    shiftRightTumbleWin(value: number) {
        return new Promise<void>((resolve) => {
            resolve();
        });
    }
}
