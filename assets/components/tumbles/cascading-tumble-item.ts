import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Sprite, SpriteAtlas } from "cc";
import { SpecialSymbol } from "db://shared-cascading-slot/cascading-slot-utils";
import Observer from "observer";
import { FreeSpinData } from "../bet-history/bet-details/cascading-ticket-detail-item";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class CascadingTumbleItem extends Component {
    @property(Label)
    numberIcon: Label = null;

    @property(Sprite)
    symbol: Sprite = null;

    @property(Label)
    winningValue: Label = null;

    @property(Label)
    scatterPayout: Label = null;

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

    protected prefixSymbol = "symbol-";

    setData(icon: number, count: number, win: number) {
        cascadingSlotLogger.info(`[CascadingTumbleItem] setData called with icon: ${icon}, count: ${count}, win: ${win}`);
        this.numberIcon.string = count.toString();
        this.winningValue.string = gc.FormatUtils.numberWithCommas(win, 2, false);
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${icon}`);
        cascadingSlotLogger.info(`[CascadingTumbleItem] Set numberIcon: ${this.numberIcon.string}, winningValue: ${this.winningValue.string}`);
    }

    setDataForFreeSpinTumble(data: FreeSpinData) {
        cascadingSlotLogger.info(`[CascadingTumbleItem] setDataForFreeSpinTumble called with data:`, data);
        if (data.win > 0 && this.scatterPayout) {
            this.scatterPayout.node.active = true;
            this.scatterPayout.string = gc.FormatUtils.numberWithCommas(data.win, 2, false);
            cascadingSlotLogger.info(`[CascadingTumbleItem] Set scatter payout: ${this.scatterPayout.string}`);
        }
        const freeSpinTxt = data.extraFreeSpin ? "extra_free_spin" : "free_spin";
        cascadingSlotLogger.info(`[CascadingTumbleItem] Free spin text key: ${freeSpinTxt}`);
        this.numberIcon.string = data.count.toString();
        this.winningValue.string = data.odds.toString() + ` ${gc.Translator.gameTranslate(freeSpinTxt)}`;
        this.winningValue.node.active = data.odds > 0;
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${SpecialSymbol.SCATTER_SYMBOL}`);
        cascadingSlotLogger.info(`[CascadingTumbleItem] Set numberIcon: ${this.numberIcon.string}, winningValue: ${this.winningValue.string}, winningValue active: ${this.winningValue.node.active}`);
    }
}
