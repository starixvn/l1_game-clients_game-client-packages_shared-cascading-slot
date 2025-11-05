import { _decorator, Color, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";

import { ChangeNodeColor } from "db://shared-components/shared/common-components/change-node-color";
import { LocalizedLabel } from "../../../i18n/assets/LocalizedLabel";
import { resourcesCache } from "../cascading-slot-utils";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render } = Observer;
@ccclass("StandardCascadingBottomArea")
export class CascadingBottomArea extends ObserverComponent {
    @property(Label)
    totalWinLabel: Label = null;

    protected colorConfig: any;

    onLoad(): void {
        cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] onLoad called", {
            hasTotalWinLabel: !!this.totalWinLabel,
            resourcesCacheAvailable: !!resourcesCache,
            timestamp: new Date().toISOString()
        });

        this.colorConfig = resourcesCache.colorJson;
        this.updateColor();
        super.onLoad();

        cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] onLoad completed", {
            colorConfigLoaded: !!this.colorConfig,
            timestamp: new Date().toISOString()
        });
    }
    @render(CascadingUIStore, (store) => store.totalWin)
    async handleSettlement(totalTumbleWin: number) {
        cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] handleSettlement called", {
            totalTumbleWin,
            hasTotalWinLabel: !!this.totalWinLabel,
            isZeroWin: totalTumbleWin === 0,
            timestamp: new Date().toISOString()
        });

        if (!this.totalWinLabel) {
            cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] No total win label, returning early", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (totalTumbleWin === 0) {
            cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] Setting zero win amount", {
                amount: totalTumbleWin,
                timestamp: new Date().toISOString()
            });
            this.totalWinLabel.string = totalTumbleWin.toString();
            return;
        }

        cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] Starting win amount animation", {
            amount: totalTumbleWin,
            duration: 0.5,
            noZeroSuffix: false,
            timestamp: new Date().toISOString()
        });

        AnimationUtils.floatToNumber({ label: this.totalWinLabel, amount: totalTumbleWin, duration: 0.5, noZeroSuffix: false });

        cascadingSlotLogger.info("[CASCADING_BOTTOM_AREA] handleSettlement completed", {
            animationStarted: true,
            timestamp: new Date().toISOString()
        });
    }

    updateColor() {
        this.node.getComponentsInChildren(ChangeNodeColor).forEach((comp) => {
            const labelComp = comp.node.getComponent(Label);
            if (labelComp) {
                comp.updateColor(this.updateColorLabel(comp));
            } else {
                comp.updateColor(this.colorConfig.bottomAreaButtonBorderColor);
            }
        });

        if (this.totalWinLabel) {
            this.totalWinLabel.node.getComponent(Label).color = new Color().fromHEX(this.colorConfig.bottomAreaWinAmountColor);
        }
    }

    updateColorLabel(comp: ChangeNodeColor) {
        return comp.node.getComponent(LocalizedLabel) ? this.colorConfig.bottomAreaTextColor : this.colorConfig.bottomAreaNumberColor;
    }
}




