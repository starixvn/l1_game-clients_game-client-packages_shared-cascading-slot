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

    private readonly activeAudioSources: Map<string, number> = new Map(); // Map audioId to source index
    private readonly availableSourceIndices: number[] = [];

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
        if (!this.isUserGesture) {
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
        const sourceIndex = this.activeAudioSources.get(data.id);
        if (sourceIndex !== undefined) {
            this.stopAudioWithSource(data.id, sourceIndex);
        }
    }

    private isAudioPlaying(audioId: string): boolean {
        return this.activeAudioSources.has(audioId);
    }

    private getAvailableSourceIndex(): number {
        // First try to get from pool
        if (this.availableSourceIndices.length > 0) {
            return this.availableSourceIndices.pop();
        }

        // Then find unused index
        if (this.activeAudioSources.size < this.listStoppableSFXSource.length) {
            return this.findFirstUnusedSourceIndex();
        }

        return -1; // No available sources
    }

    private playAudioWithSource(audioId: string, sourceIndex: number) {
        this.activeAudioSources.set(audioId, sourceIndex);
        this.playStoppableSFX(audioId, this.listStoppableSFXSource[sourceIndex]);
    }

    private stopAudioWithSource(audioId: string, sourceIndex: number) {
        this.stopAudio(this.listStoppableSFXSource[sourceIndex]);
        this.activeAudioSources.delete(audioId);
        this.availableSourceIndices.push(sourceIndex);
    }

    private findFirstUnusedSourceIndex(): number {
        const usedIndices = new Set(this.activeAudioSources.values());
        for (let i = 0; i < this.listStoppableSFXSource.length; i++) {
            if (!usedIndices.has(i)) {
                return i;
            }
        }
        return -1; // No unused index found
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
