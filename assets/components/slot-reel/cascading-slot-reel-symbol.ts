import { _decorator, Component, sp } from "cc";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelSymbol extends Component {
    @property(sp.Skeleton)
    effectSpine: sp.Skeleton = null;

    @property
    premultipliedAlpha = false;

    setAnimation(spine: any) {
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] setAnimation called", {
            spine,
            hasSpine: !!spine,
            hasEffectSpine: !!this.effectSpine,
            premultipliedAlpha: this.premultipliedAlpha,
            willSetSkeletonData: true,
            willSetPremultipliedAlpha: true,
            willPlayAnimation: true,
            timestamp: new Date().toISOString()
        });

        const anim = "idle";
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] Setting animation parameters", {
            animation: anim,
            loop: true,
            track: 0,
            timestamp: new Date().toISOString()
        });

        this.effectSpine.skeletonData = spine;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] Skeleton data set", {
            timestamp: new Date().toISOString()
        });

        this.effectSpine.premultipliedAlpha = this.premultipliedAlpha;
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] Premultiplied alpha set", {
            premultipliedAlpha: this.premultipliedAlpha,
            timestamp: new Date().toISOString()
        });

        this.effectSpine.setAnimation(0, anim, true);
        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] Animation started", {
            animation: anim,
            loop: true,
            track: 0,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_REEL_SYMBOL] setAnimation completed", {
            timestamp: new Date().toISOString()
        });
    }
}



