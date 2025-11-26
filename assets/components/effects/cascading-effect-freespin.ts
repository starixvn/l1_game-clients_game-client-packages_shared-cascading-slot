import { _decorator, Button, Label } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { GameSpeed } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectFreespin extends ObserverComponent {
    @property(Label)
    lblFreeSpinCount: Label = null;

    freeSpinsCount = 0;
    private gameSpeed = GameSpeed.NORMAL;

    onLoad() {
        this.initButtonSkip();
        super.onLoad();
        if (this.gameSpeed === GameSpeed.ULTRA) {
            this.scheduleOnce(() => {
                this.setFreeSpinEffectCompleted(true);
            }, 3);
        }
    }

    initButtonSkip() {
        let button = this.node.getComponent(Button);
        if (!button) {
            button = this.node.addComponent(Button);
        }
        button.node.on(Button.EventType.CLICK, () => {
            this.skipToContinue();
        });
    }

    skipToContinue() {
        AudioUtils.playClick();
        AudioUtils.stopStoppableSFX(AudioIds.STINGER_FREESPIN_WIN);
        this.setFreeSpinEffectCompleted(true);
        this.handleTriggerDuringFreeSpinBonus();
    }

    @render(CascadingUIStore, (store) => store.gameSpeed)
    getGameSpeed(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    setFreeSpinEffectCompleted(completed: boolean) {
        return completed;
    }

    @handle(CascadingUIHandler, (handler) => handler.handleTriggerDuringFreeSpinBonus())
    handleTriggerDuringFreeSpinBonus() {}

    @render(CascadingUIStore, (store) => store.freeSpinsByRound)
    renderFreeSpinsCount(freeSpinsCount: number) {
        this.freeSpinsCount = freeSpinsCount;
        this.lblFreeSpinCount.string = this.freeSpinsCount.toString();
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        return fadeBGM;
    }
}
