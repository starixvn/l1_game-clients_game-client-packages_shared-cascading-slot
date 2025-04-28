import gc from "@sg/game-client-base";
import { _decorator, instantiate, JsonAsset, Node, Prefab } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
import Observer from "observer";
import { UNIT_SECOND_SPIN } from "../../cascading-slot-base-configs";
import { getCustomDuration } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { CascadingMascot } from "../cascading-mascot";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectGameContainer extends ObserverComponent {
    @property(Prefab)
    pfbEffectFreespin: Prefab = null;

    @property(Prefab)
    pfbEffectBigWin: Prefab = null;

    @property(Prefab)
    pfbEffectTransition: Prefab = null;

    @property(Node)
    nodeMascot: Node = null;

    @property(JsonAsset)
    gameInfo: JsonAsset = null;

    private isTurboMode = false;
    private gameConfig: any;

    private readonly Sound = {
        FREE_SPIN_SOUND: "free_spin",
        BIG_WIN_SOUND: "big_win",
        INCREMENT: "increment",
        INCREMENT_END: "increment_stop",
        TRANSITION: "transition",
    };

    onLoad() {
        super.onLoad();
        this.gameConfig = this.gameInfo.json;
        this.node.destroyAllChildren();
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async freeSpinEffectVisibility(isShowFreeSpinEffect: boolean) {
        if (!isShowFreeSpinEffect) {
            this.node.destroyAllChildren();
            return;
        }
        await this.playEffectEventMascot();
        await this.playEffectTransition();
        this.playSound(this.Sound.FREE_SPIN_SOUND);
        const freespin = instantiate(this.pfbEffectFreespin);
        this.node.addChild(freespin);
        const duration = getCustomDuration("freeSpin", this.isTurboMode);
        await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
        freespin.destroy();
        this.setFreeSpinEffectCompleted(true);
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async renderBigWinEffect(isShowBigWin: boolean) {
        if (!isShowBigWin) {
            this.node.destroyAllChildren();
            return;
        }
        await this.playEffectEventMascot();
        await this.playEffectTransition();
        this.playSoundBigWin();

        this.playSound(this.Sound.INCREMENT);
        const bigwin = instantiate(this.pfbEffectBigWin);
        this.node.addChild(bigwin);
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    setFreeSpinEffectCompleted(completed: boolean) {
        return completed;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, audioId: string) => handle.playStoppableSFX(audioId))
    playSoundBigWin() {
        return this.Sound.BIG_WIN_SOUND;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopSoundBigWin() {
        return this.Sound.BIG_WIN_SOUND;
    }

    private async playEffectTransition() {
        if (!this.pfbEffectTransition) {
            return null;
        }
        const transition = instantiate(this.pfbEffectTransition);
        this.playSound(this.Sound.TRANSITION);
        this.node.addChild(transition);
        const duration = getCustomDuration("transition", this.isTurboMode);
        await FunctionUtils.delay(duration * UNIT_SECOND_SPIN);
        transition.destroy();
    }

    private async playEffectEventMascot() {
        if (!this.nodeMascot || !this.gameConfig.turnOnEventMascot) {
            return null;
        }
        const comp = this.nodeMascot.getComponent(CascadingMascot);
        await comp.playAnimEventGame();
    }
}
