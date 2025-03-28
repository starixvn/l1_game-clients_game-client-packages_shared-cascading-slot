import gc from "@sg/game-client-base";
import { _decorator, Component, Label, Sprite, SpriteAtlas } from "cc";
import { SCATTER_SYMBOL } from "db://shared-cascading-slot/cascading-slot-utils";
import Observer from "observer";
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

    @property(SpriteAtlas)
    mainAtlas: SpriteAtlas = null;

    protected prefixSymbol = "symbol-";

    onLoad() {
        super.onLoad();
    }

    setData(icon: number, count: number, win: number) {
        this.numberIcon.string = count.toString();
        this.winningValue.string = gc.FormatUtils.numberWithCommas(win, 2, false);
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${icon}`);
    }

    setDataForFreeSpinTumble(count: number, win: number, freeSpin: boolean) {
        const freeSpinTxt = freeSpin ? `extraFreeSpin` : `freeSpin`;
        this.numberIcon.string = count.toString();
        this.winningValue.string = win.toString() + ` ${gc.Translator.gameTranslate(freeSpinTxt)}`;
        this.symbol.spriteFrame = this.mainAtlas.getSpriteFrame(`${this.prefixSymbol}${SCATTER_SYMBOL}`);
    }
}
