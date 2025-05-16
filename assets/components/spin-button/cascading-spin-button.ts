import { _decorator, Button, Node, sp, Tween, tween, UIOpacity } from "cc";
import { StateChangedEvent } from "db://shared-components/shared/common-components/button/custom-button";
import { ButtonState } from "db://shared-components/shared/common-components/button/status-button";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
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
    nodeCircle: Node = null;

    @property(Node)
    nodeCircleBlur: Node = null;

    @property(Node)
    nodeCircleStop: Node = null;

    private isTurbo = false;
    private button: Button = null;

    private isSpinning = false;
    private circleTween: Tween<Node> = null;
    private circleBlurTween: Tween<Node> = null;
    private circleStopTween: Tween<Node> = null;
    private readonly FADE_CIRCLE_NODES_DURATION = 0.3;

    onLoad() {
        this.button = this.getComponent(Button);
        this.button.node.on(StateChangedEvent, this.onButtonStateChanged, this);
        this.nodeCircle && (this.nodeCircle.getComponent(UIOpacity).opacity = 255);
        this.nodeCircleBlur && (this.nodeCircleBlur.getComponent(UIOpacity).opacity = 0);
        this.nodeCircleStop && (this.nodeCircleStop.getComponent(UIOpacity).opacity = 0);
        super.onLoad();
    }

    onButtonStateChanged(state: ButtonState) {
        if (state === ButtonState.HOVER) {
            this.iconSpinSkeleton.setAnimation(SpineAnimationTrack.HOVER, "hover", true);
        } else {
            this.iconSpinSkeleton.clearAnimation(SpineAnimationTrack.HOVER);
        }
    }

    playAnimationSpin() {
        this.updateCircleVisibility([0, 255, 0]);
        const degreePerSecond = -900;
        this.animateCirclesRotation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.iconSpinSkeleton.timeScale = 1;
    }

    async playAnimationIdle() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.updateCircleVisibility([255, 0, 0]);
        await AnimationUtils.delayTime(this.FADE_CIRCLE_NODES_DURATION);
        const degreePerSecond = -45;
        this.animateCirclesRotation(degreePerSecond);
    }

    stopCircleAnimations() {
        if (this.circleStopTween) {
            this.circleStopTween.stop();
            this.circleStopTween = null;
        }
        if (this.circleBlurTween) {
            this.circleBlurTween.stop();
            this.circleBlurTween = null;
        }
        if (this.circleTween) {
            this.circleTween.stop();
            this.circleTween = null;
        }
    }

    playAnimationSpinTurbo() {
        this.updateCircleVisibility([0, 255, 0]);
        const degreePerSecond = -1080;
        this.animateCirclesRotation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurbo(isTurbo: boolean) {
        this.isTurbo = isTurbo;
        this.changeAnimationSpinning();
    }

    changeAnimationSpinning() {
        if (!this.isSpinning) {
            return;
        }
        if (this.isTurbo) {
            this.playAnimationSpinTurbo();
        } else {
            this.playAnimationSpin();
        }
    }

    @render(CascadingUIStore, (store) => store.spinButtonState)
    renderSpinButtonState(state: string) {
        if (state === SpinButtonState.SPINNING) {
            this.isSpinning = true;
            this.playAnimationSpinExtra();
            this.changeAnimationSpinning();
        } else if (state === SpinButtonState.WIN_TUMBLE_OR_EVENT) {
            this.isSpinning = true;
            this.stopAnimationSpinExtra();
            this.updateCircleVisibility([0, 0, 255]);
            this.stopCircleAnimations();
        } else if (state === SpinButtonState.IDLE) {
            this.isSpinning = false;
            this.stopAnimationSpinExtra();
            this.playAnimationIdle();
        }
    }

    playAnimationSpinExtra() {
        this.iconSpinSkeleton.setAnimation(SpineAnimationTrack.EXTRA, "spin-extra", true);
    }

    stopAnimationSpinExtra() {
        this.iconSpinSkeleton.clearAnimation(SpineAnimationTrack.EXTRA);
    }

    @render(CascadingUIStore, (store) => store.disabledSpinButton)
    renderCascadingState(disabledSpinButton: boolean) {
        //HACK: disable button too fast will cause the button transition scale not working
        setTimeout(() => {
            try {
                this.button.interactable = !disabledSpinButton;
            } catch (error) {}
        }, 100);
    }

    animateCirclesRotation(degreePerSecond: number) {
        this.stopCircleAnimations();
        if (this.nodeCircleStop) {
            this.circleStopTween = tween(this.nodeCircleStop).by(1, { angle: degreePerSecond }).repeatForever().start();
        }

        if (this.nodeCircleBlur) {
            this.circleBlurTween = tween(this.nodeCircleBlur).by(1, { angle: degreePerSecond }).repeatForever().start();
        }

        if (this.nodeCircle) {
            this.circleTween = tween(this.nodeCircle).by(1, { angle: degreePerSecond }).repeatForever().start();
        }
    }

    updateCircleVisibility(opacityValues: number[]) {
        if (this.nodeCircle) {
            tween(this.nodeCircle.getComponent(UIOpacity)).to(this.FADE_CIRCLE_NODES_DURATION, { opacity: opacityValues[0] }).start();
        }

        if (this.nodeCircleBlur) {
            tween(this.nodeCircleBlur.getComponent(UIOpacity)).to(this.FADE_CIRCLE_NODES_DURATION, { opacity: opacityValues[1] }).start();
        }

        if (this.nodeCircleStop) {
            tween(this.nodeCircleStop.getComponent(UIOpacity)).to(this.FADE_CIRCLE_NODES_DURATION, { opacity: opacityValues[2] }).start();
        }
    }
}
