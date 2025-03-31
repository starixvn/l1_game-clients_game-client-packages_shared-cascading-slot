import { _decorator, Component, Label, Node } from "cc";

const { ccclass, property } = _decorator;

@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends Component {
    @property(Label)
    totalWinLabel: Label = null;

    @property(Node)
    totalWinNode: Node = null;
}
