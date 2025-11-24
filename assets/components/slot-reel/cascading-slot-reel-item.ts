import { _decorator, Component, instantiate, Node, Prefab, sp, warn } from "cc";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { resourcesCache, SpecialSymbol } from "../../cascading-slot-utils";
import { MultiplierItem } from "../multiplier/multiplier-item";
import { CascadingSlotReelSymbol } from "./cascading-slot-reel-symbol";
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelItem extends Component {
    @property(Prefab)
    itemPrefabs: Prefab[] = [];

    @property(Node)
    content: Node = null;

    public index = -1;
    private _effectSpine: sp.Skeleton = null;

    setItem(index: number) {
        this.replaceItem(index);
        this.index = index;
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

    async playEffect(animation: string, isTurbo: boolean) {
        if (!this.effectSpine) {
            return;
        }
        const duration = isTurbo
            ? this.effectSpine.findAnimation(animation).duration * 0.25
            : this.effectSpine.findAnimation(animation).duration;
        console.log("duration spine", duration);
        await AnimationUtils.playSpine(this.effectSpine, animation, false, duration);
    }
}
