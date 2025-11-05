import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Node } from "cc";
import Observer from "observer";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: setData called with", { round, index });
        const { time, roundId, totalMultiplier, multiplier } = round;
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: extracted data", { time, roundId, totalMultiplier, multiplier });
        this.index.string = index.toString();
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: index set to", this.index.string);
        this.time.string = gc.DateTimeUtils.getStringDateByTime(time);
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: time set to", this.time.string);
        this.roundId.string = roundId;
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: roundId set to", this.roundId.string);
        this.multiplier.string = multiplier;
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: multiplier set to", this.multiplier.string);
        this.totalMultiplier.string = totalMultiplier;
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: totalMultiplier set to", this.totalMultiplier.string);
        this.bg.active = index % 2 === 0;
        cascadingSlotLogger.info("CascadingTotalMultiplierItem: bg active set to", this.bg.active);
    }
}



