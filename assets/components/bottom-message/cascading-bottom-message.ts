import gc from "@sg/game-client-base";
import { _decorator, Color, JsonAsset, RichText, sys } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { SlotNotification } from "../../cascading-slot-utils";
import { AutoPlayStore } from "../../stores/auto-play-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingBottomMessage extends ObserverComponent {
    @property(RichText)
    msgRichText: RichText = null;

    @property(JsonAsset)
    colorInfo: JsonAsset = null;
    highlightColor: string;
    private isTurboMode = false;
    private isTrialMode = false;
    private colorConfig: any;
    private state = "";
    private roundsAutoplay = 0;
    private freespinCountMsgBottom = 0;
    onLoad() {
        this.colorConfig = this.colorInfo.json;
        this.highlightColor = this.colorConfig.noticeHighlightTextColor;
        this.msgRichText.fontColor = new Color().fromHEX(this.colorConfig.noticeTextColor);
        super.onLoad();
    }

    updateMessageContent(msg: string) {
        this.msgRichText.string = msg.toUpperCase();
    }

    protected showFreeSpinCount(amount: number) {
        const amountFormatting = `<color=${this.highlightColor}>${amount}</color>`;
        const msg = gc.Translator.gameTranslate(`free_spin_left_amount`).toUpperCase();
        this.msgRichText.string = msg.replace(/%{amount}/i, amountFormatting);
    }

    protected showAutoSpinCount(autoSpinCount: number) {
        const msg = gc.Translator.gameTranslate(`auto_spin_left`);
        this.updateMessageContent(`${msg} ${autoSpinCount}`);
    }

    @render(CascadingUIStore, (store) => store.bottomMessageState)
    renderBottomMessage(bottomMessageState: string) {
        this.state = bottomMessageState;
        this.updateMessage();
    }

    updateMessage() {
        switch (this.state) {
            case SlotNotification.BEFORE_SPIN:
                this.handleMessageBeforeSpin();
                break;
            case SlotNotification.BEFORE_SPIN_TRIAL:
                this.handleMessageSettled();
                break;
            case SlotNotification.SPINNING:
                this.updateMessageContent(gc.Translator.gameTranslate(`round_settle_msg`));
                break;
            case SlotNotification.SETTLED:
                this.handleMessageSettled();
                break;
            case SlotNotification.TUMBLE_WIN:
                this.updateMessageContent(gc.Translator.gameTranslate(`win_tumble_msg`));
                break;
            case SlotNotification.AUTO_SPIN:
                this.showAutoSpinCount(this.roundsAutoplay);
                break;
            case SlotNotification.FREESPINS:
                this.showFreeSpinCount(this.freespinCountMsgBottom);
                break;
            default:
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
