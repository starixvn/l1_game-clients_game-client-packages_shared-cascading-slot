import { _decorator, Node, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { SpinButtonState } from "../../cascading-slot-utils";
import { CascadingUIStore } from "../../stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingSpinButton extends ObserverComponent {
    @property(sp.Skeleton)
    iconSpinSkeleton: sp.Skeleton = null;

    @property(Node)
    disableButton: Node = null;

    @property(Node)
    nodeSpinning: Node = null;

    private isTurbo = false;

    playAnimationSpin() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.iconSpinSkeleton.timeScale = 1;
    }

    playAnimationIdle() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "idle", true);
        this.iconSpinSkeleton.timeScale = 1;
    }

    playAnimationSpinTurbo() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        this.iconSpinSkeleton.timeScale = 2;
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurbo(isTurbo: boolean) {
        this.isTurbo = isTurbo;
        this.changeAnimationSpinning();
    }

    changeAnimationSpinning() {
        if (!this.nodeSpinning.active) {
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
            this.nodeSpinning.active = true;
            this.changeAnimationSpinning();
        } else if (state === SpinButtonState.IDLE) {
            this.nodeSpinning.active = false;
            this.playAnimationIdle();
        }
    }

    @render(CascadingUIStore, (store) => store.disabledSpinButton)
    renderCascadingState(disabledSpinButton: boolean) {
        this.disableButton.active = disabledSpinButton;
    }
}
