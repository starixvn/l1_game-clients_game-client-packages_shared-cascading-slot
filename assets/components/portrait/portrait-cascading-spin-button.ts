import { _decorator, Label, Node } from "cc";
import Observer from "observer";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingSpinButton } from "../spin-button/cascading-spin-button";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingSpinButton extends CascadingSpinButton {
    @property(Node)
    nodeAutospinNumber: Node = null;

    @property(Label)
    lblAutoSpinRound: Label = null;

    @render(CascadingUIStore, (store) => store.isShowAutoSpinRoundPortrait)
    setNodeVisibilityAutoSpinRound(isActive: boolean) {
        this.nodeAutospinNumber.active = isActive;
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    setRoundsAutoplayMsg(roundsAutoplay: number) {
        this.lblAutoSpinRound.string = roundsAutoplay.toString();
    }
}
