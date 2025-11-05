import gc from "@sg/game-client-base";
import { _decorator, Color, macro, RichText, SpriteAtlas, sys, UIOpacity } from "cc";
import { AutoScrollingContent } from "db://shared-components/shared/common-components/auto-scrolling/auto-scrolling-content";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { random } from "lodash-es";
import Observer from "observer";
import { ColorJson, resourcesCache } from "../../cascading-slot-utils";
import { GameServiceMessageCascading } from "../../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../../stores/cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "../../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
    private isAutoSpinOrFreeSpin = false;

    onLoad() {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Component loaded, isAutoSpinOrFreeSpin: ${this.isAutoSpinOrFreeSpin}`);
        this.autoScrollingContent = this.getComponent(AutoScrollingContent);
        this.colorConfig = resourcesCache.colorJson;
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Auto scrolling content found: ${!!this.autoScrollingContent}, color config loaded: ${!!this.colorConfig}`);
        this.renderMsgDefault();
        super.onLoad();
        this.msg.getComponent(RichText).fontColor = new Color().fromHEX(this.colorConfig.topMessageTextColor);
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Set font color to: ${this.colorConfig.topMessageTextColor}`);
    }

    onEnable() {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Component enabled, isAutoSpinOrFreeSpin: ${this.isAutoSpinOrFreeSpin}`);
        if (this.isAutoSpinOrFreeSpin) {
            this.msg.string = "";
            this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 1);
            cascadingSlotLogger.info(`[PortraitCascadingMessages] Scheduled updateTopMessage for auto/free spin mode (delayed start)`);
        } else {
            this.schedule(this.updateTopMessage, 5, macro.REPEAT_FOREVER, 0);
            cascadingSlotLogger.info(`[PortraitCascadingMessages] Scheduled updateTopMessage for normal mode`);
        }
    }

    onDisable() {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Component disabled, unscheduling updateTopMessage`);
        this.unschedule(this.updateTopMessage);
    }

    @render(CascadingUIStore, (store) => store.isAutoSpinOrFreeSpin)
    setIsAutoSpinOrFreeSpin(isAutoSpinOrFreeSpin: boolean) {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] setIsAutoSpinOrFreeSpin updated to: ${isAutoSpinOrFreeSpin}`);
        this.isAutoSpinOrFreeSpin = isAutoSpinOrFreeSpin;
    }

    updateTopMessage() {
        const randomIndex = random(this.msgList.length - 1);
        const messageKey = this.msgList[randomIndex];
        cascadingSlotLogger.info(`[PortraitCascadingMessages] updateTopMessage called, randomIndex: ${randomIndex}, messageKey: ${messageKey}`);

        switch (randomIndex) {
            case 0:
                cascadingSlotLogger.info(`[PortraitCascadingMessages] Rendering default message`);
                this.renderMsgDefault();
                break;
            case 3:
                const textMsg = gc.Translator.gameTranslate(messageKey);
                const replacedMsg = textMsg.replace(/%{maxWin}/i, this.maxWinPerRound.toString());
                cascadingSlotLogger.info(`[PortraitCascadingMessages] Rendering max win message: ${replacedMsg}`);
                this.renderMsg(replacedMsg);
                break;
            case 2:
                const textMsg2a = gc.Translator.gameTranslate("top_message2a");
                const textMsg2b = gc.Translator.gameTranslate("top_message2b");
                const combinedMsg = `${textMsg2a} ${this.renderImgForRichText()} ${textMsg2b}`;
                cascadingSlotLogger.info(`[PortraitCascadingMessages] Rendering message with image: ${combinedMsg}`);
                this.renderMsg(combinedMsg);
                break;
            default:
                const msg = gc.Translator.gameTranslate(messageKey);
                cascadingSlotLogger.info(`[PortraitCascadingMessages] Rendering default message: ${msg}`);
                this.renderMsg(msg);
                break;
        }
    }

    renderMsgDefault() {
        const deviceSuffix = sys.isMobile ? "phone" : "desktop";
        const message = `show_msg_when_spin_${deviceSuffix}`;
        const translatedMsg = gc.Translator.gameTranslate(message);
        cascadingSlotLogger.info(`[PortraitCascadingMessages] renderMsgDefault for device: ${deviceSuffix}, message: ${translatedMsg}`);
        this.renderMsg(translatedMsg);
    }

    renderMsg(msg: string) {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] renderMsg called with message: ${msg}`);
        this.node.getComponent(UIOpacity).opacity = 0;
        AnimationUtils.fadeIn(this.node, 0.3);
        this.msg.string = msg;
        this.onTextChange();
    }

    onTextChange() {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] onTextChange called, has autoScrollingContent: ${!!this.autoScrollingContent}`);
        if (this.autoScrollingContent) {
            this.autoScrollingContent.updateScrolling();
            cascadingSlotLogger.info(`[PortraitCascadingMessages] Updated auto scrolling content`);
        }
    }

    @render(CascadingSlotTumblesStore, (store) => store.tumbles)
    setNodeVisibilityBeforeSpin(tumbles: []) {
        const isShow = tumbles.length <= 1;
        cascadingSlotLogger.info(`[PortraitCascadingMessages] setNodeVisibilityBeforeSpin called, tumbles count: ${tumbles.length}, isShow: ${isShow}`);
        if (isShow) {
            AnimationUtils.fadeInAndActivate(this.node, 0.3);
            cascadingSlotLogger.info(`[PortraitCascadingMessages] Fading in and activating node`);
        } else {
            AnimationUtils.fadeOutAndDeactivate(this.node, 0.3);
            cascadingSlotLogger.info(`[PortraitCascadingMessages] Fading out and deactivating node`);
        }
    }

    @render(CascadingSlotConfigsStore, (store) => store.gameConfigs)
    updateMaxWin(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        cascadingSlotLogger.info(`[PortraitCascadingMessages] updateMaxWin called with gameConfigs:`, gameConfigs);
        if (!gameConfigs) {
            cascadingSlotLogger.info(`[PortraitCascadingMessages] No game configs provided, returning early`);
            return;
        }
        this.maxWinPerRound = gameConfigs.maxWinPerRound;
        cascadingSlotLogger.info(`[PortraitCascadingMessages] Updated maxWinPerRound to: ${this.maxWinPerRound}`);
    }

    renderImgForRichText() {
        const imgTag = `<img src="symbol-13"  />`;
        cascadingSlotLogger.info(`[PortraitCascadingMessages] renderImgForRichText returning: ${imgTag}`);
        return imgTag;
    }
}



