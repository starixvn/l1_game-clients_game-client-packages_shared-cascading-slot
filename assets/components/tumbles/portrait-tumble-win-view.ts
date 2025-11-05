import gc from "@sg/game-client-base";
import { _decorator, Label, Layout, Node, tween, v3 } from "cc";
import Observer from "observer";
import { TumbleWinWiew } from "./tumble-win-view";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitTumbleWinWiew extends TumbleWinWiew {
    @property(Node)
    totalWinNode: Node = null;

    @property(Label)
    totalWinLabel: Label = null;

    @property({ type: Layout, visible: false })
    tumbleLayout: Layout = null;

    @property({ type: Label, visible: false })
    tumbleLabel: Label = null;

    @property({ type: Label, visible: false })
    totalWin: Label = null;

    setTumbleWinValuewin(totalTumbleWin: number) {
        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] setTumbleWinValuewin called with totalTumbleWin: ${totalTumbleWin}`);
        if (totalTumbleWin === 0) {
            cascadingSlotLogger.info(`[PortraitTumbleWinWiew] Total tumble win is 0, returning early`);
            return;
        }

        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] Animating total win node`);
        this.animTotalWinNode(totalTumbleWin);
    }

    setIsShowTumbleWinFrame(isShowTumbleWinFrame: boolean) {
        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] setIsShowTumbleWinFrame called with isShowTumbleWinFrame: ${isShowTumbleWinFrame}`);
        this.node.active = isShowTumbleWinFrame;
    }

    setMultiplier(value: number) {
        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] setMultiplier called with value: ${value}`);
        //NOSONAR
    }

    animTotalWinNode(totalTumbleWin: number) {
        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] animTotalWinNode called with totalTumbleWin: ${totalTumbleWin}`);
        tween(this.totalWinNode)
            .call(() => {
                cascadingSlotLogger.info(`[PortraitTumbleWinWiew] Starting animation sequence - hiding and scaling node`);
                this.totalWinNode.active = false;
                this.totalWinNode.scale = v3(0, 0, 0);
                this.totalWinLabel.string = gc.FormatUtils.numberWithCommas(totalTumbleWin, 2, false);
                this.totalWinNode.active = true;
                cascadingSlotLogger.info(`[PortraitTumbleWinWiew] Set label to: ${this.totalWinLabel.string} and activated node`);
            })
            .to(0.2, { scale: v3(1.2, 1.2, 1.2) }, { easing: "sineOut" })
            .to(0.1, { scale: v3(1, 1, 1) }, { easing: "sineOut" })
            .start();
    }

    setTotalWinValue(value: number) {
        cascadingSlotLogger.info(`[PortraitTumbleWinWiew] setTotalWinValue called with value: ${value}`);
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



