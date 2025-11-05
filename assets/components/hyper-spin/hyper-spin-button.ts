import gc from "@sg/game-client-base";
import { _decorator, Button, Node, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { cascadingSlotLogger } from "../../cascading-slot-logger";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { DialogName } from "../../cascading-slot-utils";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class HyperSpinButton extends ObserverComponent {
    @property(Sprite)
    sprIconAutoPlay: Sprite = null;

    @property(Sprite)
    sprIconPause: Sprite = null;

    @property(Node)
    nodeDisabled: Node = null;

    onLoad() {
        super.onLoad();
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onLoad() - Component initialized", {
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            componentName: this.constructor.name,
            timestamp: new Date().toISOString()
        });

        // Test if method is accessible
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onLoad() - Testing method accessibility", {
            hasOnClickHyperSpin: typeof this.onClickHyperSpin === "function",
            methodName: "onClickHyperSpin",
            timestamp: new Date().toISOString()
        });

        // Get Button component and verify click event configuration
        const button = this.node.getComponent(Button);
        if (button) {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onLoad() - Button component found", {
                interactable: button.interactable,
                enabled: button.enabled,
                clickEventsCount: button.clickEvents.length,
                clickEvents: button.clickEvents.map((event: any) => ({
                    handler: event.handler,
                    componentId: event._componentId,
                    target: event.target?.name
                })),
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.warn("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onLoad() - Button component NOT found on node");
        }
    }

    // This method is called directly by Button component click event
    // It must be accessible without decorator interference
    onClickHyperSpin() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] ========== HyperSpinButton.onClickHyperSpin() - METHOD CALLED BY BUTTON ==========", {
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            componentName: this.constructor.name,
            timestamp: new Date().toISOString()
        });

        try {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickHyperSpin() - Playing sound");
            this.playSoundClick();

            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickHyperSpin() - Triggering hyper spin handler");
            this.triggerHyperSpinHandler();
        } catch (error) {
            cascadingSlotLogger.error("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickHyperSpin() - ERROR:", error);
        }
    }

    // This method is called by Observer pattern via @handle decorator
    // It calls HyperSpinHandler.clickHyperSpin() which handles both dialog and bet control
    @handle(HyperSpinHandler, (handle) => handle.clickHyperSpin())
    triggerHyperSpinHandler() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.triggerHyperSpinHandler() - Triggering hyper spin handler via Observer", {
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handle) => handle.triggerOpenDialog(DialogName.AUTO_SPIN))
    onClickAutoPlay() {
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickAutoPlay() - Auto play button clicked", {
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            componentName: this.constructor.name,
            timestamp: new Date().toISOString()
        });

        // Check if this is the hyper button in auto-play context
        const isHyperInAutoContext = this.node.name === "portrait-hyper-spin-button" && this.node.parent?.name === "auto-spin-container";
        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickAutoPlay() - Hyper spin in auto context check", {
            isHyperInAutoContext: isHyperInAutoContext,
            nodeName: this.node.name,
            expectedNodeName: "portrait-hyper-spin-button",
            parentName: this.node.parent?.name,
            expectedParentName: "auto-spin-container"
        });

        if (isHyperInAutoContext) {
            cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickAutoPlay() - Detected hyper spin button in auto-play context, calling hyper spin");
            this.onClickHyperSpin();
            return;
        }

        cascadingSlotLogger.info("[HYPER_SPIN_WORKFLOW] HyperSpinButton.onClickAutoPlay() - Playing sound for regular auto play");
        this.playSoundClick();
    }

    @render(AutoPlayStore, (store) => store.isTurnOnAutoPlay)
    updateAutoPlayButton(isTurnOnAutoPlay: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] updateAutoPlayButton called", {
            isTurnOnAutoPlay,
            hasSprIconAutoPlay: !!this.sprIconAutoPlay,
            hasSprIconPause: !!this.sprIconPause,
            hasAutoPlayNode: !!this.sprIconAutoPlay?.node,
            hasPauseNode: !!this.sprIconPause?.node,
            nodeName: this.node.name,
            parentName: this.node.parent?.name,
            timestamp: new Date().toISOString()
        });

        if (this.sprIconAutoPlay && this.sprIconPause) {
            const newAutoPlayActive = !isTurnOnAutoPlay;
            const newPauseActive = isTurnOnAutoPlay;

            cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Updating sprite visibility", {
                isTurnOnAutoPlay,
                newAutoPlayActive,
                newPauseActive,
                timestamp: new Date().toISOString()
            });

            this.sprIconAutoPlay.node.active = newAutoPlayActive;
            this.sprIconPause.node.active = newPauseActive;

            cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Sprite visibility updated", {
                autoPlaySpriteActive: this.sprIconAutoPlay.node.active,
                pauseSpriteActive: this.sprIconPause.node.active,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Skipping sprite update - sprites not available", {
                hasSprIconAutoPlay: !!this.sprIconAutoPlay,
                hasSprIconPause: !!this.sprIconPause,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] updateAutoPlayButton completed", {
            isTurnOnAutoPlay,
            finalAutoPlayActive: this.sprIconAutoPlay?.node?.active,
            finalPauseActive: this.sprIconPause?.node?.active,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }

    @render(CascadingUIStore, (store) => store.disabledAutoPlay)
    disabledAutoPlay(disabledAutoPlay: boolean) {
        const nodeName = this.node.name;
        const parentName = this.node.parent?.name;
        const isAutoSpinButtonInHyperContainer = nodeName === "portrait-auto-spin-button" && parentName === "hyper-spin-container";
        const shouldApplyDisabled = !isAutoSpinButtonInHyperContainer;

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] disabledAutoPlay called", {
            disabledAutoPlay,
            nodeName,
            parentName,
            isAutoSpinButtonInHyperContainer,
            shouldApplyDisabled,
            hasNodeDisabled: !!this.nodeDisabled,
            timestamp: new Date().toISOString()
        });

        if (shouldApplyDisabled) {
            if (this.nodeDisabled) {
                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Applying disabled state to node", {
                    disabledAutoPlay,
                    previousActive: this.nodeDisabled.active,
                    timestamp: new Date().toISOString()
                });

                this.nodeDisabled.active = disabledAutoPlay;

                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Disabled state applied", {
                    disabledAutoPlay,
                    newActive: this.nodeDisabled.active,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Skipping disabled state - nodeDisabled not available", {
                    disabledAutoPlay,
                    hasNodeDisabled: false,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Skipping disabled state - condition not met", {
                disabledAutoPlay,
                isAutoSpinButtonInHyperContainer,
                shouldApplyDisabled: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] disabledAutoPlay completed", {
            disabledAutoPlay,
            actionTaken: shouldApplyDisabled ? (this.nodeDisabled ? "applied" : "skipped-no-node") : "skipped-condition",
            finalActive: this.nodeDisabled?.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.disabledHyperSpin)
    disabledHyperSpin(disabledHyperSpin: boolean) {
        const nodeName = this.node.name;
        const parentName = this.node.parent?.name;
        const isAutoSpinButtonInHyperContainer = nodeName === "portrait-auto-spin-button" && parentName === "hyper-spin-container";
        const shouldApplyDisabled = isAutoSpinButtonInHyperContainer;

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] disabledHyperSpin called", {
            disabledHyperSpin,
            nodeName,
            parentName,
            isAutoSpinButtonInHyperContainer,
            shouldApplyDisabled,
            hasNodeDisabled: !!this.nodeDisabled,
            timestamp: new Date().toISOString()
        });

        if (shouldApplyDisabled) {
            if (this.nodeDisabled) {
                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Applying hyper spin disabled state to node", {
                    disabledHyperSpin,
                    previousActive: this.nodeDisabled.active,
                    timestamp: new Date().toISOString()
                });

                this.nodeDisabled.active = disabledHyperSpin;

                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Hyper spin disabled state applied", {
                    disabledHyperSpin,
                    newActive: this.nodeDisabled.active,
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Skipping hyper spin disabled state - nodeDisabled not available", {
                    disabledHyperSpin,
                    hasNodeDisabled: false,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] Skipping hyper spin disabled state - condition not met", {
                disabledHyperSpin,
                isAutoSpinButtonInHyperContainer,
                shouldApplyDisabled: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[HYPER_SPIN_BUTTON] disabledHyperSpin completed", {
            disabledHyperSpin,
            actionTaken: shouldApplyDisabled ? (this.nodeDisabled ? "applied" : "skipped-no-node") : "skipped-condition",
            finalActive: this.nodeDisabled?.active,
            timestamp: new Date().toISOString()
        });
    }
}


