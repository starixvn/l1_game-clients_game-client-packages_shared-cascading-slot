import { _decorator, Component, sp } from "cc";
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelSymbol extends Component {
    @property(sp.Skeleton)
    effectSpine: sp.Skeleton = null;

    @property
    premultipliedAlpha = false;

    setAnimation(spine: any) {
        const anim = "idle";
        this.effectSpine.skeletonData = spine;
        this.effectSpine.premultipliedAlpha = this.premultipliedAlpha;
        this.effectSpine.setAnimation(0, anim, true);
    }
}
