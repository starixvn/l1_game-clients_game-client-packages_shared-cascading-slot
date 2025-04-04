import { _decorator, Component, Label } from "cc";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectFreespin extends Component {
    @property(Label)
    lblFreeSpinCount: Label = null;

    freeSpinsCount = 0;

    onLoad(): void {
        this.lblFreeSpinCount.string = this.freeSpinsCount.toString();
    }
}
