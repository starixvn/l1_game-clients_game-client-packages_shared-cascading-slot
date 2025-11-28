import { _decorator, Animation, Component, Label, sp } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { getConfigGameSpeed, resourcesCache, SpecialSymbol } from "../../cascading-slot-utils";
const { ccclass, property } = _decorator;

@ccclass
export class MultiplierItem extends Component {
    @property(Label)
    value: Label = null;

    @property(Animation)
    animation: Animation = null;

    private _multiplierValue = 1;

    gameId: number;
    multiplierRange = 0;
    private spine: sp.Skeleton;

    get multiplier() {
        return this._multiplierValue;
    }

    onLoad() {
        this.spine = this.node.getComponent(sp.Skeleton);
    }

    async playAnimationGlow(gameSpeed: string) {
        try {
            const anim = "highlight";
            const ratioSpeed = getConfigGameSpeed("ratioMatchAndExplosionSymbol", gameSpeed);
            this.spine.setAnimation(0, anim, true);
            const duration = (this.spine.findAnimation(anim)?.duration || 0) * ratioSpeed;
            AnimationUtils.updateSpineDuration(this.spine, anim, duration);
            if (duration > 0) {
                await AnimationUtils.delayTime(duration);
            }
            this.hideMultiplier();
        } catch (e) {
            console.warn("Catch error after await method", e.message);
        }
    }

    setValue(value: number) {
        this._multiplierValue = value;
        this.value.string = `x${value}`;
        this.updateMultiplierRange(value);
        this.updateColor(value);
    }

    protected hideMultiplier() {
        this.value.node.active = false;
        this.spine.setAnimation(0, "idle", true);
    }

    protected updateColor(value: number) {
        const index = SpecialSymbol.MULTIPLIER_SYMBOL + this.multiplierRange;
        const anim = "idle";
        this.spine.skeletonData = resourcesCache.slotSymbols[index];
        this.spine.setAnimation(0, anim, true);
    }

    private updateMultiplierRange(value: number) {
        let i = 0;
        const range = resourcesCache.gameFeatures?.newMultiplierRange ? [5, 15, 50] : [5, 10, 15];
        for (; i < range.length; i++) {
            if (value <= range[i]) {
                break;
            }
        }
        this.multiplierRange = i;
    }
}
