import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";

import { AnimationUtils } from "db://shared-components/shared/utils/utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";

const { ccclass, property, requireComponent } = _decorator;
const { render } = Observer;
@ccclass("CascadingVolatilityLabel")
export class CascadingVolatilityLabel extends ObserverComponent {
    @property(Label)
    label: Label = null;

    onLoad() {
        AnimationUtils.setOpacityNode(this.node, 1);
        super.onLoad();
        this.node.active = false;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameInfo)
    renderGameInfo(gameInfo: GameServiceMessageCascading.GameInfoMsg) {
        if (!gameInfo) {
            return;
        }
        const volatility = gameInfo.volatility;
        this.node.active = volatility > 0;
        this.updateVolatility(volatility);
    }

    updateVolatility(volatility: number) {
        if (!this.label) {
            return;
        }
        AnimationUtils.fadeIn(this.node, 0.3);
        const suffix = this.getVolatilitySuffix(volatility);
        const key = `cascadingslot.volatility_${suffix}`;
        this.label.string = gc.Translator.gameTranslate(key).toUpperCase();
    }

    private getVolatilitySuffix(volatility: number) {
        switch (volatility) {
            case 1:
            case 2:
                return "low";
            case 3:
                return "medium";
            default:
                return "high";
        }
    }
}
