import { _decorator, Animation, Component, Label, sp } from "cc";
import { AnimationUtils, FunctionUtils } from "db://shared-components/shared/utils";
import { UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
import { resourcesCache } from "../../cascading-slot-utils";
const { ccclass, property } = _decorator;

@ccclass
export class MultiplierItem extends Component {
    @property(Label)
    value: Label = null;

    @property(Animation)
    animation: Animation = null;

    private _multiplierValue = 1;

    gameId: number;
    private spine: sp.Skeleton;

    get multiplier() {
        return this._multiplierValue;
    }

    onLoad() {
        this.spine = this.node.getComponent(sp.Skeleton);
    }

    async playAnimationGlow() {
        try {
            const anim = "highlight";
            this.spine.setAnimation(0, anim, true);
            const duration = this.spine.findAnimation(anim)?.duration || 0;
            AnimationUtils.updateSpineDuration(this.spine, anim, duration);
            if (duration > 0) {
                await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
            }
            this.hideMultiplier();
        } catch (e) {
            console.warn("Catch error after await method", e.message);
        }
    }

    setValue(value: number) {
        this._multiplierValue = value;
        this.value.string = `x${value}`;
        this.updateColor(value);
    }

    protected hideMultiplier() {
        this.value.node.active = false;
        this.spine.setAnimation(0, "idle", true);
    }

    protected updateColor(value: number) {
        const level = [10, 11, 12, 13];
        let i = 0;
        const range = [5, 10, 15];
        for (; i < range.length; i++) {
            if (value <= range[i]) {
                break;
            }
        }
        const anim = "idle";
        this.spine.skeletonData = resourcesCache.slotSymbols[level[i]];
        this.spine.setAnimation(0, anim, true);
    }
}
