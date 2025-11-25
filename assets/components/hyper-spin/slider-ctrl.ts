import { Slider, Node, _decorator } from "cc";
const { ccclass, property } = _decorator;

export enum SliderState {
    NORMAL,
    HOVER,
    PRESSED,
    DISABLED,
}

@ccclass("SliderCtrl")
export class SliderCtrl extends Slider {
}
