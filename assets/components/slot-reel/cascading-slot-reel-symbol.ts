import { _decorator, Component, Node, sp, Sprite } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { resourcesCache } from "../../cascading-slot-utils";
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelSymbol extends Component {
    @property(sp.Skeleton)
    effectSpine: sp.Skeleton = null;

    @property(Node)
    blurSymbol: Node = null;

    @property
    premultipliedAlpha = false;

    onLoad() {
        if (this.blurSymbol) {
            AnimationUtils.setOpacityNode(this.blurSymbol, 1);
            this.blurSymbol.active = false;
        }
    }

    setAnimation(spine: any) {
        if (this.effectSpine) {
            const anim = "idle";
            this.effectSpine.skeletonData = spine;
            this.effectSpine.premultipliedAlpha = this.premultipliedAlpha;
            this.effectSpine.setAnimation(0, anim, true);
        }
    }

    setBlurImg(index: number) {
        const gameAtlasCache = resourcesCache.gameAtlas;
        let spriteFrame = gameAtlasCache.getSpriteFrame(`symbol-${index}-blur`);
        this.blurSymbol.getComponent(Sprite).spriteFrame = spriteFrame;
    }
}
