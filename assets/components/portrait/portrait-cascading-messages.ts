import gc from "@sg/game-client-base";
import { _decorator, Color, macro, RichText, SpriteAtlas, sys } from "cc";
import { AutoScrollingContent } from "db://shared-components/shared/common-components/auto-scrolling/auto-scrolling-content";
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

    msgList = ["show_msg_when_spin_", "top_message1", "top_message2", "top_message3", "msg_random_multipliers", "msg_free_spins"];

    private colorConfig: ColorJson;
    private maxWinPerRound: number;
    private autoScrollingContent: AutoScrollingContent;

    onLoad() {
        this.autoScrollingContent = this.getComponent(AutoScrollingContent);
        this.colorConfig = resourcesCache.colorJson;
        this.renderMsgDefault();
        this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
        super.onLoad();
        this.msg.getComponent(RichText).fontColor = new Color().fromHEX(this.colorConfig.topMessageTextColor);
    }

    updateTopMessage() {
        const randomIndex = random(this.msgList.length - 1);
        const messageKey = this.msgList[randomIndex];
        switch (randomIndex) {
            case 0:
                this.renderMsgDefault();
                break;
            case 3:
                const textMsg = gc.Translator.gameTranslate(messageKey);
                this.msg.string = textMsg.replace(/%{maxWin}/i, this.maxWinPerRound.toString());
                break;
            case 2:
                const textMsg2a = gc.Translator.gameTranslate("top_message2a");
                const textMsg2b = gc.Translator.gameTranslate("top_message2b");
                this.msg.string = `<img src="symbol-13" /> ${textMsg2a} ${textMsg2b}`;
                break;
            default:
                this.renderMsg(messageKey);
                break;
        }
    }

    renderMsgDefault() {
        const deviceSuffix = sys.isMobile ? "phone" : "desktop";
        const message = `show_msg_when_spin_${deviceSuffix}`;
        this.renderMsg(gc.Translator.gameTranslate(message));
    }

    renderMsg(msg: string) {
        this.msg.string = gc.Translator.gameTranslate(msg);
        this.onTextChange();
    }

    onTextChange() {
        if (this.autoScrollingContent) {
            this.autoScrollingContent.updateScrolling();
        }
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
