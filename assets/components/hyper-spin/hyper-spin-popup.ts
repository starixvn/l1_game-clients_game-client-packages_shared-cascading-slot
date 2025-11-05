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
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] initContentRounds called", {
            roundsList,
            hasRoundsList: !!roundsList,
            roundsListLength: roundsList?.length,
            hasNodeContent: !!this.nodeContent,
            hasPrfNoOfRound: !!this.prfNoOfRound,
            timestamp: new Date().toISOString()
        });

        this.nodeContent.destroyAllChildren();
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Cleared existing children from nodeContent", {
            childrenDestroyed: true,
            timestamp: new Date().toISOString()
        });

        roundsList.forEach((round, index) => {
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Processing round", {
                round,
                index,
                timestamp: new Date().toISOString()
            });

            const node = instantiate(this.prfNoOfRound);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Instantiated round node", {
                round,
                nodeCreated: !!node,
                nodeName: node?.name,
                timestamp: new Date().toISOString()
            });

            const roundNumber = node.getComponent(HyperSpinRoundNumber);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Got HyperSpinRoundNumber component", {
                round,
                hasRoundNumberComponent: !!roundNumber,
                timestamp: new Date().toISOString()
            });

            roundNumber?.setValue(round);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Set round value", {
                round,
                setValueCalled: true,
                timestamp: new Date().toISOString()
            });

            this.nodeContent.addChild(node);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Added round node to content", {
                round,
                childrenCount: this.nodeContent.children.length,
                timestamp: new Date().toISOString()
            });
        });

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] initContentRounds completed", {
            totalRoundsProcessed: roundsList?.length,
            finalChildrenCount: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });
    }

    @render(HyperSpinStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] renderSelectedRounds called", {
            noOfRounds,
            hasNodeContent: !!this.nodeContent,
            childrenCount: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });

        this.nodeContent.children.forEach((child, index) => {
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Processing child for selection", {
                childIndex: index,
                childName: child.name,
                timestamp: new Date().toISOString()
            });

            const roundNumber = child.getComponent(HyperSpinRoundNumber);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Got round number component from child", {
                childIndex: index,
                hasRoundNumber: !!roundNumber,
                roundValue: roundNumber?.value,
                timestamp: new Date().toISOString()
            });

            const selectedBg = roundNumber.value === noOfRounds;
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Determined selection state", {
                childIndex: index,
                roundValue: roundNumber.value,
                noOfRounds,
                selectedBg,
                timestamp: new Date().toISOString()
            });

            roundNumber.setSelectedRound(selectedBg);
            cascadingSlotLogger.info("[HYPER_SPIN_POPUP] Set selected round state", {
                childIndex: index,
                selectedBg,
                setSelectedRoundCalled: true,
                timestamp: new Date().toISOString()
            });
        });

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] renderSelectedRounds completed", {
            noOfRounds,
            totalChildrenProcessed: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });
    }

    @handle(HyperSpinHandler, (handle) => handle.closeHyperSpinPopup())
    onClickclosePopup() {
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] onClickclosePopup called", {
            willClosePopup: true,
            willPlaySound: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] onClickclosePopup completed", {
            soundPlayed: true,
            timestamp: new Date().toISOString()
        });
    }

    @handle(HyperSpinHandler, (handle) => handle.confirmHyperSpinRoundsAndStart())
    onClickStartButton() {
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] onClickStartButton called", {
            willStartHyperSpin: true,
            willPlaySound: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] onClickStartButton completed", {
            soundPlayed: true,
            hyperSpinStarted: true,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_POPUP] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }
}



