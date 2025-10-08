import { _decorator, instantiate, Node, tween, UIOpacity, v3 } from "cc";
import { ComponentUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { CascadingSlotBoard } from "./cascading-slot-board";
const { observer, render, handle } = Observer;
const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingSlotBoard extends CascadingSlotBoard {
    movingMultiplier(multiplierNode: Node, container: Node, destNode: Node) {
        return new Promise<void>((resolve) => {
            const node = instantiate(multiplierNode);
            node.active = true;
            const startPos = ComponentUtils.convertPosition(container, multiplierNode);
            const destPos = ComponentUtils.convertPosition(container, destNode);
            container.addChild(node);
            node.position = startPos;

            const distance = startPos.subtract(destPos).length();
            const pixelPerSecond = 750;
            const duration = distance / pixelPerSecond;
            tween(node)
                .to(duration * 0.3, { scale: v3(1, 1, 1) }, { easing: "sineOut" })
                .to(duration * 0.69, { scale: v3(1.5, 1.5, 1.5) }, { easing: "sineIn" })
                .start();
            tween(node.getComponent(UIOpacity))
                .to(duration - 0.1, { opacity: 240 }, { easing: "sineOut" })
                .to(0.1, { opacity: 0 }, { easing: "sineOut" })
                .start();
            tween(node)
                .to(duration, { position: destPos }, { easing: "sineOut" })
                .call(() => {
                    resolve();
                    node.destroy();
                })
                .start();
        });
    }
}
