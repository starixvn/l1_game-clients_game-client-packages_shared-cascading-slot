import { _decorator, Animation, Component, Label, sp } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { resourcesCache, SpecialSymbol } from "../../cascading-slot-utils";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] multiplier getter accessed", {
            multiplierValue: this._multiplierValue,
            multiplierRange: this.multiplierRange,
            gameId: this.gameId,
            timestamp: new Date().toISOString()
        });

        return this._multiplierValue;
    }

    onLoad() {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] onLoad called", {
            hasNode: !!this.node,
            hasValueLabel: !!this.value,
            hasAnimation: !!this.animation,
            currentMultiplierValue: this._multiplierValue,
            multiplierRange: this.multiplierRange,
            gameId: this.gameId,
            willGetSpineComponent: true,
            timestamp: new Date().toISOString()
        });

        this.spine = this.node.getComponent(sp.Skeleton);
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Spine component retrieved", {
            hasSpine: !!this.spine,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[MULTIPLIER_ITEM] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    async playAnimationGlow() {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] playAnimationGlow called", {
            hasSpine: !!this.spine,
            currentMultiplierValue: this._multiplierValue,
            multiplierRange: this.multiplierRange,
            willPlayHighlightAnimation: true,
            willHideMultiplier: true,
            timestamp: new Date().toISOString()
        });

        try {
            const anim = "highlight";
            cascadingSlotLogger.info("[MULTIPLIER_ITEM] Starting highlight animation", {
                animation: anim,
                loop: true,
                track: 0,
                timestamp: new Date().toISOString()
            });

            this.spine.setAnimation(0, anim, true);

            const duration = this.spine.findAnimation(anim)?.duration || 0;
            cascadingSlotLogger.info("[MULTIPLIER_ITEM] Animation duration retrieved", {
                duration,
                willUpdateSpineDuration: true,
                timestamp: new Date().toISOString()
            });

            AnimationUtils.updateSpineDuration(this.spine, anim, duration);

            if (duration > 0) {
                cascadingSlotLogger.info("[MULTIPLIER_ITEM] Delaying for animation duration", {
                    duration,
                    timestamp: new Date().toISOString()
                });
                await AnimationUtils.delayTime(duration);
            } else {
                cascadingSlotLogger.info("[MULTIPLIER_ITEM] No delay needed (duration <= 0)", {
                    duration,
                    timestamp: new Date().toISOString()
                });
            }

            cascadingSlotLogger.info("[MULTIPLIER_ITEM] Hiding multiplier", {
                timestamp: new Date().toISOString()
            });
            this.hideMultiplier();

            cascadingSlotLogger.info("[MULTIPLIER_ITEM] playAnimationGlow completed successfully", {
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            cascadingSlotLogger.warn("[MULTIPLIER_ITEM] Catch error after await method", e.message, {
                error: e,
                multiplierValue: this._multiplierValue,
                timestamp: new Date().toISOString()
            });
        }
    }

    setValue(value: number) {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] setValue called", {
            value,
            previousMultiplierValue: this._multiplierValue,
            previousMultiplierRange: this.multiplierRange,
            hasValueLabel: !!this.value,
            hasSpine: !!this.spine,
            willSetMultiplierValue: true,
            willUpdateLabel: true,
            willUpdateMultiplierRange: true,
            willUpdateColor: true,
            timestamp: new Date().toISOString()
        });

        this._multiplierValue = value;
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Multiplier value set", {
            newMultiplierValue: this._multiplierValue,
            timestamp: new Date().toISOString()
        });

        this.value.string = `x${value}`;
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Label text set", {
            labelText: this.value.string,
            timestamp: new Date().toISOString()
        });

        this.updateMultiplierRange(value);
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Multiplier range updated", {
            newMultiplierRange: this.multiplierRange,
            timestamp: new Date().toISOString()
        });

        this.updateColor(value);
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Color updated", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[MULTIPLIER_ITEM] setValue completed", {
            finalMultiplierValue: this._multiplierValue,
            finalMultiplierRange: this.multiplierRange,
            finalLabelText: this.value.string,
            timestamp: new Date().toISOString()
        });
    }

    protected hideMultiplier() {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] hideMultiplier called", {
            hasValueNode: !!this.value?.node,
            currentValueNodeActive: this.value?.node?.active,
            hasSpine: !!this.spine,
            willDeactivateValueNode: true,
            willSetIdleAnimation: true,
            timestamp: new Date().toISOString()
        });

        this.value.node.active = false;
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Value node deactivated", {
            timestamp: new Date().toISOString()
        });

        this.spine.setAnimation(0, "idle", true);
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Idle animation set", {
            animation: "idle",
            loop: true,
            track: 0,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[MULTIPLIER_ITEM] hideMultiplier completed", {
            timestamp: new Date().toISOString()
        });
    }

    protected updateColor(value: number) {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] updateColor called", {
            value,
            multiplierRange: this.multiplierRange,
            hasSpine: !!this.spine,
            willCalculateIndex: true,
            willSetSkeletonData: true,
            willPlayIdleAnimation: true,
            timestamp: new Date().toISOString()
        });

        const index = SpecialSymbol.MULTIPLIER_SYMBOL + this.multiplierRange;
        const anim = "idle";

        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Calculated symbol index", {
            multiplierSymbol: SpecialSymbol.MULTIPLIER_SYMBOL,
            multiplierRange: this.multiplierRange,
            calculatedIndex: index,
            animation: anim,
            timestamp: new Date().toISOString()
        });

        const skeletonData = resourcesCache.slotSymbols[index];
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Setting skeleton data", {
            index,
            hasSkeletonData: !!skeletonData,
            timestamp: new Date().toISOString()
        });

        this.spine.skeletonData = skeletonData;
        this.spine.setAnimation(0, anim, true);

        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Color update completed", {
            index,
            animation: anim,
            timestamp: new Date().toISOString()
        });
    }

    private updateMultiplierRange(value: number) {
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] updateMultiplierRange called", {
            value,
            currentMultiplierRange: this.multiplierRange,
            hasNewMultiplierRange: !!resourcesCache.gameFeatures?.newMultiplierRange,
            willCalculateNewRange: true,
            timestamp: new Date().toISOString()
        });

        let i = 0;
        const range = resourcesCache.gameFeatures?.newMultiplierRange ? [5, 15, 50] : [5, 10, 15];
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Using multiplier range", {
            range,
            isNewMultiplierRange: !!resourcesCache.gameFeatures?.newMultiplierRange,
            timestamp: new Date().toISOString()
        });

        for (; i < range.length; i++) {
            cascadingSlotLogger.info("[MULTIPLIER_ITEM] Checking range value", {
                index: i,
                rangeValue: range[i],
                value: value,
                isLessThanOrEqual: value <= range[i],
                willBreak: value <= range[i],
                timestamp: new Date().toISOString()
            });

            if (value <= range[i]) {
                break;
            }
        }

        this.multiplierRange = i;
        cascadingSlotLogger.info("[MULTIPLIER_ITEM] Multiplier range updated", {
            newMultiplierRange: this.multiplierRange,
            value: value,
            selectedRangeIndex: i,
            timestamp: new Date().toISOString()
        });
    }
}



