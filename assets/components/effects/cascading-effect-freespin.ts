import { _decorator, Button, Label } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingEffectFreespin extends ObserverComponent {
    @property(Label)
    lblFreeSpinCount: Label = null;

    freeSpinsCount = 0;
    private isTurboMode = false;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] onLoad called", {
            hasLblFreeSpinCount: !!this.lblFreeSpinCount,
            freeSpinsCount: this.freeSpinsCount,
            isTurboMode: this.isTurboMode,
            willInitButtonSkip: true,
            willCallSuperOnLoad: true,
            timestamp: new Date().toISOString()
        });

        this.initButtonSkip();
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Button skip initialized", {
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] onLoad completed", {
            freeSpinsCount: this.freeSpinsCount,
            isTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });
    }

    initButtonSkip() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] initButtonSkip called", {
            hasNode: !!this.node,
            willGetButtonComponent: true,
            willAddClickListener: true,
            timestamp: new Date().toISOString()
        });

        let button = this.node.getComponent(Button);
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Button component retrieved", {
            hasExistingButton: !!button,
            willAddComponent: !button,
            timestamp: new Date().toISOString()
        });

        if (!button) {
            button = this.node.addComponent(Button);
            cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Button component added", {
                timestamp: new Date().toISOString()
            });
        }

        button.node.on(Button.EventType.CLICK, () => {
            cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Skip button clicked", {
                willCallSkipToContinue: true,
                timestamp: new Date().toISOString()
            });
            this.skipToContinue();
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Click event listener added", {
            timestamp: new Date().toISOString()
        });
    }

    skipToContinue() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] skipToContinue called", {
            willPlayClickSound: true,
            willStopStinger: true,
            willSetCompleted: true,
            willHandleBonus: true,
            timestamp: new Date().toISOString()
        });

        AudioUtils.playClick();
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Click sound played", {
            timestamp: new Date().toISOString()
        });

        AudioUtils.stopStoppableSFX(AudioIds.STINGER_FREESPIN_WIN);
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Freespin win stinger stopped", {
            stingerId: AudioIds.STINGER_FREESPIN_WIN,
            timestamp: new Date().toISOString()
        });

        this.setFreeSpinEffectCompleted(true);
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Freespin effect marked as completed", {
            timestamp: new Date().toISOString()
        });

        this.handleTriggerDuringFreeSpinBonus();
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Free spin bonus triggered", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    setFreeSpinEffectCompleted(completed: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] setFreeSpinEffectCompleted called", {
            completed,
            willReturnCompleted: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] setFreeSpinEffectCompleted returning", {
            completed,
            timestamp: new Date().toISOString()
        });

        return completed;
    }

    @handle(CascadingUIHandler, (handler) => handler.handleTriggerDuringFreeSpinBonus())
    handleTriggerDuringFreeSpinBonus() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] handleTriggerDuringFreeSpinBonus called", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] handleTriggerDuringFreeSpinBonus completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.freeSpinsByRound)
    renderFreeSpinsCount(freeSpinsCount: number) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] renderFreeSpinsCount called", {
            freeSpinsCount,
            previousFreeSpinsCount: this.freeSpinsCount,
            hasLblFreeSpinCount: !!this.lblFreeSpinCount,
            willUpdateCount: true,
            willUpdateLabel: !!this.lblFreeSpinCount,
            timestamp: new Date().toISOString()
        });

        this.freeSpinsCount = freeSpinsCount;
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Free spins count updated", {
            freeSpinsCount: this.freeSpinsCount,
            timestamp: new Date().toISOString()
        });

        this.lblFreeSpinCount.string = this.freeSpinsCount.toString();
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Free spins label updated", {
            labelText: this.lblFreeSpinCount.string,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] renderTurboMode called", {
            isTurboMode,
            previousIsTurboMode: this.isTurboMode,
            willUpdateTurboMode: true,
            timestamp: new Date().toISOString()
        });

        this.isTurboMode = isTurboMode;

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] Turbo mode updated", {
            newIsTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] handleFadeBGM called", {
            fadeBGM,
            willReturnFadeBGM: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_EFFECT_FREESPIN] handleFadeBGM returning", {
            fadeBGM,
            timestamp: new Date().toISOString()
        });

        return fadeBGM;
    }
}



