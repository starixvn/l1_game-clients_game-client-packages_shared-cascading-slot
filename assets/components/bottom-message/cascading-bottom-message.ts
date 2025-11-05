import gc from "@sg/game-client-base";
import { _decorator, Color, RichText, sys } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { resourcesCache, SlotNotification } from "../../cascading-slot-utils";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingBottomMessage extends ObserverComponent {
    @property(RichText)
    msgRichText: RichText = null;

    highlightColor: string;
    private isTurboMode = false;
    private isTrialMode = false;
    private colorConfig: any;
    private state = "";
    private roundsAutoplay = 0;
    private freespinCountMsgBottom = 0;
    onLoad() {
        cascadingSlotLogger.info("CascadingBottomMessage: onLoad called");
        this.colorConfig = resourcesCache.colorJson;
        cascadingSlotLogger.info("CascadingBottomMessage: colorConfig initialized", this.colorConfig);
        this.highlightColor = this.colorConfig.noticeHighlightTextColor;
        cascadingSlotLogger.info("CascadingBottomMessage: highlightColor set", this.highlightColor);
        this.msgRichText.fontColor = new Color().fromHEX(this.colorConfig.noticeTextColor);
        cascadingSlotLogger.info("CascadingBottomMessage: fontColor set", this.colorConfig.noticeTextColor);
        super.onLoad();
    }

    updateMessageContent(msg: string) {
        cascadingSlotLogger.info("CascadingBottomMessage: updateMessageContent called with msg", msg);
        this.msgRichText.string = msg.toUpperCase();
        cascadingSlotLogger.info("CascadingBottomMessage: message updated to", this.msgRichText.string);
    }

    protected showFreeSpinCount(amount: number) {
        cascadingSlotLogger.info("CascadingBottomMessage: showFreeSpinCount called with amount", amount);
        const amountFormatting = `<color=${this.highlightColor}>${amount}</color>`;
        cascadingSlotLogger.info("CascadingBottomMessage: amountFormatting", amountFormatting);
        const msg = gc.Translator.gameTranslate(`free_spin_left_amount`).toUpperCase();
        cascadingSlotLogger.info("CascadingBottomMessage: translated message", msg);
        this.msgRichText.string = msg.replace(/%{amount}/i, amountFormatting);
        cascadingSlotLogger.info("CascadingBottomMessage: final message", this.msgRichText.string);
    }

    protected showAutoSpinCount(autoSpinCount: number) {
        cascadingSlotLogger.info("CascadingBottomMessage: showAutoSpinCount called with autoSpinCount", autoSpinCount);
        const msg = gc.Translator.gameTranslate(`auto_spin_left`);
        cascadingSlotLogger.info("CascadingBottomMessage: translated auto spin message", msg);
        this.updateMessageContent(`${msg} ${autoSpinCount}`);
    }

    @render(CascadingUIStore, (store) => store.bottomMessageState)
    renderBottomMessage(bottomMessageState: string) {
        cascadingSlotLogger.info("CascadingBottomMessage: renderBottomMessage called with state", bottomMessageState);
        this.state = bottomMessageState;
        this.updateMessage();
    }

    updateMessage() {
        cascadingSlotLogger.info("CascadingBottomMessage: updateMessage called with state", this.state);
        switch (this.state) {
            case SlotNotification.BEFORE_SPIN:
                cascadingSlotLogger.info("CascadingBottomMessage: handling BEFORE_SPIN state");
                this.handleMessageBeforeSpin();
                break;
            case SlotNotification.BEFORE_SPIN_TRIAL:
                cascadingSlotLogger.info("CascadingBottomMessage: handling BEFORE_SPIN_TRIAL state");
                this.handleMessageSettled();
                break;
            case SlotNotification.SPINNING:
                cascadingSlotLogger.info("CascadingBottomMessage: handling SPINNING state");
                this.updateMessageContent(gc.Translator.gameTranslate(`round_settle_msg`));
                break;
            case SlotNotification.SETTLED:
                cascadingSlotLogger.info("CascadingBottomMessage: handling SETTLED state");
                this.handleMessageSettled();
                break;
            case SlotNotification.TUMBLE_WIN:
                cascadingSlotLogger.info("CascadingBottomMessage: handling TUMBLE_WIN state");
                this.updateMessageContent(gc.Translator.gameTranslate(`win_tumble_msg`));
                break;
            case SlotNotification.AUTO_SPIN:
                cascadingSlotLogger.info("CascadingBottomMessage: handling AUTO_SPIN state");
                this.showAutoSpinCount(this.roundsAutoplay);
                break;
            case SlotNotification.FREESPINS:
                cascadingSlotLogger.info("CascadingBottomMessage: handling FREESPINS state");
                this.showFreeSpinCount(this.freespinCountMsgBottom);
                break;
            default:
                cascadingSlotLogger.info("CascadingBottomMessage: unknown state", this.state);
                break;
        }
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(turboMode: boolean) {
        this.isTurboMode = turboMode;
    }

    handleMessageBeforeSpin() {
        const deviceSuffix = sys.isMobile ? "phone" : "desktop";
        this.updateMessageContent(gc.Translator.gameTranslate(`show_msg_when_spin_${deviceSuffix}`));
    }

    handleMessageSettled() {
        const index = this.randomMsgIndex();
        this.updateMessageContent(gc.Translator.gameTranslate(`from_settle_to_spin${index}`));
    }

    randomMsgIndex() {
        if (this.isTurboMode || this.isTrialMode) {
            return random(1, 2);
        }
        return random(1, 3);
    }

    @render(CascadingUIStore, (store) => store.freespinCountMsgBottom)
    setFreeSpinsCount(freespinCountMsgBottom: number) {
        this.freespinCountMsgBottom = freespinCountMsgBottom;
        this.updateMessage();
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    setRoundsAutoplayMsg(roundsAutoplay: number) {
        this.roundsAutoplay = roundsAutoplay;
        this.updateMessage();
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    setTrialMode(isTrialMode: boolean) {
        this.isTrialMode = isTrialMode;
    }
}



