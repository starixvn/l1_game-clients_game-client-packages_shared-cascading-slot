import { _decorator, Component, instantiate, Node, Prefab, sp } from "cc";
import { FunctionUtils } from "db://shared-components/shared/utils";
import { UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
import { MULTIPLIER_SYMBOL, prefabCache, SCATTER_SYMBOL } from "../../cascading-slot-utils";
import { MultiplierItem } from "../../multiplier/scripts/multiplier-item";
import { CascadingSlotReelSymbol } from "./cascading-slot-reel-symbol";
const { ccclass, property } = _decorator;

@ccclass
export class CascadingSlotReelItem extends Component {
    @property(Prefab)
    itemPrefabs: Prefab[] = [];

    @property(Node)
    content: Node = null;

    public index = -1;

    setItem(index: number) {
        this.replaceItem(index);
        this.index = index;
    }

    get isScatterSymbol(): boolean {
        return this.index === SCATTER_SYMBOL;
    }

    protected replaceItem(index: number) {
        this.content.removeAllChildren();
        if (index < 0) {
            console.error("replaceItem wrong index: " + index);
            return;
        }
        const symbolPrefabIndex = index >= MULTIPLIER_SYMBOL ? 1 : 0;
        const node = instantiate(this.itemPrefabs[symbolPrefabIndex]);
        this.content.addChild(node);
        const reelSymbol = node.getComponent(CascadingSlotReelSymbol);

        reelSymbol.setAminamtion(prefabCache.slotSymbols[index]);
    }

    updateMultiplierItem(multiplier: number[]) {
        if (this.index >= MULTIPLIER_SYMBOL && multiplier.length > 0) {
            const m = multiplier.shift();
            const multiplierItem = this.content.children[0].getComponent(MultiplierItem);
            multiplierItem?.setValue(m);
        }
    }

    async highlightScatterItem() {
        const effectSpine = this.content.getComponentInChildren(sp.Skeleton);
        const anim = "highlight";
        effectSpine.skeletonData = prefabCache.slotSymbols[SCATTER_SYMBOL];
        effectSpine.setAnimation(0, anim, true);
        const original = effectSpine.findAnimation(anim).duration;
        await FunctionUtils.delay(original * UNIT_SECOND_SPIN);
    }
}
