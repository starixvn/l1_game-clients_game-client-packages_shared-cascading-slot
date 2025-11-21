import gc from "@sg/game-client-base";
import { _decorator, Color, Label, Sprite } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { HyperSpinHandler } from "../../handlers/hyper-spin-handler";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { Connection } = gc;
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export default class HyperSpinRoundNumber extends ObserverComponent {
    @property(Label)
    lblNoOfRound: Label = null;

    @property(Sprite)
    sprSelectedBg: Sprite = null;

    @property
    noOfRoundSelectedTextColor = "000000";

    @property
    noOfRoundNormalTextColor = "ffffff";

    get value() {
        const nodeName = this.node.name;
        const numericValue = +nodeName;
        return numericValue;
    }

    setValue(noOfRound: number) {

        this.lblNoOfRound.string = noOfRound.toString();

        this.node.name = noOfRound.toString();

    }

    setSelectedRound(selected: boolean) {

        this.sprSelectedBg.node.active = selected;

        const color = selected ? this.noOfRoundSelectedTextColor : this.noOfRoundNormalTextColor;

        this.lblNoOfRound.color = new Color().fromHEX(color);

    }

    @handle(HyperSpinHandler, (handle, rounds: number) => handle.updateHyperSpinRounds(rounds))
    onRoundNumberItemClick(event) {
        const eventTargetName = event.target.name;
        const returnValue = +eventTargetName;

        this.playSoundClick();

        this.setSelectedRound(true);

        return returnValue;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;

        return audioId;
    }
}

