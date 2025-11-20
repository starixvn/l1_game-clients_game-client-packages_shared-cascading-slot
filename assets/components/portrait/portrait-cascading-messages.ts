import gc from "@sg/game-client-base";
import { _decorator, Color, macro, RichText, SpriteAtlas, sys, UIOpacity } from "cc";
import { AutoScrollingContent } from "db://shared-components/shared/common-components/auto-scrolling/auto-scrolling-content";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "../../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingMessages extends ObserverComponent {
    @property(RichText)
    msg: RichText = null;

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

    msgList = [
        "show_msg_when_spin_desktop",
        "show_msg_when_spin_phone",
        "top_message1",
        "top_message2",
        "top_message3",
        "msg_random_multipliers",
        "msg_free_spins",
    ];

    private colorConfig: ColorJson;
    private maxWinPerRound: number;
    private autoScrollingContent: AutoScrollingContent;
    protected filterKeys = [];
    protected currentKeyIndex = 0;

    onLoad() {
        this.autoScrollingContent = this.getComponent(AutoScrollingContent);
        this.colorConfig = resourcesCache.colorJson;
        this.updateFilterKeys();
        super.onLoad();
        this.msg.getComponent(RichText).fontColor = new Color().fromHEX(this.colorConfig.topMessageTextColor);
    }

    updateTopMessage() {
        const options = {
            maxWin: this.maxWinPerRound,
        };

        const index = this.currentKeyIndex % this.filterKeys.length;
        this.currentKeyIndex++;
        if (this.filterKeys[index].includes("top_message2")) {
            const textMsg2a = gc.Translator.gameTranslate("top_message2a");
            const textMsg2b = gc.Translator.gameTranslate("top_message2b");
            this.renderMsg(`${textMsg2a} ${this.renderImgForRichText()} ${textMsg2b}`);
            return;
        }
        const msg = gc.Translator.t(`cascadingslot.${this.filterKeys[index]}`, options);

        this.renderMsg(msg);
    }

    renderMsg(msg: string) {
        this.node.getComponent(UIOpacity).opacity = 0;
        AnimationUtils.fadeIn(this.node, 0.3);
        this.msg.string = msg;
        this.onTextChange();
    }

    onTextChange() {
        if (this.autoScrollingContent) {
            this.autoScrollingContent.updateScrolling();
        }
    }

    @render(CascadingSlotTumblesStore, (store) => store.tumbles)
    setNodeVisibilityBeforeSpin(tumbles: []) {
        const isShow = tumbles.length <= 1;
        if (isShow) {
            AnimationUtils.fadeInAndActivate(this.node, 0.3);
        }
    }

    @render(CascadingUIStore, (store) => store.isShowMessages)
    setNodeVisibility(isShowMessages: boolean) {
        if (isShowMessages === false) {
            this.node.active = false;
        }
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        if (!gameConfigs) {
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
    }

    @render(CascadingUIStore, (store) => store.excludeFirstMsgInGame)
    renderExcludeFirstMsgInGame(excludeFirstMsgInGame: boolean) {
        this.updateFilterKeys(excludeFirstMsgInGame);
    }

    private updateFilterKeys(excludeFirstMsgInGame = false) {
        const ignoreKey = !sys.isMobile ? "phone" : "desktop";
        const keys = this.msgList.filter((key) => !key.includes(ignoreKey));
        this.filterKeys = excludeFirstMsgInGame ? keys.slice(1) : keys;
    }

    renderImgForRichText() {
        return `<img src="symbol-13"  />`;
    }

    @render(CascadingUIStore, (store) => store.totalWin)
    renderTotalWin(totalWin: number) {
        if (totalWin <= 0) {
            // Fix to pass the first time render for initialize values
            setTimeout(() => this.updateTopMessage(), 200);
            this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
        } else {
            this.unschedule(this.updateTopMessage);
        }
    }
}
