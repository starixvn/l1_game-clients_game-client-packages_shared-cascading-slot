import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import Observer from "observer";
import { CascadingTotalMultiplierItem } from "./cascading-total-multiplier-item";
const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass
export class CascadingTotalMultiplier extends Component {
    @property(Node)
    content: Node = null;

    @property(Prefab)
    totalMultiplierItemPrefab: Prefab = null;

    setData(data: any) {
        const rounds = data.totalMultipliers.rounds;
        rounds.forEach((round, index) => {
            const itemNode = instantiate(this.totalMultiplierItemPrefab);
            const itemControl = itemNode.getComponent(CascadingTotalMultiplierItem);
            itemControl.setData(round, index + 1);
            this.content.addChild(itemNode);
        });
    }
}
