import { _decorator, sp } from "cc";
import { MultiplierItem } from "./multiplier-item";
const { ccclass, property } = _decorator;

@ccclass
export class MultiplierItemNew extends MultiplierItem {
    onLoad() {
        this.spine = this.node.getComponentInChildren(sp.Skeleton);
    }
}
