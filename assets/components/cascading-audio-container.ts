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

    private readonly audioSourceStates: Array<{ audioId: string | null; isAvailable: boolean }> = [];

    onLoad() {
        super.onLoad();
        this.initializeAudioSourceStates();
    }

    private initializeAudioSourceStates() {
        this.audioSourceStates.length = 0;
        for (let i = 0; i < this.listStoppableSFXSource.length; i++) {
            this.audioSourceStates.push({ audioId: null, isAvailable: true });
        }
    }

    @render(gc.Audios.AudioStore, (store) => store.stoppableSFX)
    handleStoppableSFX(data: gc.Audios.AudioData) {
        if (!data) {
            return;
        }

        switch (data.action) {
            case gc.Audios.AudioAction.PLAY:
                this.handlePlayAction(data);
                break;
            case gc.Audios.AudioAction.STOP:
                this.handleStopAction(data);
                break;
        }
    }

    private handlePlayAction(data: gc.Audios.AudioData) {
        if (!this.isUserGesture && data.id !== "transform-freespins") {
            return;
        }

        // Check if audio is already playing
        if (this.isAudioPlaying(data.id)) {
            return;
        }

        // Get available source and play
        const sourceIndex = this.getAvailableSourceIndex();
        if (sourceIndex === -1) {
            console.warn(`No available audio source for stoppable SFX: ${data.id}`);
            return;
        }

        this.playAudioWithSource(data.id, sourceIndex);
    }

    private handleStopAction(data: gc.Audios.AudioData) {
        const sourceIndex = this.findSourceIndexByAudioId(data.id);
        if (sourceIndex !== -1) {
            this.stopAudioWithSource(data.id, sourceIndex);
        }
    }

    private isAudioPlaying(audioId: string): boolean {
        return this.findSourceIndexByAudioId(audioId) !== -1;
    }

    private getAvailableSourceIndex(): number {
        for (let i = 0; i < this.audioSourceStates.length; i++) {
            if (this.audioSourceStates[i].isAvailable) {
                return i;
            }
        }
        return -1; // No available sources
    }

    private playAudioWithSource(audioId: string, sourceIndex: number) {
        this.audioSourceStates[sourceIndex] = { audioId, isAvailable: false };
        this.playStoppableSFX(audioId, this.listStoppableSFXSource[sourceIndex]);
    }

    private stopAudioWithSource(audioId: string, sourceIndex: number) {
        this.stopAudio(this.listStoppableSFXSource[sourceIndex]);
        this.audioSourceStates[sourceIndex] = { audioId: null, isAvailable: true };
    }

    private findSourceIndexByAudioId(audioId: string): number {
        for (let i = 0; i < this.audioSourceStates.length; i++) {
            if (this.audioSourceStates[i].audioId === audioId) {
                return i;
            }
        }
        return -1;
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
