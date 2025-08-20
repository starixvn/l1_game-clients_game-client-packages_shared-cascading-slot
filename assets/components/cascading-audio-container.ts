import gc from "@sg/game-client-base";
import { _decorator, AudioSource } from "cc";
import { AudioContainer } from "db://shared-components/game/audios/scripts/component/audio-container";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingAudioContainer extends AudioContainer {
    @property({ type: AudioSource })
    listStoppableSFXSource: AudioSource[] = [];

    private countStoppableSFX = 0;
    private activeAudioSources: Map<string, number> = new Map(); // Map audioId to source index

    // @render(CascadingAudioStore, (store) => store.stoppableSFXList)
    // handleStoppableSFXList(data: gc.Audios.AudioData[]) {
    //     data.forEach((item, index) => {
    //         if (item.action === gc.Audios.AudioAction.PLAY && this.isUserGesture) {
    //             this.playStoppableSFX(item.id, this.listStoppableSFXSource[index]);
    //         } else {
    //             this.stopAudio(this.listStoppableSFXSource[index]);
    //         }
    //     });
    // }

    @render(gc.Audios.AudioStore, (store) => store.stoppableSFX)
    handleStoppableSFX(data: gc.Audios.AudioData) {
        if (!data) return;

        if (data.action === gc.Audios.AudioAction.PLAY && this.isUserGesture) {
            // Find available audio source index
            let audioIndex = this.activeAudioSources.get(data.id);

            if (!audioIndex && this.listStoppableSFXSource.length >= this.countStoppableSFX) {
                audioIndex = this.countStoppableSFX;
                this.activeAudioSources.set(data.id, audioIndex);
                this.playStoppableSFX(data.id, this.listStoppableSFXSource[audioIndex]);
                this.countStoppableSFX++;
            }
        } else {
            // Find and stop the audio source for this audioId
            const audioIndex = this.activeAudioSources.get(data.id);
            this.stopAudio(this.listStoppableSFXSource[audioIndex]);
            this.activeAudioSources.delete(data.id);
        }
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
