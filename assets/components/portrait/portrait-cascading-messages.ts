import gc from "@sg/game-client-base";
import { _decorator, Color, macro, RichText, SpriteAtlas } from "cc";
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

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

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
        //const randomIndex = 2;
        const randomIndex = random(this.msgList.length - 1);

        const messageKey = this.msgList[randomIndex];
        if (randomIndex === 3) {
            const textMsg = gc.Translator.gameTranslate(messageKey);
            this.msg.string = textMsg.replace(/%{maxWin}/i, this.maxWinPerRound.toString());
        } else if (randomIndex === 2) {
            const icon = this.mainAtlas.getSpriteFrame("symbol-13");
            const textMsg2a = gc.Translator.gameTranslate("top_message2a");
            const textMsg2b = gc.Translator.gameTranslate("top_message2b");
            this.msg.string = `<img src="symbol-13"/> ${textMsg2a} ${textMsg2b}`.toUpperCase();
        } else {
            this.renderMsg(messageKey);
        }
    }

    renderMsg(msg: string) {
        this.msg.string = gc.Translator.gameTranslate(msg).toUpperCase();
    }

    @render(CascadingUIStore, (store) => store.isHideTopMessage)
    setNodeVisibilityBeforeSpin(isHideTopMessage: boolean) {
        this.node.active = !isHideTopMessage;
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!gameConfigs) {
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
    }
}
