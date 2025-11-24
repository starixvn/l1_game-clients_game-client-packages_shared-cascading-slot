import gc from "@sg/game-client-base";
import { _decorator, Component, Sprite, Slider, Color, Label } from "cc";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, menu, property } = _decorator;

@ccclass("SliderCtrl")
@menu('UI/SliderCtrl')
export class SliderCtrl extends Component {

    _color = new Color();
    _label = new Label();
    _stopValue = 0;
    // @property(Label)
    // labelTotalBet: Label = null;

    start() {
        // Your initialization goes here.
    }

    sliderChange(slider: Slider) {

        const spriteComp = this.getComponent(Sprite)!;
        this._color.set(spriteComp.color);
        this._color.a = (slider.progress - this._stopValue) * 255;
        spriteComp.color = this._color;
        this._label.string = gc.FormatUtils.numberWithCommas(slider.progress, 2, true);

    }

    // update (deltaTime: number) {
    //     // Your update function goes here.
    // }
}

