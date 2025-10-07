import { _decorator, tween, v3 } from "cc";
import { CascadingUIStore } from "db://shared-cascading-slot/stores/cascading-ui-store";
import Observer from "observer";
import { TumbleWinWiew } from "./tumble-win-view";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitTumbleWinWiew extends TumbleWinWiew {
    @render(CascadingUIStore, (store) => store.portraitshowTotalMultiplierView)
    moveTumbleWinView(move: boolean) {
        if (move) {
            const xcurrent = this.node.position.x;
            tween(this.node)
                .to(0.5, { position: v3(xcurrent - 100, 0, 0) }, { easing: "sineOut" })
                .start();
        } else {
            this.node.position = v3(0, 0, 0);
        }
    }
}
