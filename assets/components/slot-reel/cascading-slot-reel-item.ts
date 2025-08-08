import { _decorator, Component, instantiate, Node, Prefab, sp } from "cc";
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
    multiplierRange = 0;

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
        this.content.destroyAllChildren();
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

    updateMultiplierItem(multiplier: number[]) {
        if (this.index >= SpecialSymbol.MULTIPLIER_SYMBOL && multiplier.length > 0) {
            const m = multiplier.shift();
            const multiplierItem = this.content.getComponentInChildren(MultiplierItem);
            if (multiplierItem) {
                multiplierItem.setValue(m);
                this.multiplierRange = multiplierItem.multiplierRange;
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

    async playEffect(animation: string) {
        if (!this.effectSpine) {
            return;
        }
        await AnimationUtils.playSpine(this.effectSpine, animation);
    }
}
