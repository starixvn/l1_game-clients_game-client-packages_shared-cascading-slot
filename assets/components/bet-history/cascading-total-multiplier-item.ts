import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Node } from "cc";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { handle } = Observer;

@ccclass
export class CascadingTotalMultiplierItem extends Component {
    @property(Label)
    index: Label = null;

    @property(Label)
    time: Label = null;

    @property(Label)
    roundId: Label = null;

    @property(Label)
    multiplier: Label = null;

    @property(Label)
    totalMultiplier: Label = null;

    @property(Node)
    bg: Node = null;

    setData(round: any, index: number) {
        const { time, roundId, totalMultiplier, multiplier } = round;
        this.index.string = index.toString();
        this.time.string = gc.DateTimeUtils.getStringDateByTime(time);
        this.roundId.string = roundId;
        this.multiplier.string = multiplier;
        this.totalMultiplier.string = totalMultiplier;
        this.bg.active = index % 2 === 0;
    }
}
