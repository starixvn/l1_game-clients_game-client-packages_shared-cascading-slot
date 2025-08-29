import gc from "@sg/game-client-base";
import { _decorator, AudioSource } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioContainer } from "db://shared-components/game/audios/scripts/component/audio-container";
import Observer from "observer";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingAudioContainer extends AudioContainer {
    @property({ type: AudioSource })
    listStoppableSFXSource: AudioSource[] = [];

    @property({ type: AudioSource })
    listSFXSource: AudioSource[] = [];

    private readonly stoppableIdSources: Array<string | null> = [];
    private readonly sfxIdSources: Array<string | null> = [];

    onLoad() {
        super.onLoad();
        this.initializeAudioSourceStates();
    }

    private initializeAudioSourceStates() {
        this.stoppableIdSources.length = 0;
        this.sfxIdSources.length = 0;

        for (const _ of this.listStoppableSFXSource) {
            this.stoppableIdSources.push(null);
        }

        for (const _ of this.listSFXSource) {
            this.sfxIdSources.push(null);
        }
    }

    @render(gc.Audios.AudioStore, (store) => store.sfx, { fireImmediately: false })
    playSFX(data: gc.Audios.AudioData) {
        if (!data) {
            return;
        }

        for (let index = 0; index < this.listSFXSource.length; index++) {
            const source = this.listSFXSource[index];
            if (!source.playing) {
                this.sfxIdSources[index] = null;
            }
        }

        const sourceIndex = this.sfxIdSources.findIndex((id) => id === null);
        if (sourceIndex === -1) {
            console.warn(`No available audio source for SFX: ${data.id}`);
            return;
        }

        if (data.action === gc.Audios.AudioAction.PLAY && this.isUserGesture) {
            this.playOneShotAudio(data.id, this.listSFXSource[sourceIndex]);
        }
    }

    async playOneShotAudio(id: string, audioSource: AudioSource) {
        this.playAudio(
            id,
            (clip, isPlay) => {
                if (isPlay === this.isPlaySFX) {
                    audioSource.playOneShot(clip);
                }
            },
            this.isPlaySFX
        );
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
        if (!this.isUserGesture && data.id !== AudioIds.BGM_FREESPIN) {
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
        for (let i = 0; i < this.stoppableIdSources.length; i++) {
            if (this.stoppableIdSources[i] === null) {
                return i;
            }
        }
        return -1; // No available sources
    }

    private playAudioWithSource(audioId: string, sourceIndex: number) {
        this.stoppableIdSources[sourceIndex] = audioId;
        this.playStoppableSFX(audioId, this.listStoppableSFXSource[sourceIndex]);
    }

    private stopAudioWithSource(audioId: string, sourceIndex: number) {
        this.stopAudio(this.listStoppableSFXSource[sourceIndex]);
        this.stoppableIdSources[sourceIndex] = null;
    }

    private findSourceIndexByAudioId(audioId: string): number {
        for (let i = 0; i < this.stoppableIdSources.length; i++) {
            if (this.stoppableIdSources[i] === audioId) {
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

    @render(gc.UserSettings.UserSettingStore, (store) => store.musicEnable, { fireImmediately: false })
    enableMusic(musicEnable: boolean) {
        super.enableMusic(musicEnable);
        const sourceIndex = this.findSourceIndexByAudioId(AudioIds.BGM_FREESPIN);
        if (sourceIndex === -1) {
            return;
        }
        if (!musicEnable) {
            this.listStoppableSFXSource[sourceIndex].pause();
        } else {
            this.playAudioWithSource(AudioIds.BGM_FREESPIN, sourceIndex);
        }
    }
}
