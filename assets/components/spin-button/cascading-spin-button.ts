import { _decorator, Button, Node, sp, Tween, tween, UIOpacity } from "cc";
import { StateChangedEvent } from "db://shared-components/shared/common-components/button/custom-button";
import { ButtonState } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { cascadingSlotLogger } from "../../cascading-slot-logger";
import { SpinButtonState } from "../../cascading-slot-utils";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

enum SpineAnimationTrack {
    MAIN = 0,
    HOVER = 1,
    EXTRA = 2,
}

@ccclass
export class CascadingSpinButton extends ObserverComponent {
    @property(sp.Skeleton)
    iconSpinSkeleton: sp.Skeleton = null;

    @property(Node)
    nodeCircleNormal: Node = null;

    @property(Node)
    nodeCircleBlur: Node = null;

    @property(Node)
    nodeCircle: Node = null;

    private isTurbo = false;
    private button: Button = null;

    private isSpinning = false;
    private circleTween: Tween<Node> = null;
    private readonly FADE_CIRCLE_NODES_DURATION = 0.2;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] onLoad called", {
            nodeName: this.node.name,
            hasButtonComponent: !!this.button,
            hasIconSpinSkeleton: !!this.iconSpinSkeleton,
            hasNodeCircleNormal: !!this.nodeCircleNormal,
            hasNodeCircleBlur: !!this.nodeCircleBlur,
            hasNodeCircle: !!this.nodeCircle,
            timestamp: new Date().toISOString()
        });

        this.button = this.getComponent(Button);
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Button component retrieved", {
            hasButton: !!this.button,
            buttonInteractable: this.button?.interactable,
            timestamp: new Date().toISOString()
        });

        this.button.node.on(StateChangedEvent, this.onButtonStateChanged, this);
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Button state change event listener added", {
            eventListenerAdded: true,
            timestamp: new Date().toISOString()
        });

        if (this.nodeCircleNormal) {
            this.nodeCircleNormal.getComponent(UIOpacity).opacity = 255;
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Normal circle opacity set to 255", {
                opacitySet: true,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Normal circle node not available", {
                timestamp: new Date().toISOString()
            });
        }

        if (this.nodeCircleBlur) {
            this.nodeCircleBlur.getComponent(UIOpacity).opacity = 0;
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Blur circle opacity set to 0", {
                opacitySet: true,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Blur circle node not available", {
                timestamp: new Date().toISOString()
            });
        }

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] onLoad completed", {
            superOnLoadCalled: true,
            timestamp: new Date().toISOString()
        });
    }

    onButtonStateChanged(state: ButtonState) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] onButtonStateChanged called", {
            state,
            isHover: state === ButtonState.HOVER,
            hasIconSpinSkeleton: !!this.iconSpinSkeleton,
            timestamp: new Date().toISOString()
        });

        if (state === ButtonState.HOVER) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Setting hover animation", {
                animationName: "hover",
                loop: true,
                timestamp: new Date().toISOString()
            });
            this.iconSpinSkeleton.setAnimation(SpineAnimationTrack.HOVER, "hover", true);
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Clearing hover animation", {
                timestamp: new Date().toISOString()
            });
            this.iconSpinSkeleton.clearAnimation(SpineAnimationTrack.HOVER);
        }

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] onButtonStateChanged completed", {
            state,
            timestamp: new Date().toISOString()
        });
    }

    playAnimationSpin() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpin called", {
            willShowBlurCircle: true,
            degreePerSecond: -900,
            animationName: "spin",
            timestamp: new Date().toISOString()
        });

        this.showBlurCircle();
        const degreePerSecond = -900;
        this.animateCirclesRotation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpin completed", {
            blurCircleShown: true,
            rotationAnimated: true,
            spineAnimationPlayed: true,
            timestamp: new Date().toISOString()
        });
    }

    async playAnimationIdle() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationIdle called", {
            willShowNormalCircle: true,
            degreePerSecond: -45,
            animationName: "idle",
            timestamp: new Date().toISOString()
        });

        AnimationUtils.playSpine(this.iconSpinSkeleton, "idle", true);
        this.showNormalCircle();
        const degreePerSecond = -45;
        this.animateCirclesRotation(degreePerSecond);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationIdle completed", {
            spineAnimationPlayed: true,
            normalCircleShown: true,
            rotationAnimated: true,
            timestamp: new Date().toISOString()
        });
    }

    stopCircleAnimations() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] stopCircleAnimations called", {
            hasCircleTween: !!this.circleTween,
            timestamp: new Date().toISOString()
        });

        if (this.circleTween) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Stopping existing circle tween", {
                tweenExists: true,
                timestamp: new Date().toISOString()
            });
            this.circleTween.stop();
            this.circleTween = null;
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Circle tween stopped and cleared", {
                tweenStopped: true,
                tweenCleared: true,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] No circle tween to stop", {
                tweenExists: false,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] stopCircleAnimations completed", {
            timestamp: new Date().toISOString()
        });
    }

    playAnimationSpinTurbo() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpinTurbo called", {
            willShowBlurCircle: true,
            degreePerSecond: -1080,
            animationName: "spin",
            timestamp: new Date().toISOString()
        });

        this.showBlurCircle();
        const degreePerSecond = -1080;
        this.animateCirclesRotation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpinTurbo completed", {
            blurCircleShown: true,
            rotationAnimated: true,
            spineAnimationPlayed: true,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurbo(isTurbo: boolean) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderTurbo called", {
            isTurbo,
            previousIsTurbo: this.isTurbo,
            willChangeAnimation: true,
            timestamp: new Date().toISOString()
        });

        this.isTurbo = isTurbo;
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Turbo mode updated", {
            isTurbo: this.isTurbo,
            timestamp: new Date().toISOString()
        });

        this.changeAnimationSpinning();
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Animation change triggered", {
            changeAnimationCalled: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderTurbo completed", {
            finalIsTurbo: this.isTurbo,
            timestamp: new Date().toISOString()
        });
    }

    changeAnimationSpinning() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] changeAnimationSpinning called", {
            isSpinning: this.isSpinning,
            isTurbo: this.isTurbo,
            willChangeAnimation: this.isSpinning,
            timestamp: new Date().toISOString()
        });

        if (!this.isSpinning) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Not spinning, skipping animation change", {
                isSpinning: false,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (this.isTurbo) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Playing turbo spin animation", {
                isTurbo: true,
                timestamp: new Date().toISOString()
            });
            this.playAnimationSpinTurbo();
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Playing normal spin animation", {
                isTurbo: false,
                timestamp: new Date().toISOString()
            });
            this.playAnimationSpin();
        }

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] changeAnimationSpinning completed", {
            animationChanged: true,
            finalAnimation: this.isTurbo ? "turbo" : "normal",
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.spinButtonState)
    renderSpinButtonState(state: string) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderSpinButtonState called", {
            state,
            previousIsSpinning: this.isSpinning,
            timestamp: new Date().toISOString()
        });

        if (state === SpinButtonState.SPINNING) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] State is SPINNING - starting spin animation", {
                state,
                willSetIsSpinning: true,
                timestamp: new Date().toISOString()
            });

            this.isSpinning = true;
            this.playAnimationSpinExtra();
            this.changeAnimationSpinning();

            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Spin animation started", {
                isSpinning: true,
                extraAnimationPlayed: true,
                animationChanged: true,
                timestamp: new Date().toISOString()
            });

        } else if (state === SpinButtonState.WIN_TUMBLE_OR_EVENT) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] State is WIN_TUMBLE_OR_EVENT - stopping animations", {
                state,
                willSetIsSpinning: false,
                timestamp: new Date().toISOString()
            });

            this.isSpinning = false;
            this.stopAnimationSpinExtra();
            this.showNormalCircle();
            this.stopCircleAnimations();

            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Animations stopped for win/tumble/event", {
                isSpinning: false,
                extraAnimationStopped: true,
                normalCircleShown: true,
                circleAnimationsStopped: true,
                timestamp: new Date().toISOString()
            });

        } else if (state === SpinButtonState.IDLE) {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] State is IDLE - playing idle animation", {
                state,
                willSetIsSpinning: false,
                timestamp: new Date().toISOString()
            });

            this.isSpinning = false;
            this.stopAnimationSpinExtra();
            this.playAnimationIdle();

            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Idle animation started", {
                isSpinning: false,
                extraAnimationStopped: true,
                idleAnimationPlayed: true,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Unknown state, no action taken", {
                state,
                knownStates: [SpinButtonState.SPINNING, SpinButtonState.WIN_TUMBLE_OR_EVENT, SpinButtonState.IDLE],
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderSpinButtonState completed", {
            state,
            finalIsSpinning: this.isSpinning,
            timestamp: new Date().toISOString()
        });
    }

    playAnimationSpinExtra() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpinExtra called", {
            hasIconSpinSkeleton: !!this.iconSpinSkeleton,
            animationName: "spin-extra",
            track: SpineAnimationTrack.EXTRA,
            timestamp: new Date().toISOString()
        });

        this.iconSpinSkeleton.setAnimation(SpineAnimationTrack.EXTRA, "spin-extra", true);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] playAnimationSpinExtra completed", {
            animationSet: true,
            timestamp: new Date().toISOString()
        });
    }

    stopAnimationSpinExtra() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] stopAnimationSpinExtra called", {
            hasIconSpinSkeleton: !!this.iconSpinSkeleton,
            track: SpineAnimationTrack.EXTRA,
            timestamp: new Date().toISOString()
        });

        this.iconSpinSkeleton.clearAnimation(SpineAnimationTrack.EXTRA);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] stopAnimationSpinExtra completed", {
            animationCleared: true,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.disabledSpinButton)
    renderCascadingState(disabledSpinButton: boolean) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderCascadingState called", {
            disabledSpinButton,
            hasButton: !!this.button,
            currentInteractable: this.button?.interactable,
            willSetTimeout: true,
            timeoutMs: 100,
            timestamp: new Date().toISOString()
        });

        //HACK: disable button too fast will cause the button transition scale not working
        setTimeout(() => {
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Timeout triggered - setting button interactable", {
                disabledSpinButton,
                newInteractable: !disabledSpinButton,
                timestamp: new Date().toISOString()
            });

            try {
                this.button.interactable = !disabledSpinButton;
                cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Button interactable set successfully", {
                    interactable: this.button.interactable,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                cascadingSlotLogger.error("[CASCADING_SPIN_BUTTON] Error setting button interactable:", error);
                cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Button interactable setting failed", {
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        }, 100);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] renderCascadingState completed", {
            timeoutSet: true,
            timestamp: new Date().toISOString()
        });
    }

    animateCirclesRotation(degreePerSecond: number) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] animateCirclesRotation called", {
            degreePerSecond,
            hasNodeCircle: !!this.nodeCircle,
            willStopExistingAnimations: true,
            timestamp: new Date().toISOString()
        });

        this.stopCircleAnimations();
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Existing animations stopped", {
            timestamp: new Date().toISOString()
        });

        this.circleTween = this.animateCircleNode(this.nodeCircle, degreePerSecond);
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] New circle tween created", {
            tweenCreated: !!this.circleTween,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] animateCirclesRotation completed", {
            degreePerSecond,
            tweenActive: !!this.circleTween,
            timestamp: new Date().toISOString()
        });
    }

    showBlurCircle() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] showBlurCircle called", {
            hasNodeCircleNormal: !!this.nodeCircleNormal,
            hasNodeCircleBlur: !!this.nodeCircleBlur,
            duration: this.FADE_CIRCLE_NODES_DURATION,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.fadeOut(this.nodeCircleNormal, this.FADE_CIRCLE_NODES_DURATION);
        AnimationUtils.fadeIn(this.nodeCircleBlur, this.FADE_CIRCLE_NODES_DURATION);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] showBlurCircle completed", {
            fadeOutStarted: true,
            fadeInStarted: true,
            timestamp: new Date().toISOString()
        });
    }

    showNormalCircle() {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] showNormalCircle called", {
            hasNodeCircleNormal: !!this.nodeCircleNormal,
            hasNodeCircleBlur: !!this.nodeCircleBlur,
            duration: this.FADE_CIRCLE_NODES_DURATION,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.fadeIn(this.nodeCircleNormal, this.FADE_CIRCLE_NODES_DURATION);
        AnimationUtils.fadeOut(this.nodeCircleBlur, this.FADE_CIRCLE_NODES_DURATION);

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] showNormalCircle completed", {
            fadeInStarted: true,
            fadeOutStarted: true,
            timestamp: new Date().toISOString()
        });
    }

    animateCircleNode(node: Node, degreePerSecond: number) {
        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] animateCircleNode called", {
            hasNode: !!node,
            degreePerSecond,
            willRepeatForever: true,
            timestamp: new Date().toISOString()
        });

        if (node) {
            const circleTween = tween(node).by(1, { angle: degreePerSecond }).repeatForever().start();
            cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] Circle rotation tween created and started", {
                tweenCreated: true,
                tweenStarted: true,
                timestamp: new Date().toISOString()
            });
            return circleTween;
        }

        cascadingSlotLogger.info("[CASCADING_SPIN_BUTTON] No node provided, returning null", {
            hasNode: false,
            timestamp: new Date().toISOString()
        });
        return null;
    }
}


