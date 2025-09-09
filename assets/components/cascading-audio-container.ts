import gc from "@sg/game-client-base";
import { _decorator, AudioClip, AudioSource } from "cc";
import { audioManager } from "db://shared-components/game/audios/scripts/audio-manager";
import { AudioContainer } from "db://shared-components/game/audios/scripts/component/audio-container";
import Observer from "observer";
import { CascadingUIStore } from "../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

@ccclass
export class CascadingAudioContainer extends AudioContainer {
    @property({ type: AudioSource })
    listStoppableSFXSource: AudioSource[] = [];

    @property({ type: AudioSource })
    listSFXSource: AudioSource[] = [];

    @property
    multipleMusicSources = 2;

    protected musicSources: AudioSource[] = [];
    protected musicSourcesState: { [key: string]: string } = {};

    private readonly stoppableIdSources: Array<string | null> = [];
    private readonly sfxIdSources: Array<string | null> = [];

    onLoad() {
        this.initMusicSources();
        this.initializeAudioSourceStates();
        super.onLoad();
    }

    initMusicSources() {
        for (let i = 0; i < this.multipleMusicSources; i++) {
            const musicSource = i == 0 ? this.musicSource : this.musicSource.addComponent(AudioSource);
            this.musicSources.push(musicSource);
            this.musicSourcesState[i] = "";
        }
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

    @render(CascadingUIStore, (store) => store.turnOnBGM)
    turnOnBGM(turnOnBGM: boolean) {
        if (turnOnBGM) {
            this.updateVolumeMusicSource(1, 0.3);
        }
    }

    @render(CascadingUIStore, (store) => store.turnOffBGM)
    turnOffBGM(turnOffBGM: boolean) {
        if (turnOffBGM) {
            this.updateVolumeMusicSource(0.1, 0.3);
        }
    }

    @render(CascadingUIStore, (store) => store.fadeBGM, { fireImmediately: false })
    fadeBGM(fadeBGM: { value: boolean }) {
        if (fadeBGM) {
            const volume = fadeBGM.value ? 1 : 0.1;
            this.updateVolumeMusicSource(volume, 0.3);
        }
    }

    playMusic(data: gc.Audios.AudioData) {
        if (data) {
            if (data.action === gc.Audios.AudioAction.PLAY) {
                this.playMusicAudio(data.id);
            } else if (data.action === gc.Audios.AudioAction.STOP) {
                this.stopMusicAudio(data.id);
            }
        }
    }

    protected stopMusicAudio(id: string) {
        const sourceId = Object.keys(this.musicSourcesState).find((key) => this.musicSourcesState[key] === id);
        if (sourceId) {
            this.stopAudio(this.musicSources[+sourceId]);
            this.musicSourcesState[sourceId] = "";
        }
    }

    protected stopAllMusic() {
        //TODO: stop others music sources
        this.musicSources.forEach((source, index) => {
            this.stopAudio(source);
            this.musicSourcesState[index] = "";
        });
    }

    protected getAvailableMusicSource(): number {
        return Object.keys(this.musicSourcesState).findIndex((key) => +key > 0 && this.musicSourcesState[key] === "");
    }

    protected handlePlayMusic(id: string, isPlay: boolean, clip: AudioClip) {
        if (isPlay !== this.isPlayMusic) {
            return;
        }

        const sourceId = this.getMusicSourceId(id);
        const source = this.musicSources[sourceId];
        this.playSourceClip(source, clip);
    }

    private getMusicSourceId(id: string) {
        const audioConfigs = audioManager?.audioConfigs;
        const config = audioConfigs[id];
        return config?.isMusicGame ? 0 : this.getAvailableMusicSource();
    }
}
