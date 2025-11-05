import gc from "@sg/game-client-base";
import { _decorator, AudioClip, AudioSource } from "cc";
import { audioManager } from "db://shared-components/game/audios/scripts/audio-manager";
import { AudioContainer } from "db://shared-components/game/audios/scripts/component/audio-container";
import Observer from "observer";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";

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
        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] onLoad called", {
            multipleMusicSources: this.multipleMusicSources,
            listStoppableSFXSourceCount: this.listStoppableSFXSource?.length,
            listSFXSourceCount: this.listSFXSource?.length,
            timestamp: new Date().toISOString()
        });

        this.initMusicSources();
        this.initializeAudioSourceStates();
        super.onLoad();

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] onLoad completed", {
            musicSourcesInitialized: this.musicSources?.length,
            stoppableIdSourcesLength: this.stoppableIdSources?.length,
            sfxIdSourcesLength: this.sfxIdSources?.length,
            timestamp: new Date().toISOString()
        });
    }

    initMusicSources() {
        for (let i = 0; i < this.multipleMusicSources; i++) {
            const musicSource = i === 0 ? this.musicSource : this.musicSource.addComponent(AudioSource);
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

    playSFX(data: gc.Audios.AudioData) {
        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] playSFX called", {
            data,
            hasData: !!data,
            audioId: data?.id,
            action: data?.action,
            isUserGesture: this.isUserGesture,
            timestamp: new Date().toISOString()
        });

        if (!data) {
            cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] No audio data, returning early", {
                timestamp: new Date().toISOString()
            });
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
            cascadingSlotLogger.warn(`No available audio source for SFX: ${data.id}`);
            cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] No available audio source", {
                audioId: data.id,
                availableSources: this.sfxIdSources.filter(id => id === null).length,
                totalSources: this.sfxIdSources.length,
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] Found available source", {
            audioId: data.id,
            sourceIndex,
            willPlay: data.action === gc.Audios.AudioAction.PLAY && this.isUserGesture,
            timestamp: new Date().toISOString()
        });

        if (data.action === gc.Audios.AudioAction.PLAY && this.isUserGesture) {
            this.playOneShotAudio(data.id, this.listSFXSource[sourceIndex]);
        }

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] playSFX completed", {
            audioId: data.id,
            played: data.action === gc.Audios.AudioAction.PLAY && this.isUserGesture,
            timestamp: new Date().toISOString()
        });
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
        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] handleStoppableSFX called", {
            data,
            hasData: !!data,
            audioId: data?.id,
            action: data?.action,
            timestamp: new Date().toISOString()
        });

        if (!data) {
            cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] No audio data, returning early", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] Processing stoppable SFX action", {
            audioId: data.id,
            action: data.action,
            timestamp: new Date().toISOString()
        });

        switch (data.action) {
            case gc.Audios.AudioAction.PLAY:
                this.handlePlayAction(data);
                break;
            case gc.Audios.AudioAction.STOP:
                this.handleStopAction(data);
                break;
        }

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] handleStoppableSFX completed", {
            audioId: data.id,
            action: data.action,
            timestamp: new Date().toISOString()
        });
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
            cascadingSlotLogger.warn(`No available audio source for stoppable SFX: ${data.id}`);
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

    @render(CascadingUIStore, (store) => store.fadeBGM)
    fadeBGM(fadeBGM: { value: boolean }) {
        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] fadeBGM called", {
            fadeBGM,
            hasFadeBGM: !!fadeBGM,
            fadeValue: fadeBGM?.value,
            timestamp: new Date().toISOString()
        });

        if (fadeBGM) {
            const volume = fadeBGM.value ? 1 : 0.1;
            cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] Updating music volume", {
                targetVolume: volume,
                fadeDuration: 0.3,
                isFadeIn: fadeBGM.value,
                timestamp: new Date().toISOString()
            });
            this.updateVolumeMusicSource(volume, 0.3);
        }

        cascadingSlotLogger.info("[CASCADING_AUDIO_CONTAINER] fadeBGM completed", {
            volumeUpdated: !!fadeBGM,
            timestamp: new Date().toISOString()
        });
    }

    playMusic(data: gc.Audios.AudioData) {
        if (data) {
            if (data.action === gc.Audios.AudioAction.PLAY) {
                this.playMusicAudio(data);
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
        this.musicSources.forEach((source, index) => {
            this.stopAudio(source);
            this.musicSourcesState[index] = "";
        });
    }

    protected getAvailableMusicSource(): number {
        return Object.keys(this.musicSourcesState).findIndex((key) => +key > 0 && this.musicSourcesState[key] === "");
    }

    protected handlePlayMusic(data: gc.Audios.AudioData, isPlay: boolean, clip: AudioClip) {
        if (isPlay !== this.isPlayMusic) {
            return;
        }

        const sourceId = this.getMusicSourceId(data.id);
        if (sourceId < 0) {
            return;
        }
        const source = this.musicSources[sourceId];

        if (sourceId > 0) {
            source.loop = data.loop;
        }
        this.musicSourcesState[sourceId] = data.id;
        this.playSourceClip(source, clip);
    }

    private getMusicSourceId(id: string) {
        const audioConfigs = audioManager?.audioConfigs;
        const config = audioConfigs[id];
        return config?.isMusicGame ? 0 : this.getAvailableMusicSource();
    }
}




