import gc from "@sg/game-client-base";
import { _decorator, Label, Layout, Node, tween, UIOpacity, UITransform, v3 } from "cc";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import { FadeAppearanceNode } from "db://shared-components/shared/common-components/fade-appearance-node";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { cascadingSlotLogger, createFileLogger } from "../../cascading-slot-logger";
import { CascadingSlotTumblesStore } from "../../stores/cascading-slot-tumbles-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

// Create file-specific logger for per-file enable/disable control
const FILE_ID = "tumble-win-view";
const logger = createFileLogger(FILE_ID);

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
        logger.info("[TUMBLE_WIN_VIEW] onLoad called", {
            hasTumbleLabel: !!this.tumbleLabel,
            hasMultiplier: !!this.multiplier,
            hasTumbleLayout: !!this.tumbleLayout,
            hasTotalWin: !!this.totalWin,
            mulitiplierEffectDuration: this.mulitiplierEffectDuration,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        logger.info("[TUMBLE_WIN_VIEW] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        this.onHidden = () => {
            logger.info("[TUMBLE_WIN_VIEW] onHidden callback called", {
                willShowTotalWin: false,
                willResetPosition: true,
                timestamp: new Date().toISOString()
            });
            this.showTotalWin(false);
            this.resetPositionTumbleLabel();
        };

        this.showView(false, true);
        logger.info("[TUMBLE_WIN_VIEW] Initial view hidden", {
            timestamp: new Date().toISOString()
        });

        this.showTotalWin(false);
        logger.info("[TUMBLE_WIN_VIEW] Total win initially hidden", {
            timestamp: new Date().toISOString()
        });

        logger.info("[TUMBLE_WIN_VIEW] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    clearLabels() {
        logger.info("[TUMBLE_WIN_VIEW] clearLabels called", {
            currentTumbleLabel: this.tumbleLabel?.string,
            currentTotalWin: this.totalWin?.string,
            currentMultiplier: this.multiplier?.string,
            willClearAllLabels: true,
            timestamp: new Date().toISOString()
        });

        this.tumbleLabel.string = "";
        this.totalWin.string = "";
        this.multiplier.string = "";

        logger.info("[TUMBLE_WIN_VIEW] All labels cleared", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingSlotTumblesStore, (store) => store.isShowTumbleWinFrame)
    setIsShowTumbleWinFrame(isShowTumbleWinFrame: boolean) {
        logger.info("[TUMBLE_WIN_VIEW] setIsShowTumbleWinFrame called", {
            isShowTumbleWinFrame,
            willShowView: isShowTumbleWinFrame,
            willHideView: !isShowTumbleWinFrame,
            willClearLabels: !isShowTumbleWinFrame,
            timestamp: new Date().toISOString()
        });

        if (isShowTumbleWinFrame) {
            logger.info("[TUMBLE_WIN_VIEW] Showing tumble win frame", {
                timestamp: new Date().toISOString()
            });
            this.showView(true);
        } else {
            logger.info("[TUMBLE_WIN_VIEW] Hiding tumble win frame", {
                timestamp: new Date().toISOString()
            });
            this.showView(false, true).then(() => {
                logger.info("[TUMBLE_WIN_VIEW] View hidden, clearing labels", {
                    timestamp: new Date().toISOString()
                });
                this.clearLabels();
            });
        }

        logger.info("[TUMBLE_WIN_VIEW] setIsShowTumbleWinFrame completed", {
            isShowTumbleWinFrame,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.totalWin, { fireImmediately: false })
    setTumbleWinValuewin(totalTumbleWin: number) {
        logger.info("[TUMBLE_WIN_VIEW] setTumbleWinValuewin called", {
            totalTumbleWin,
            hasTumbleLabel: !!this.tumbleLabel,
            currentTumbleLabelString: this.tumbleLabel?.string,
            willClearLabel: totalTumbleWin === 0,
            willAnimateNumber: totalTumbleWin !== 0,
            timestamp: new Date().toISOString()
        });

        if (totalTumbleWin === 0) {
            logger.info("[TUMBLE_WIN_VIEW] Total tumble win is 0, clearing label", {
                timestamp: new Date().toISOString()
            });
            this.tumbleLabel.string = "";
            return;
        }

        logger.info("[TUMBLE_WIN_VIEW] Animating number to label", {
            amount: totalTumbleWin,
            duration: 0.5,
            noZeroSuffix: false,
            timestamp: new Date().toISOString()
        });
        AnimationUtils.floatToNumber({ label: this.tumbleLabel, amount: totalTumbleWin, duration: 0.5, noZeroSuffix: false });

        logger.info("[TUMBLE_WIN_VIEW] setTumbleWinValuewin completed", {
            totalTumbleWin,
            timestamp: new Date().toISOString()
        });
    }

    setTotalWinValue(value: number) {
        logger.info("[TUMBLE_WIN_VIEW] setTotalWinValue called", {
            value,
            hasTotalWin: !!this.totalWin,
            currentTotalWinString: this.totalWin?.string,
            willFormatNumber: true,
            willShowTotalWin: true,
            willAnimateScale: true,
            timestamp: new Date().toISOString()
        });

        return new Promise<void>((resolve) => {
            logger.info("[TUMBLE_WIN_VIEW] Setting total win string", {
                formattedValue: gc.FormatUtils.numberWithCommas(value, 2, false),
                timestamp: new Date().toISOString()
            });
            this.totalWin.string = gc.FormatUtils.numberWithCommas(value, 2, false);

            logger.info("[TUMBLE_WIN_VIEW] Showing total win", {
                timestamp: new Date().toISOString()
            });
            this.showTotalWin(true);

            logger.info("[TUMBLE_WIN_VIEW] Starting scale animation", {
                animationDuration: 0.4,
                timestamp: new Date().toISOString()
            });
            tween(this.totalWin.node)
                .to(0.1, { scale: v3(1.5, 1.5, 1) }, { easing: "sineOut" })
                .to(0.3, { scale: v3(1, 1, 1) }, { easing: "sineIn" })
                .call(() => {
                    logger.info("[TUMBLE_WIN_VIEW] Scale animation completed, resolving promise", {
                        timestamp: new Date().toISOString()
                    });
                    resolve();
                })
                .start();

            logger.info("[TUMBLE_WIN_VIEW] setTotalWinValue animation started", {
                value,
                timestamp: new Date().toISOString()
            });
        });
    }

    showTotalWin(show: boolean) {
        logger.info("[TUMBLE_WIN_VIEW] showTotalWin called", {
            show,
            hasTotalWin: !!this.totalWin,
            hasTumbleLayout: !!this.tumbleLayout,
            willShowTotalWinNode: show,
            willShowTumbleLayoutNode: !show,
            timestamp: new Date().toISOString()
        });

        if (show) {
            logger.info("[TUMBLE_WIN_VIEW] Showing total win node, hiding tumble layout", {
                timestamp: new Date().toISOString()
            });
            this.showNodeAndHideOther(this.totalWin.node, this.tumbleLayout.node);
        } else {
            logger.info("[TUMBLE_WIN_VIEW] Showing tumble layout, hiding total win node", {
                timestamp: new Date().toISOString()
            });
            this.showNodeAndHideOther(this.tumbleLayout.node, this.totalWin.node);
        }

        logger.info("[TUMBLE_WIN_VIEW] showTotalWin completed", {
            show,
            timestamp: new Date().toISOString()
        });
    }

    resetPositionTumbleLabel() {
        logger.info("[TUMBLE_WIN_VIEW] resetPositionTumbleLabel called", {
            hasMultiplier: !!this.multiplier,
            hasTumbleLabel: !!this.tumbleLabel,
            hasTumbleLayout: !!this.tumbleLayout,
            currentMultiplierActive: this.multiplier?.node?.active,
            currentTumbleLabelPosition: this.tumbleLabel?.node?.position,
            currentTumbleLayoutEnabled: this.tumbleLayout?.enabled,
            willDeactivateMultiplier: true,
            willResetTumbleLabelPosition: true,
            willDisableTumbleLayout: true,
            timestamp: new Date().toISOString()
        });

        this.multiplier.node.active = false;
        logger.info("[TUMBLE_WIN_VIEW] Multiplier node deactivated", {
            timestamp: new Date().toISOString()
        });

        this.tumbleLabel.node.position = v3(0, this.tumbleLabel.node.position.y, 0);
        logger.info("[TUMBLE_WIN_VIEW] Tumble label position reset", {
            newPosition: this.tumbleLabel.node.position,
            timestamp: new Date().toISOString()
        });

        this.tumbleLayout.enabled = false;
        logger.info("[TUMBLE_WIN_VIEW] Tumble layout disabled", {
            timestamp: new Date().toISOString()
        });

        logger.info("[TUMBLE_WIN_VIEW] resetPositionTumbleLabel completed", {
            timestamp: new Date().toISOString()
        });
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

    @render(CascadingUIStore, (store) => store.multiplier, { fireImmediately: false })
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
