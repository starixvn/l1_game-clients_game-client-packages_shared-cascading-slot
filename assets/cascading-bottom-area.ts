import { _decorator, Color, Component, Label, Node, Toggle } from "cc";

import { CascadingTotalBet } from "./total-bet/scripts/components/cascading-totalBet";

const { ccclass, property } = _decorator;

@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends Component {
    @property(Toggle)
    autoSpinToggle: Toggle = null;

    @property(Toggle)
    turboToggle: Toggle = null;

    @property(Label)
    totalWinLabel: Label = null;

    @property(Node)
    totalWinNode: Node = null;

    @property(CascadingTotalBet)
    miniBetControl: CascadingTotalBet;

    onClickListener = {
        onAutoSpinChanged: () => {},
        onTurboModeChanged: (toggle) => {},
    };

    onAutoSpinChanged() {
        this.onClickListener.onAutoSpinChanged();
    }

    onTurboModeChanged(toggle: Toggle) {
        this.onClickListener.onTurboModeChanged(toggle);
    }

    updateColor(colorList) {
        const { textColor, numberColor, buttonBorderColor, winAmountColor, bgFrameColor } = colorList;

        // this.getComponentsInChildren(ChangeLabelColor).forEach((comp) => {
        //     const labelComp = comp.node.getComponent(Label);
        //     if (labelComp) {
        //         comp.updateColor(comp.node.getComponent("LocalizedLabel") ? textColor : numberColor);
        //     } else {
        //         comp.updateColor(buttonBorderColor);
        //     }
        // });

        this.totalWinLabel.color = Color.WHITE.fromHEX(winAmountColor);
        // ComponentUtils.setColor(bgFrameColor, this.totalWinNode);
        // ComponentUtils.setColor(bgFrameColor, this.autoSpinToggle.node.children[0]);
        // ComponentUtils.setColor(bgFrameColor, this.turboToggle.node.children[0]);
    }
}
