import { _decorator, sp } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { globalEmitter, resourcesCache, SlotClientEvent } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;

export enum AnimationNameMascot {
    idle = "idle",
    transition = "transition",
}

@ccclass
export class CascadingMascot extends ObserverComponent {
    @property(sp.Skeleton)
    spineMascot: sp.Skeleton = null;

    private gameConfig: any;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_MASCOT] onLoad called", {
            hasSpineMascot: !!this.spineMascot,
            hasGameConfig: !!this.gameConfig,
            willPlayIdleAnimation: true,
            willLoadGameConfig: true,
            willCallSuperOnLoad: true,
            willRegisterEventListener: true,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Idle animation started", {
            animation: "idle",
            loop: true,
            timestamp: new Date().toISOString()
        });

        this.gameConfig = resourcesCache.gameFeatures;
        cascadingSlotLogger.info("[CASCADING_MASCOT] Game config loaded", {
            hasGameConfig: !!this.gameConfig,
            effectIntroMultiplier: this.gameConfig?.effectIntroMultiplier,
            turnOnEventMascot: this.gameConfig?.turnOnEventMascot,
            turnOnMultiplierMascot: this.gameConfig?.turnOnMultiplierMascot,
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_MASCOT] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        if (this.gameConfig.effectIntroMultiplier) {
            globalEmitter.on(SlotClientEvent.EFFECT_INTRO_MULTIPLIER, this.playAnimMultiplierLand, this);
            cascadingSlotLogger.info("[CASCADING_MASCOT] Event listener registered for EFFECT_INTRO_MULTIPLIER", {
                event: SlotClientEvent.EFFECT_INTRO_MULTIPLIER,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Skipping event listener registration - effectIntroMultiplier disabled", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_MASCOT] onLoad completed", {
            timestamp: new Date().toISOString()
        });
    }

    private settingMixDuration() {
        const mixDuration = 0.3;
        cascadingSlotLogger.info("[CASCADING_MASCOT] settingMixDuration called", {
            mixDuration,
            hasSpineMascot: !!this.spineMascot,
            hasGameConfig: !!this.gameConfig,
            freespinAnimationName: this.gameConfig?.freespinMascotAnimationName,
            bigWinAnimationName: this.gameConfig?.bigWinMascotAnimationName,
            multiplierAnimationName: this.gameConfig?.multiplierMascotAnimationName,
            willSetMixes: true,
            timestamp: new Date().toISOString()
        });

        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.freespinMascotAnimationName, mixDuration);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Mix set for freespin animation", {
            from: AnimationNameMascot.idle,
            to: this.gameConfig.freespinMascotAnimationName,
            duration: mixDuration,
            timestamp: new Date().toISOString()
        });

        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.bigWinMascotAnimationName, mixDuration);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Mix set for big win animation", {
            from: AnimationNameMascot.idle,
            to: this.gameConfig.bigWinMascotAnimationName,
            duration: mixDuration,
            timestamp: new Date().toISOString()
        });

        this.spineMascot.setMix(AnimationNameMascot.idle, this.gameConfig.multiplierMascotAnimationName, mixDuration);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Mix set for multiplier animation", {
            from: AnimationNameMascot.idle,
            to: this.gameConfig.multiplierMascotAnimationName,
            duration: mixDuration,
            timestamp: new Date().toISOString()
        });
    }

    async handleAnimTransition(anim: string) {
        cascadingSlotLogger.info("[CASCADING_MASCOT] handleAnimTransition called", {
            anim,
            hasSpineMascot: !!this.spineMascot,
            willCheckIfPlaying: true,
            willPlayAnimation: true,
            willReturnToIdle: true,
            timestamp: new Date().toISOString()
        });

        const isPlayingAnim = AnimationUtils.isAnimationPlaying(this.spineMascot, anim);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Animation playing check", {
            anim,
            isPlayingAnim,
            willSkipIfPlaying: isPlayingAnim,
            timestamp: new Date().toISOString()
        });

        if (isPlayingAnim) {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Skipping animation transition - already playing", {
                anim,
                timestamp: new Date().toISOString()
            });
            return;
        }

        await AnimationUtils.playSpine(this.spineMascot, anim, false);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Transition animation played", {
            anim,
            loop: false,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.playSpine(this.spineMascot, "idle", true);
        cascadingSlotLogger.info("[CASCADING_MASCOT] Returned to idle animation", {
            animation: "idle",
            loop: true,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_MASCOT] handleAnimTransition completed", {
            anim,
            timestamp: new Date().toISOString()
        });
    }

    async playAnimFreespin() {
        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimFreespin called", {
            freespinAnimationName: this.gameConfig?.freespinMascotAnimationName,
            hasGameConfig: !!this.gameConfig,
            willHandleTransition: true,
            timestamp: new Date().toISOString()
        });

        await this.handleAnimTransition(this.gameConfig.freespinMascotAnimationName);

        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimFreespin completed", {
            timestamp: new Date().toISOString()
        });
    }

    async playAnimBigwin() {
        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimBigwin called", {
            bigWinAnimationName: this.gameConfig?.bigWinMascotAnimationName,
            hasGameConfig: !!this.gameConfig,
            willHandleTransition: true,
            timestamp: new Date().toISOString()
        });

        await this.handleAnimTransition(this.gameConfig.bigWinMascotAnimationName);

        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimBigwin completed", {
            timestamp: new Date().toISOString()
        });
    }

    async playAnimMultiplier() {
        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimMultiplier called", {
            multiplierAnimationName: this.gameConfig?.multiplierMascotAnimationName,
            hasGameConfig: !!this.gameConfig,
            willHandleTransition: true,
            timestamp: new Date().toISOString()
        });

        await this.handleAnimTransition(this.gameConfig.multiplierMascotAnimationName);

        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimMultiplier completed", {
            timestamp: new Date().toISOString()
        });
    }

    async playAnimMultiplierLand() {
        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimMultiplierLand called", {
            multiplierLandAnimationName: this.gameConfig?.multiplierLandMascotAnimationName,
            hasMultiplierLandAnimation: !!this.gameConfig?.multiplierLandMascotAnimationName,
            willHandleTransition: !!this.gameConfig?.multiplierLandMascotAnimationName,
            timestamp: new Date().toISOString()
        });

        this.gameConfig.multiplierLandMascotAnimationName &&
            (await this.handleAnimTransition(this.gameConfig?.multiplierLandMascotAnimationName));

        cascadingSlotLogger.info("[CASCADING_MASCOT] playAnimMultiplierLand completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isShowFreeSpinEffect)
    async showAnimFreeSpin(isShowFreeSpinEffect: boolean) {
        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimFreeSpin called", {
            isShowFreeSpinEffect,
            turnOnEventMascot: this.gameConfig?.turnOnEventMascot,
            willSkipIfDisabled: !this.gameConfig?.turnOnEventMascot,
            willPlayAnimation: isShowFreeSpinEffect && this.gameConfig?.turnOnEventMascot,
            timestamp: new Date().toISOString()
        });

        if (!this.gameConfig.turnOnEventMascot) {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Skipping freespin animation - event mascot disabled", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        isShowFreeSpinEffect && (await this.playAnimFreespin());

        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimFreeSpin completed", {
            isShowFreeSpinEffect,
            animationPlayed: isShowFreeSpinEffect,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.haveBigWin)
    async showAnimBigWin(haveBigWin: boolean) {
        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimBigWin called", {
            haveBigWin,
            turnOnEventMascot: this.gameConfig?.turnOnEventMascot,
            willSkipIfDisabled: !this.gameConfig?.turnOnEventMascot,
            willPlayAnimation: haveBigWin && this.gameConfig?.turnOnEventMascot,
            timestamp: new Date().toISOString()
        });

        if (!this.gameConfig.turnOnEventMascot) {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Skipping big win animation - event mascot disabled", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        haveBigWin && (await this.playAnimBigwin());

        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimBigWin completed", {
            haveBigWin,
            animationPlayed: haveBigWin,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.triggerWinMultiplier, { fireImmediately: false })
    showAnimMultiplier(triggerWinMultiplier: any) {
        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimMultiplier called", {
            triggerWinMultiplier,
            turnOnMultiplierMascot: this.gameConfig?.turnOnMultiplierMascot,
            willPlayAnimation: triggerWinMultiplier && this.gameConfig?.turnOnMultiplierMascot,
            timestamp: new Date().toISOString()
        });

        if (triggerWinMultiplier && this.gameConfig.turnOnMultiplierMascot) {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Playing multiplier animation", {
                timestamp: new Date().toISOString()
            });
            this.playAnimMultiplier();
        } else {
            cascadingSlotLogger.info("[CASCADING_MASCOT] Skipping multiplier animation", {
                triggerWinMultiplier,
                turnOnMultiplierMascot: this.gameConfig?.turnOnMultiplierMascot,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_MASCOT] showAnimMultiplier completed", {
            triggerWinMultiplier,
            animationPlayed: triggerWinMultiplier && this.gameConfig?.turnOnMultiplierMascot,
            timestamp: new Date().toISOString()
        });
    }
}




