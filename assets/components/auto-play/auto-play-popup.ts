import gc from "@sg/game-client-base";
import { _decorator, Button, Color, instantiate, Node, Prefab, Sprite } from "cc";
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

    @property({ type: Node })
    nodeSpeedList: Node[] = [];

    onLoad() {
        super.onLoad();
        this.nodeSpeedList.forEach((node) => {
            let button = node.getComponent(Button);
            if (!button) {
                button = node.addComponent(Button);
                button.node.on(Button.EventType.CLICK, () => this.onButtonClick(node.name));
            }
        });
    }

    @handle(CascadingUIHandler, (handle, gameSpeed: string) => handle.handleTurboModeUI(gameSpeed))
    onButtonClick(speed: string) {
        this.playSoundClick();
        return GameSpeed[speed.toUpperCase()];
    }

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

    private findTargetSpeedIndex(targetSpeed: string): number {
        return this.nodeSpeedList.findIndex((node) => node.name === targetSpeed);
    }

    @render(CascadingUIStore, (store) => store.gameSpeed)
    renderGameSpeed(gameSpeed: string) {
        this.playSoundClick();
        const targetSpeed = gameSpeed.toLowerCase();
        const targetIndex = this.findTargetSpeedIndex(targetSpeed);

        if (targetIndex === -1) {
            return;
        }
        this.nodeSpeedList.forEach((node, index) => {
            const sprIcon = node.getComponent(Sprite);
            sprIcon.color = index === targetIndex ? new Color().fromHEX("548FF8") : new Color().fromHEX("807E7E");
        });
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        return gc.Audios.AudioIds.CLICK;
    }
}
