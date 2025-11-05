import { _decorator, instantiate, Prefab } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { CascadingWarningMsg } from "./cascading-warning-msg";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass
export class CascadingWarningContainer extends ObserverComponent {
    @property(Prefab)
    prefabWarning: Prefab = null;

    private isTrialMode = false;

    @render(CascadingUIStore, (store) => store.isTurboModeUI, { fireImmediately: false })
    renderTurboModeMsg(isTurboMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] renderTurboModeMsg called", {
            isTurboMode,
            isTrialMode: this.isTrialMode,
            willSkipInTrialMode: this.isTrialMode,
            willAddNode: !this.isTrialMode,
            timestamp: new Date().toISOString()
        });

        if (this.isTrialMode) {
            cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Skipping turbo mode message in trial mode", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const msg = isTurboMode ? gc.Translator.gameTranslate("enable_turbo_mode") : gc.Translator.gameTranslate("disable_turbo_mode");
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Turbo mode message prepared", {
            isTurboMode,
            translatedMessage: msg,
            willAddNode: true,
            timestamp: new Date().toISOString()
        });

        this.addNode(msg);
    }

    @render(CascadingUIStore, (store) => store.showReachMaxWin, { fireImmediately: false })
    renderShowReachMaxWin(showReachMaxWin: boolean) {
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] renderShowReachMaxWin called", {
            showReachMaxWin,
            willAddNode: showReachMaxWin,
            timestamp: new Date().toISOString()
        });

        if (showReachMaxWin) {
            const msg = gc.Translator.gameTranslate("reach_max_win");
            cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Max win message prepared", {
                translatedMessage: msg,
                willAddNode: true,
                timestamp: new Date().toISOString()
            });

            this.addNode(msg);
        } else {
            cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Not showing max win message", {
                timestamp: new Date().toISOString()
            });
        }
    }

    addNode(msg: string) {
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] addNode called", {
            msg,
            hasPrefabWarning: !!this.prefabWarning,
            hasNode: !!this.node,
            willInstantiate: true,
            willGetComponent: true,
            willAddChild: true,
            willSetData: true,
            timestamp: new Date().toISOString()
        });

        const warningNode = instantiate(this.prefabWarning);
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Warning prefab instantiated", {
            hasWarningNode: !!warningNode,
            warningNodeName: warningNode?.name,
            timestamp: new Date().toISOString()
        });

        const comp = warningNode.getComponent(CascadingWarningMsg);
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Warning component retrieved", {
            hasComponent: !!comp,
            timestamp: new Date().toISOString()
        });

        this.node.addChild(warningNode);
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Warning node added as child", {
            timestamp: new Date().toISOString()
        });

        comp.setData(msg);
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Warning data set", {
            message: msg,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] renderTrialMode called", {
            isTrialMode,
            previousIsTrialMode: this.isTrialMode,
            willUpdateTrialMode: true,
            timestamp: new Date().toISOString()
        });

        this.isTrialMode = isTrialMode;

        cascadingSlotLogger.info("[CASCADING_WARNING_CONTAINER] Trial mode updated", {
            newIsTrialMode: this.isTrialMode,
            timestamp: new Date().toISOString()
        });
    }
}




