import gc from "@sg/game-client-base";
import { _decorator, instantiate, Node, Prefab, Toggle } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AutoPlayHandler } from "../../handlers/auto-play-handlers";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import AutoPlayRoundNumber from "./auto-play-round-number";
import { cascadingSlotLogger } from "../../cascading-slot-logger";


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
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] initContentRounds called", {
            roundsList,
            hasRoundsList: !!roundsList,
            roundsListLength: roundsList?.length,
            hasNodeContent: !!this.nodeContent,
            hasPrfNoOfRound: !!this.prfNoOfRound,
            timestamp: new Date().toISOString()
        });

        this.nodeContent.destroyAllChildren();
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Cleared existing children from nodeContent", {
            childrenDestroyed: true,
            timestamp: new Date().toISOString()
        });

        roundsList.forEach((round, index) => {
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Processing round", {
                round,
                index,
                timestamp: new Date().toISOString()
            });

            const node = instantiate(this.prfNoOfRound);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Instantiated round node", {
                round,
                nodeCreated: !!node,
                nodeName: node?.name,
                timestamp: new Date().toISOString()
            });

            const roundNumber = node.getComponent(AutoPlayRoundNumber);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Got AutoPlayRoundNumber component", {
                round,
                hasRoundNumberComponent: !!roundNumber,
                timestamp: new Date().toISOString()
            });

            roundNumber?.setValue(round);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Set round value", {
                round,
                setValueCalled: true,
                timestamp: new Date().toISOString()
            });

            this.nodeContent.addChild(node);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Added round node to content", {
                round,
                childrenCount: this.nodeContent.children.length,
                timestamp: new Date().toISOString()
            });
        });

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] initContentRounds completed", {
            totalRoundsProcessed: roundsList?.length,
            finalChildrenCount: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });
    }

    @render(AutoPlayStore, (store) => store.selectedRoundOnPopup)
    renderSelectedRounds(noOfRounds: number) {
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] renderSelectedRounds called", {
            noOfRounds,
            hasNodeContent: !!this.nodeContent,
            childrenCount: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });

        this.nodeContent.children.forEach((child, index) => {
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Processing child for selection", {
                childIndex: index,
                childName: child.name,
                timestamp: new Date().toISOString()
            });

            const roundNumber = child.getComponent(AutoPlayRoundNumber);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Got round number component from child", {
                childIndex: index,
                hasRoundNumber: !!roundNumber,
                roundValue: roundNumber?.value,
                timestamp: new Date().toISOString()
            });

            const selectedBg = roundNumber.value === noOfRounds;
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Determined selection state", {
                childIndex: index,
                roundValue: roundNumber.value,
                noOfRounds,
                selectedBg,
                timestamp: new Date().toISOString()
            });

            roundNumber.setSelectedRound(selectedBg);
            cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Set selected round state", {
                childIndex: index,
                selectedBg,
                setSelectedRoundCalled: true,
                timestamp: new Date().toISOString()
            });
        });

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] renderSelectedRounds completed", {
            noOfRounds,
            totalChildrenProcessed: this.nodeContent.children.length,
            timestamp: new Date().toISOString()
        });
    }

    @handle(AutoPlayHandler, (handle) => handle.closeAutoPlayPopup())
    onClickclosePopup() {
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onClickclosePopup called", {
            willClosePopup: true,
            willPlaySound: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onClickclosePopup completed", {
            soundPlayed: true,
            timestamp: new Date().toISOString()
        });
    }

    @handle(AutoPlayHandler, (handle) => handle.confirmRoundAndStart())
    onClickStartButton() {
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onClickStartButton called", {
            willStartAutoPlay: true,
            willPlaySound: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onClickStartButton completed", {
            soundPlayed: true,
            autoPlayStarted: true,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handle, isTurboMode: boolean) => handle.handleTurboModeUI(isTurboMode))
    onTurboModeChanged() {
        const isChecked = this.tglTurboMode.isChecked;
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onTurboModeChanged called", {
            hasTglTurboMode: !!this.tglTurboMode,
            isChecked,
            willReturnIsChecked: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] onTurboModeChanged returning", {
            isChecked,
            timestamp: new Date().toISOString()
        });

        return isChecked;
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] renderTurboMode called", {
            isTurboMode,
            hasTglTurboMode: !!this.tglTurboMode,
            currentIsChecked: this.tglTurboMode?.isChecked,
            willPlaySound: true,
            willSetChecked: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Sound played", {
            soundPlayed: true,
            timestamp: new Date().toISOString()
        });

        this.tglTurboMode.isChecked = isTurboMode;
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] Turbo mode toggle set", {
            isTurboMode,
            toggleSet: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] renderTurboMode completed", {
            isTurboMode,
            finalIsChecked: this.tglTurboMode.isChecked,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[AUTO_PLAY_POPUP] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }
}



