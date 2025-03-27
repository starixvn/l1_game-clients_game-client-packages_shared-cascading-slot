import gc from "@sg/game-client-base";
import { _decorator, Label, Layout, Node, tween, UIOpacity, UITransform, v3 } from "cc";
import { CascadingUIStore } from "db://shared-cascading-slot/main-ui/cascading-ui-store";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingSlotTumblesStore } from "../cascading-slot-tumbles-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class TumbleWinWiew extends FadeAppearanceNode {
    @property(Label)
    tumbleLabel: Label = null;

    @property(Label)
    multiplier: Label = null;

    @property(Layout)
    tumbleLayout: Layout = null;

    @property(Label)
    totalWin: Label = null;

    readonly mulitiplierEffectDuration = 0.2;

    onLoad() {
        super.onLoad();
        this.onHidden = () => {
            this.showTotalWin(false);
            this.resetPositionTumbleLabel();
        };
        this.showView(false, true);
        this.showTotalWin(false);
    }

    clearLabels() {
        this.tumbleLabel.string = "";
        this.totalWin.string = "";
        this.multiplier.string = "";
    }

    @render(CascadingSlotTumblesStore, (store) => store.isShowTumbleWinFrame)
    setIsShowTumbleWinFrame(isShowTumbleWinFrame: boolean) {
        if (isShowTumbleWinFrame) {
            this.showView(true);
        } else {
            this.showView(false, true).then(() => {
                this.clearLabels();
            });
        }
    }

    @render(CascadingUIStore, (store) => store.totalTumbleWin, { fireImmediately: false })
    setTumbleWinValuewin(totalTumbleWin: any) {
        // if (totalTumbleWin.animated) {
        //     ComponentUtils.floatToNumber({ label: this.tumbleLabel, amount: totalTumbleWin.totalWin, duration: 0.5, noZeroSuffix: false });
        // } else {
        //     this.tumbleLabel.string = gc.FormatUtils.numberWithCommas(totalTumbleWin.totalWin, 2, false);
        // }

        ComponentUtils.floatToNumber({ label: this.tumbleLabel, amount: totalTumbleWin, duration: 0.5, noZeroSuffix: false });
    }

    setTotalWinValue(value: number) {
        return new Promise<void>((resolve) => {
            this.totalWin.string = gc.FormatUtils.numberWithCommas(value, 2, false);
            this.showTotalWin(true);

            tween(this.totalWin.node)
                .to(0.1, { scale: v3(1.5, 1.5, 1) }, { easing: "sineOut" })
                .to(0.3, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
                .call(() => resolve())
                .start();
        });
    }

    showTotalWin(show: boolean) {
        if (show) {
            this.showNodeAndHideOther(this.totalWin.node, this.tumbleLayout.node);
        } else {
            this.showNodeAndHideOther(this.tumbleLayout.node, this.totalWin.node);
        }
    }

    resetPositionTumbleLabel() {
        this.multiplier.node.active = false;
        this.tumbleLabel.node.position = v3(0, this.tumbleLabel.node.position.y, 0);
        this.tumbleLayout.enabled = false;
    }

    private showNodeAndHideOther(node: Node, otherNode: Node) {
        const opacityNode = node.getComponent(UIOpacity);
        opacityNode.opacity = 0;
        const duration = 0.2;
        tween(opacityNode).to(duration, { opacity: 255 }).start();
        tween(otherNode.getComponent(UIOpacity)).to(duration, { opacity: 0 }).start();
    }

    shiftRightTumbleWin(value: number) {
        return new Promise<void>((resolve) => {
            if (this.tumbleLayout.enabled) {
                resolve();
                return;
            }
            this.multiplier.string = `x${value}`;
            this.multiplier.node.active = true;
            this.multiplier.node.getComponent(UIOpacity).opacity = 0;
            const width = this.multiplier.node.getComponent(UITransform).width;
            tween(this.tumbleLabel.node)
                .to(0.1, { position: v3(-width / 2, this.tumbleLabel.node.position.y, 0) })
                .call(() => {
                    resolve();
                })
                .start();
        });
    }

    setMultiplier(value: number) {
        this.multiplier.string = `x${value}`;
        this.multiplier.node.getComponent(UIOpacity).opacity = 255;
        this.tumbleLayout.enabled = true;
        tween(this.multiplier.node)
            .to(0.5 * this.mulitiplierEffectDuration, { scale: v3(1.2, 1.2, 1) }, { easing: "sineOut" })
            .to(0.5 * this.mulitiplierEffectDuration, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
            .start();
    }
}
