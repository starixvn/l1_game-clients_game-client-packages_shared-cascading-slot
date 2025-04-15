import { _decorator, Button, Node, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { SpinButtonState } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";

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

    playAnimationSpin() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "spin", true);
        AnimationUtils.updateSpineDuration(this.iconSpinSkeleton, "spin", 1);
    }

    playAnimationIdle() {
        AnimationUtils.playSpine(this.iconSpinSkeleton, "idle", true);
        AnimationUtils.updateSpineDuration(this.iconSpinSkeleton, "idle", 1);
    }

    playAnimationSpinTurbo() {
        AnimationUtils.updateSpineDuration(this.iconSpinSkeleton, "spin", 3);
    }

    @render(CascadingUIStore, (store) => store.spinButtonState)
    renderSpinButtonState(state: string) {
        this.nodeSpinning.active = true;
        const button = this.node.getComponent(Button);
        this.disableButton.active = state !== SpinButtonState.IDLE;
        if (state === SpinButtonState.SPINNING) {
            this.playAnimationSpin();
        } else if (state === SpinButtonState.SPINNING_TURBO) {
            this.playAnimationSpinTurbo();
        } else if (state === SpinButtonState.IDLE) {
            this.nodeSpinning.active = false;
            this.playAnimationIdle();
        }
    }
}
