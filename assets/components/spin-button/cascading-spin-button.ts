import { _decorator, Button, CCInteger, Node, sp, tween, Tween } from "cc";
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

    @property(CCInteger)
    degreePerSecond = 360;

    private isTurbo = false;
    private button: Button = null;

    private isSpinning = false;
    private circleTween: Tween<Node> = null;

    onLoad() {
        this.button = this.getComponent(Button);
        this.button.node.on(StateChangedEvent, this.onButtonStateChanged, this);
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
        const degreePerSecond = -480;
        this.rotateAnimation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.iconSpinSkeleton.timeScale = 1;
    }

    playAnimationIdle() {
        const degreePerSecond = -45;
        this.rotateAnimation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "idle", true);
        this.iconSpinSkeleton.timeScale = 1;
    }

    stopCircleAnimation() {
        if (this.circleTween) {
            this.circleTween.stop();
            this.circleTween = null;
        }
    }

    playAnimationSpinTurbo() {
        const degreePerSecond = -620;
        this.rotateAnimation(degreePerSecond);
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.iconSpinSkeleton.timeScale = 2;
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
            this.stopCircleAnimation();
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

    rotateAnimation(degreePerSecond: number) {
        this.stopCircleAnimation(); // Make sure to stop any existing animation before starting a new one
        this.circleTween = tween(this.nodeCircle).by(1, { angle: degreePerSecond }).repeatForever().start();
    }
}
