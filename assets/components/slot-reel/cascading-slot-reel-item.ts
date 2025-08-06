import { _decorator, Component, instantiate, Node, Prefab, sp } from "cc";
import { FunctionUtils } from "db://shared-components/shared/utils";
import { UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
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

    get multiplierLevel() {
        return this.index - SpecialSymbol.MULTIPLIER_SYMBOL;
    }

    protected replaceItem(index: number) {
        this.content.removeAllChildren();
        if (index < 0) {
            console.error("replaceItem wrong index: " + index);
            return;
        }
        const symbolPrefabIndex = index >= SpecialSymbol.MULTIPLIER_SYMBOL ? 1 : 0;
        const node = instantiate(this.itemPrefabs[symbolPrefabIndex]);
        this.content.addChild(node);
        const reelSymbol = node.getComponent(CascadingSlotReelSymbol);

        reelSymbol.setAminamtion(resourcesCache.slotSymbols[index]);
    }

    updateMultiplierItem(multiplier: number[]) {
        if (this.index >= SpecialSymbol.MULTIPLIER_SYMBOL && multiplier.length > 0) {
            const m = multiplier.shift();
            const multiplierItem = this.content.children[0].getComponent(MultiplierItem);
            multiplierItem?.setValue(m);
        }
    }

    async highlightScatterItem() {
        if (!this.effectSpine) {
            return;
        }
        const anim = "highlight";
        this.effectSpine.skeletonData = resourcesCache.slotSymbols[SpecialSymbol.SCATTER_SYMBOL];
        this.effectSpine.setAnimation(0, anim, true);
        const original = this.effectSpine.findAnimation(anim).duration;
        await FunctionUtils.delay(original * UNIT_SECOND_SPIN);
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
}
