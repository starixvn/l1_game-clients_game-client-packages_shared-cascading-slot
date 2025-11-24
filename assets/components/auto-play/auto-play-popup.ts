import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { GameSpeed } from "../../cascading-slot-utils";
import { AutoPlayHandler } from "../../handlers/auto-play-handlers";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import AutoPlayRoundNumber from "./auto-play-round-number";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class AutoPlayPopup extends ObserverComponent {
    @property(Node)
    nodeContent: Node = null;

    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @property(Toggle)
    tglTurboMode: Toggle = null;

    @render(AutoPlayStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        this.nodeContent.destroyAllChildren();
        roundsList.forEach((round) => {
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(AutoPlayRoundNumber);
            roundNumber?.setValue(round);
            this.nodeContent.addChild(node);
        });
    }

    @render(AutoPlayStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.nodeContent.children.forEach((child) => {
            const roundNumber = child.getComponent(AutoPlayRoundNumber);
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
        });
    }

    @handle(AutoPlayHandler, (handle) => handle.closeAutoPlayPopup())
    onClickclosePopup() {
        this.playSoundClick();
    }

    @handle(AutoPlayHandler, (handle) => handle.confirmRoundAndStart())
    onClickStartButton() {
        this.playSoundClick();
    }

    @handle(CascadingUIHandler, (handle, gameSpeed: string) => handle.handleTurboModeUI(gameSpeed))
    onTurboModeChanged() {
        return this.tglTurboMode.isChecked ? GameSpeed.TURBO : GameSpeed.NORMAL;
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.playSoundClick();
        this.tglTurboMode.isChecked = isTurboMode;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
