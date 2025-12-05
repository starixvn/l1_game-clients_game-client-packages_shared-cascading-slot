import { _decorator, Component, instantiate, Node, Prefab, sp, tween, v3, warn } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { getConfigGameSpeed, resourcesCache, SpecialSymbol } from "../../cascading-slot-utils";
import { MultiplierItem } from "../multiplier/multiplier-item";
import { CascadingSlotReelSymbol } from "./cascading-slot-reel-symbol";
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelItem extends Component {
    @property(Prefab)
    itemPrefabs: Prefab[] = [];

    @property(Node)
    content: Node = null;

    @property(Node)
    blurSymbol: Node = null;

    public index = -1;
    private _effectSpine: sp.Skeleton = null;

    onLoad() {
        if (this.blurSymbol) {
            AnimationUtils.setOpacityNode(this.blurSymbol, 1);
            this.blurSymbol.active = false;
        }
    }

    get isScatterSymbol(): boolean {
        return this.index === SpecialSymbol.SCATTER_SYMBOL;
    }

    get isMultiplierSymbol(): boolean {
        return this.index >= SpecialSymbol.MULTIPLIER_SYMBOL;
    }

    protected replaceItem(index: number) {
        this.content.children.forEach((child) => child.destroy());
        this._effectSpine = null;

        if (index < 0) {
            console.error("replaceItem wrong index: " + index);
            return;
        }
        const symbolPrefabIndex = index >= SpecialSymbol.MULTIPLIER_SYMBOL ? 1 : 0;
        const node = instantiate(this.itemPrefabs[symbolPrefabIndex]);
        this.content.addChild(node);
        const reelSymbol = node.getComponent(CascadingSlotReelSymbol);
        reelSymbol.setBlurImg(index);
        reelSymbol.setAnimation(resourcesCache.slotSymbols[index]);
    }

    getMultiplierItem() {
        const validChildren = this.content.children.filter((child) => child.isValid && child.activeInHierarchy);
        const items = validChildren.map((child) => child.getComponent(MultiplierItem)).filter((item) => item !== null);
        if (items.length > 0) {
            if (items.length > 1) {
                warn("Wrong here, should not have more than 1 multiplier item !!!!!");
            }
            return items[0];
        }
        return null;
    }

    updateMultiplierItem(multiplier: number[]) {
        if (this.index >= SpecialSymbol.MULTIPLIER_SYMBOL && multiplier.length > 0) {
            const m = multiplier.shift();
            const multiplierItem = this.getMultiplierItem();
            if (multiplierItem) {
                multiplierItem.setValue(m);
            }
        }
    }

    async highlightScatterItem() {
        if (!this.effectSpine) {
            return;
        }
        const anim = "highlight";
        this.effectSpine.skeletonData = resourcesCache.slotSymbols[SpecialSymbol.SCATTER_SYMBOL];
        this.effectSpine.setAnimation(0, anim, true);
        const originalDuration = this.effectSpine.findAnimation(anim).duration;
        await AnimationUtils.delayTime(originalDuration);
    }

    playIntroAnimation() {
        if (!this.effectSpine) {
            return;
        }
        this.effectSpine.setAnimation(0, "intro", false);
    }

    get effectSpine(): sp.Skeleton {
        if (!this._effectSpine) {
            this._effectSpine = this.content.getComponentInChildren(sp.Skeleton);
        }
        return this._effectSpine;
    }

    async playEffect(animation: string, gameSpeed: string) {
        if (!this.effectSpine) {
            return;
        }

        const ratioSpeed = getConfigGameSpeed("ratioMatchAndExplosionSymbol", gameSpeed);
        const duration = this.effectSpine.findAnimation(animation).duration * ratioSpeed;
        await AnimationUtils.playSpine(this.effectSpine, animation, false, duration);
    }

    handleBlurAnim(isShowBlurSymbol: boolean) {
        if (!this.effectSpine || !this.blurSymbol) {
            return;
        }

        this.blurSymbol.active = isShowBlurSymbol;
        this.effectSpine.node.active = !isShowBlurSymbol;
        if (isShowBlurSymbol) {
            AnimationUtils.setOpacityNode(this.blurSymbol, 255);
            AnimationUtils.setOpacityNode(this.effectSpine.node, 1);

            const scale = 1.5;
            tween(this.blurSymbol)
                .to(0.1, { scale: v3(1 / scale, 1, 1).multiplyScalar(scale) }, { easing: "sineInOut" })
                .start();
        } else {
            AnimationUtils.setOpacityNode(this.blurSymbol, 1);
            AnimationUtils.setOpacityNode(this.effectSpine.node, 255);
            tween(this.blurSymbol)
                .to(0.1, { scale: v3(1, 1, 1) }, { easing: "sineInOut" })
                .start();
        }
    }

    setItem(index: number) {
        if (index === this.index) {
            return;
        }
        this.index = index;
        this.replaceItem(index);
    }
}
