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
        this.numberIcon.string = count.toString();
        this.winningValue.string = gc.FormatUtils.numberWithCommas(win, 2, false);
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${icon}`);
    }

    setDataForFreeSpinTumble(data: FreeSpinData) {
        this.scatterPayout.node.active = true;
        this.scatterPayout.string = gc.FormatUtils.numberWithCommas(data.win, 2, false);
        const freeSpinTxt = data.extraFreeSpin ? "extra_free_spin" : "free_spin";
        this.numberIcon.string = data.count.toString();
        this.winningValue.string = data.odds.toString() + ` ${gc.Translator.gameTranslate(freeSpinTxt)}`;
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${SpecialSymbol.SCATTER_SYMBOL}`);
    }
}
