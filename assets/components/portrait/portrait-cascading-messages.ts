import gc from "@sg/game-client-base";
import { _decorator, Color, macro, RichText } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingMessages extends ObserverComponent {
    @property(RichText)
    msg: RichText = null;

    msgList = ["show_msg_when_spin_desktop", "top_message1", "top_message2", "top_message3", "msg_random_multipliers", "mgs_free_spins"];

    private colorConfig: ColorJson;
    private maxWinPerRound: number;

    // handleMessageBeforeSpin() {
    //     const deviceSuffix = sys.isMobile ? "phone" : "desktop";
    //     this.msg4.string = gc.Translator.gameTranslate(`show_msg_when_spin_${deviceSuffix}`).toUpperCase();
    // }

    onLoad() {
        this.colorConfig = resourcesCache.colorJson;
        this.renderMsg(gc.Translator.gameTranslate("show_msg_when_spin_desktop"));
        this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
        super.onLoad();
        this.msg.getComponent(RichText).fontColor = new Color().fromHEX(this.colorConfig.topMessageTextColor);
    }

    updateTopMessage() {
        const randomIndex = random(this.msgList.length - 1);
        if (randomIndex === 3) {
            this.msg.string = this.msg.string.replace(/%{maxWin}/i, this.maxWinPerRound.toString());
        }
        const messageKey = this.msgList[randomIndex];
        this.renderMsg(messageKey);
    }

    renderMsg(msg: string) {
        this.msg.string = gc.Translator.gameTranslate(msg).toUpperCase();
    }

    @render(CascadingUIStore, (store) => store.isShowMesgBeforeSpinPortrait)
    setNodeVisibilityBeforeSpin(isActive: boolean) {
        this.node.active = isActive;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!gameConfigs) {
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
    }
}
