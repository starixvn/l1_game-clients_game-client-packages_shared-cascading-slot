import gc from "@sg/game-client-base";
import inversify from "inversify";
import { CascadingAudioStore } from "../stores/cascading-audio-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingAudioHandlers extends gc.Audios.AudioHandler {
    @inject(CascadingAudioStore) protected readonly cascadingAudioStore: CascadingAudioStore;

    playStoppableSFX(audioId: string) {
        if (this.userSettingsStore.sfxEnable) {
            this.cascadingAudioStore.stoppableSFXList = [
                ...this.cascadingAudioStore.stoppableSFXList,
                { id: audioId, action: gc.Audios.AudioAction.PLAY },
            ];
        }
    }

    stopStoppableSFX(audioId: string) {
        this.cascadingAudioStore.stoppableSFXList = [
            ...this.cascadingAudioStore.stoppableSFXList,
            { id: audioId, action: gc.Audios.AudioAction.PLAY },
        ];
    }
}
