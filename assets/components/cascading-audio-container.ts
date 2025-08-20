import gc from "@sg/game-client-base";
import { _decorator, AudioSource } from "cc";
import { AudioContainer } from "db://shared-components/game/audios/scripts/component/audio-container";
import Observer from "observer";
import { CascadingAudioStore } from "../stores/cascading-audio-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingAudioContainer extends AudioContainer {
    @property({ type: AudioSource })
    listStoppableSFXSource: AudioSource[] = [];

    @render(CascadingAudioStore, (store) => store.stoppableSFXList)
    handleStoppableSFXList(data: gc.Audios.AudioData[]) {
        data.forEach((item, index) => {
            if (item.action === gc.Audios.AudioAction.PLAY && this.isUserGesture) {
                this.playStoppableSFX(item.id, this.listStoppableSFXSource[index]);
            } else {
                this.stopAudio(this.listStoppableSFXSource[index]);
            }
        });
    }

    async playStoppableSFX(id: string, audioSource: AudioSource) {
        this.playAudio(
            id,
            (clip, isPlay) => {
                if (isPlay === this.isPlaySFX) {
                    this.playSourceClip(audioSource, clip);
                }
            },
            this.isPlaySFX
        );
    }
}
