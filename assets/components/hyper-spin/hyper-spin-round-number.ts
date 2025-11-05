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
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] get value accessed", {
            nodeName,
            numericValue,
            isValidNumber: !isNaN(numericValue),
            hasNode: !!this.node,
            timestamp: new Date().toISOString()
        });
        return numericValue;
    }

    setValue(noOfRound: number) {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] setValue called", {
            noOfRound,
            hasLabel: !!this.lblNoOfRound,
            hasNode: !!this.node,
            timestamp: new Date().toISOString()
        });

        this.lblNoOfRound.string = noOfRound.toString();
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Set label string", {
            noOfRound,
            labelString: this.lblNoOfRound.string,
            timestamp: new Date().toISOString()
        });

        this.node.name = noOfRound.toString();
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Set node name", {
            noOfRound,
            nodeName: this.node.name,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] setValue completed", {
            noOfRound,
            finalLabelString: this.lblNoOfRound.string,
            finalNodeName: this.node.name,
            timestamp: new Date().toISOString()
        });
    }

    setSelectedRound(selected: boolean) {
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] setSelectedRound called", {
            selected,
            hasSprite: !!this.sprSelectedBg,
            hasSpriteNode: !!this.sprSelectedBg?.node,
            hasLabel: !!this.lblNoOfRound,
            noOfRoundSelectedTextColor: this.noOfRoundSelectedTextColor,
            noOfRoundNormalTextColor: this.noOfRoundNormalTextColor,
            timestamp: new Date().toISOString()
        });

        this.sprSelectedBg.node.active = selected;
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Set sprite background active state", {
            selected,
            spriteActive: this.sprSelectedBg.node.active,
            timestamp: new Date().toISOString()
        });

        const color = selected ? this.noOfRoundSelectedTextColor : this.noOfRoundNormalTextColor;
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Determined color for selection state", {
            selected,
            color,
            selectedColor: this.noOfRoundSelectedTextColor,
            normalColor: this.noOfRoundNormalTextColor,
            timestamp: new Date().toISOString()
        });

        this.lblNoOfRound.color = new Color().fromHEX(color);
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Applied color to label", {
            selected,
            color,
            labelColorSet: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] setSelectedRound completed", {
            selected,
            finalSpriteActive: this.sprSelectedBg.node.active,
            finalLabelColor: color,
            timestamp: new Date().toISOString()
        });
    }

    @handle(HyperSpinHandler, (handle, rounds: number) => handle.updateHyperSpinRounds(rounds))
    onRoundNumberItemClick(event) {
        const eventTargetName = event.target.name;
        const returnValue = +eventTargetName;
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] onRoundNumberItemClick called", {
            event,
            eventTargetName,
            returnValue,
            willPlaySound: true,
            willSetSelected: true,
            timestamp: new Date().toISOString()
        });

        this.playSoundClick();
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Sound played", {
            soundPlayed: true,
            timestamp: new Date().toISOString()
        });

        this.setSelectedRound(true);
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] Round selected", {
            selected: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] onRoundNumberItemClick returning", {
            returnValue,
            timestamp: new Date().toISOString()
        });

        return returnValue;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSoundClick() {
        const audioId = gc.Audios.AudioIds.CLICK;
        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] playSoundClick called", {
            audioId,
            willReturnAudioId: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[HYPER_SPIN_ROUND_NUMBER] playSoundClick returning", {
            audioId,
            timestamp: new Date().toISOString()
        });

        return audioId;
    }
}



