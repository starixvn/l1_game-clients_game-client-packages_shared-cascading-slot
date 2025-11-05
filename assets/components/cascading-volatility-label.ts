import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property, requireComponent } = _decorator;
const { render } = Observer;
@ccclass("CascadingVolatilityLabel")
export class CascadingVolatilityLabel extends ObserverComponent {
    @property(Label)
    label: Label = null;

    onLoad() {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] onLoad called", {
            hasLabel: !!this.label,
            hasNode: !!this.node,
            willSetOpacity: true,
            willCallSuperOnLoad: true,
            willDeactivateNode: true,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.setOpacityNode(this.node, 1);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Node opacity set to 1", {
            timestamp: new Date().toISOString()
        });

        super.onLoad();
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] super.onLoad() completed", {
            timestamp: new Date().toISOString()
        });

        this.node.active = false;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Node deactivated", {
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] onLoad completed", {
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameInfo)
    renderGameInfo(gameInfo: GameServiceMessageCascading.GameInfoMsg) {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] renderGameInfo called", {
            hasGameInfo: !!gameInfo,
            gameInfoVolatility: gameInfo?.volatility,
            willSkipIfNoGameInfo: !gameInfo,
            willSetActive: !!gameInfo,
            willUpdateVolatility: !!gameInfo,
            timestamp: new Date().toISOString()
        });

        if (!gameInfo) {
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Skipping render - no game info", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const volatility = gameInfo.volatility;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Volatility extracted from game info", {
            volatility,
            currentNodeActive: this.node.active,
            willActivateNode: volatility > 0,
            timestamp: new Date().toISOString()
        });

        this.node.active = volatility > 0;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Node activation set", {
            volatility,
            nodeActive: this.node.active,
            timestamp: new Date().toISOString()
        });

        this.updateVolatility(volatility);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Volatility updated", {
            volatility,
            timestamp: new Date().toISOString()
        });
    }

    updateVolatility(volatility: number) {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] updateVolatility called", {
            volatility,
            hasLabel: !!this.label,
            willSkipIfNoLabel: !this.label,
            willFadeIn: !!this.label,
            willGetSuffix: !!this.label,
            willTranslate: !!this.label,
            willSetText: !!this.label,
            timestamp: new Date().toISOString()
        });

        if (!this.label) {
            cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Skipping update - no label available", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        AnimationUtils.fadeIn(this.node, 0.3);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Fade in animation started", {
            duration: 0.3,
            timestamp: new Date().toISOString()
        });

        const suffix = this.getVolatilitySuffix(volatility);
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Volatility suffix determined", {
            volatility,
            suffix,
            timestamp: new Date().toISOString()
        });

        const key = `cascadingslot.volatility_${suffix}`;
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Translation key prepared", {
            key,
            willTranslate: true,
            timestamp: new Date().toISOString()
        });

        this.label.string = gc.Translator.gameTranslate(key).toUpperCase();
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Label text set", {
            key,
            translatedText: this.label.string,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] updateVolatility completed", {
            volatility,
            suffix,
            finalText: this.label.string,
            timestamp: new Date().toISOString()
        });
    }

    private getVolatilitySuffix(volatility: number) {
        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] getVolatilitySuffix called", {
            volatility,
            willDetermineSuffix: true,
            timestamp: new Date().toISOString()
        });

        let suffix: string;
        switch (volatility) {
            case 1:
            case 2:
                suffix = "low";
                cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Low volatility detected", {
                    volatility,
                    suffix,
                    timestamp: new Date().toISOString()
                });
                break;
            case 3:
                suffix = "medium";
                cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] Medium volatility detected", {
                    volatility,
                    suffix,
                    timestamp: new Date().toISOString()
                });
                break;
            default:
                suffix = "high";
                cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] High volatility detected (default)", {
                    volatility,
                    suffix,
                    timestamp: new Date().toISOString()
                });
                break;
        }

        cascadingSlotLogger.info("[CASCADING_VOLATILITY_LABEL] getVolatilitySuffix returning", {
            volatility,
            suffix,
            timestamp: new Date().toISOString()
        });

        return suffix;
    }
}




