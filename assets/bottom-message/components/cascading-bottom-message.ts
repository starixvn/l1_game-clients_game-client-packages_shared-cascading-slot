import gc from "@sg/game-client-base";
import { _decorator, Color, RichText, sys } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { random } from "lodash-es";
import Observer from "observer";
import { SlotNotification } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../main-ui/cascading-ui-handler";
import { CascadingUIStore } from "../../main-ui/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingBottomMessage extends ObserverComponent {
    @property(RichText)
    msgRichText: RichText = null;

    highlightColor: string;
    private isTurboMode: boolean = false;

    onLoad() {
        super.onLoad();
        this.handleBottomMessage(SlotNotification.BEFORE_SPIN);
    }

    updateMessageContent(msg: string) {
        this.msgRichText.string = msg;
    }

    protected showFreeSpinCount(amount: number) {
        const amountFormatting = `<color=${this.highlightColor}>${amount}</color>`;
        const msg = gc.Translator.gameTranslate(`free_spin_left_amount`).toUpperCase();
        this.msgRichText.string = msg.replace(`%{amount}`.toUpperCase(), amountFormatting);
    }

    updateColor(textColor: string, highlightColor: string) {
        this.msgRichText.fontColor = new Color().fromHEX(textColor);
        this.highlightColor = highlightColor;
    }

    @render(CascadingUIStore, (store) => store.bottomMessageState)
    renderBottomMessage(bottomMessageState: string) {
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
                this.updateMessageContent(gc.Translator.gameTranslate(`tumble_win_msg`));
                break;
            case SlotNotification.FREESPINS:
                //this.showFreeSpinCount();
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
        const index = this.randomMsgIndex;
        this.updateMessageContent(gc.Translator.gameTranslate(`from_settle_to_spin_${index}`).toUpperCase());
    }

    randomMsgIndex() {
        return this.isTurboMode ? random(1, 2) : random(1, 3);
    }
}
