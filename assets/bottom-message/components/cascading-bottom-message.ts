import gc from "@sg/game-client-base";
import { _decorator, Color, JsonAsset, RichText, sys } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { AutoPlayStore } from "../../auto-play/scripts/auto-play-store";
import { SlotNotification } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../main-ui/cascading-ui-handler";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingBottomMessage extends ObserverComponent {
    @property(RichText)
    msgRichText: RichText = null;

    @property(JsonAsset)
    colorInfo: JsonAsset = null;
    highlightColor: string;
    private isTurboMode: boolean = false;
    private bottomMessageState = "";
    private colorConfig: any;

    onLoad() {
        this.colorConfig = this.colorInfo.json;
        super.onLoad();
        this.handleBottomMessage(SlotNotification.BEFORE_SPIN);
    }

    updateMessageContent(msg: string) {
        this.msgRichText.string = msg;
    }

    protected showFreeSpinCount(amount: number) {
        const amountFormatting = `<color=${this.highlightColor}>${amount}</color>`;
        const msg = gc.Translator.gameTranslate(`free_spin_left_amount`);
        this.msgRichText.fontColor = new Color().fromHEX(this.colorConfig.noticeTextColor);
        this.highlightColor = this.colorConfig.noticeHighlightTextColor;
        this.msgRichText.string = msg.replace(/%{amount}/i, amountFormatting);
    }

    protected showAutoSpinCount(autoSpinCount: number) {
        const msg = gc.Translator.gameTranslate(`auto_spin_left`);
        this.updateMessageContent(`${msg} ${autoSpinCount}`);
    }

    @render(CascadingUIStore, (store) => store.bottomMessageState)
    renderBottomMessage(bottomMessageState: string) {
        this.bottomMessageState = bottomMessageState;
        console.log("renderBottomMessage", bottomMessageState);
        switch (bottomMessageState) {
            case SlotNotification.BEFORE_SPIN:
                this.handleMessageBeforeSpin();
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
        }
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(turboMode: boolean) {
        this.isTurboMode = turboMode;
    }

    @handle(CascadingUIHandler, (handler, state: string) => handler.handleBottomMessage(state))
    handleBottomMessage(state: string) {
        return state;
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
        return this.isTurboMode ? random(1, 2) : random(1, 3);
    }

    @render(CascadingUIStore, (store) => store.freeSpinsCount)
    setFreeSpinsCount(freeSpinsCount: number) {
        if (this.bottomMessageState === SlotNotification.FREESPINS) {
            this.showFreeSpinCount(freeSpinsCount);
        }
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    setRoundsAutoplayMsg(roundsAutoplay: number) {
        if (this.bottomMessageState === SlotNotification.AUTO_SPIN) {
            this.showAutoSpinCount(roundsAutoplay);
        }
    }
}
