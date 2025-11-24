import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { HyperSpinStore } from "../../stores/hyper-spin-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import HyperSpinRoundNumber from "./hyper-spin-round-number";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class HyperSpinPopup extends ObserverComponent {
    @property(Node)
    nodeContent: Node = null;

    @property(Prefab)
    prfNoOfRound: Prefab = null;

    @render(HyperSpinStore, (store) => store.roundsList)
    initContentRounds(roundsList: number[]) {
        this.nodeContent.destroyAllChildren();

        roundsList.forEach((round, index) => {
            const node = instantiate(this.prfNoOfRound);
            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            roundNumber?.setValue(round);
            this.nodeContent.addChild(node);
        });

    }

    @render(HyperSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        this.nodeContent.children.forEach((child, index) => {
            const roundNumber = child.getComponent(HyperSpinRoundNumber);
            const selectedBg = roundNumber.value === noOfRounds;
            roundNumber.setSelectedRound(selectedBg);
        });

    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinPopup())
    onClickclosePopup() {
        this.playSoundClick();
    }

    @handle(HyperSpinHandler, (handle) => handle.confirmHyperSpinRoundsAndStart())
    onClickStartButton() {
        this.playSoundClick();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        return audioId;
    }
}

