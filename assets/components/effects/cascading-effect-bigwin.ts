import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab, sp, Tween, tween } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { getCustomDuration } from "../../cascading-slot-utils";
import { CascadingUIHandler } from "../../handlers/cascading-ui-handler";
import { BetControlStore } from "../../stores/bet-control-store";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

interface BigWinType {
    amount: number;
    duration?: number;
    delayTime?: number;
    noZeroSuffix?: boolean;
}

@ccclass
export class CascadingEffectBigwin extends ObserverComponent {
    @property(Label)
    lblWinAmount: Label = null;

    @property(Prefab)
    megaWinPrefab: Prefab = null;

    @property(Prefab)
    superWinPrefab: Prefab = null;

    @property(sp.Skeleton)
    mainSpine: sp.Skeleton = null;

    @property(Node)
    changeLevel: Node = null;

    @property(Node)
    nodeBigWin: Node = null;

    winAmount = 0;
    private isChangeLevelSuper = true;
    private isChangeLevelMega = true;
    private totalBet = 0;
    private coinValue = 0;
    private isTurboMode = false;
    private tweenBigWin: Tween<Node> = null;
    private tweenDelay = null;

    private skipClickCount = 0;
    private readonly MAX_SKIP_CLICK_COUNT = 2;

    setAmount(data: BigWinType) {
        const { amount } = data;
        const duration = data.duration ?? 0;
        const delayTime = data.delayTime ?? 0;
        const noZeroSuffix = data.noZeroSuffix ?? false;

        tween(this.lblWinAmount.node)
            .delay(delayTime)
            .call(() => AnimationUtils.floatToNumber({ label: this.lblWinAmount, amount, duration, noZeroSuffix: noZeroSuffix }))
            .start();
    }

    async changeFrameForBigWinLevel(betWin: number, totalBet: number) {
        const valueRatio = betWin / totalBet;
        if (valueRatio >= 6) {
            this.isChangeLevelSuper && this.setAnimationChangeSuper();
        } else if (valueRatio >= 3) {
            this.isChangeLevelMega && this.setAnimationChangeMega();
        }
    }

    showHideBigWinNode(show: boolean) {
        this.nodeBigWin.active = show;
    }

    async setAnimationChangeSuper() {
        this.isChangeLevelSuper = false;
        this.playSound(AudioIds.SUPER_WIN);
        await this.changeLevelAnimation(this.mainSpine, "hide", this.superWinPrefab);
    }

    async setAnimationChangeMega() {
        this.isChangeLevelMega = false;
        this.playSound(AudioIds.MEGA_WIN);
        await this.changeLevelAnimation(this.mainSpine, "hide", this.megaWinPrefab);
    }

    async changeLevelAnimation(skeleton: sp.Skeleton, animation: string, levelPrefab: Prefab) {
        try {
            skeleton.setAnimation(0, animation, false);
            const duration = skeleton.findAnimation(animation)?.duration || 0;
            if (duration > 0) {
                await AnimationUtils.delayTime(0.1);
                this.showHideBigWinNode(false);
            }
            const node = instantiate(levelPrefab);
            this.changeLevel.removeAllChildren();
            this.changeLevel.addChild(node);
        } catch (error) {}
    }

    floatNumberBigWin(opt: { label: Label; amount: number; start?: number; totalBet?: number; coinValue?: number }) {
        const { label, amount: end, start, totalBet, coinValue } = opt;
        const prefixStr = "";
        const defaultFormater = (v) => gc.FormatUtils.numberWithCommas(v, 2, false);
        const formatNumber = defaultFormater;
        const stepValue = parseFloat(this.calculateStepValue(coinValue));
        const stepTime = 0.05;
        const startStr = label.string.replace(prefixStr, "");
        const startValue = start || parseFloat(startStr.replace(/,/g, "")) || 0;
        const range = Math.abs(end - startValue);

        if (!range) {
            return;
        }

        const repeatCount = Math.floor(range / stepValue);

        let value = startValue;

        const formatText = (value) => prefixStr + formatNumber(value);
        this.tweenBigWin = tween(label.node)
            .repeat(
                repeatCount,
                tween(label.node)
                    .call(() => {
                        label.string = formatText(value);
                        value += stepValue;

                        this.changeFrameForBigWinLevel(value, totalBet);
                    })
                    .delay(stepTime)
            )
            .call(() => {
                label.string = formatText(end);
                this.handleBigWinActions(true);
                this.playSound(AudioIds.WINCOUNT_STOP);
                this.stopSoundCoinIncrement();
            })
            .start();
    }

    private calculateStepValue(coinValue: number) {
        const stringArr = coinValue.toString().split(".");
        const integr = stringArr[0];
        const decimal = stringArr[1];

        if (stringArr.length > 1) {
            if (decimal.length > 2) {
                return coinValue.toString();
            }
            let coin = "0.";
            for (let i = 0; i < decimal.length - 1; i++) {
                coin += "0";
            }
            return coin + "1";
        } else {
            let coin = "1";
            for (let i = 0; i < integr.length - 1; i++) {
                coin += "0";
            }
            return coin;
        }
    }

    private winAmountForNoAnim(betWin: number) {
        this.changeFrameForBigWinLevel(betWin, this.totalBet);
        this.setAmount({ amount: betWin });
    }

    @render(BetControlStore, (store) => store.totalBet)
    private updateTotalBet(totalBet: number) {
        this.totalBet = totalBet;
    }

    @render(BetControlStore, (store) => store.coinValue)
    setCoinValue(coinValue: number) {
        this.coinValue = coinValue;
    }

    skipTouchToContinue() {
        this.skipClickCount++;
        if (this.skipClickCount > this.MAX_SKIP_CLICK_COUNT) {
            return;
        }
        this.handleBigWinActions(true);
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }

    @render(CascadingUIStore, (store) => store.bigWinAmount)
    handleBigWinAmount(win: number) {
        if (win <= 0) {
            return;
        }
        this.winAmount = win;
        if (this.isTurboMode) {
            this.winAmountForNoAnim(this.winAmount);
            const ratio = this.winAmount / this.totalBet;
            this.showHideBigWinNode(ratio < 3);
            this.handleBigWinActions(true);
        } else {
            this.floatNumberBigWin({
                label: this.lblWinAmount,
                amount: this.winAmount,
                totalBet: this.totalBet,
                coinValue: this.coinValue,
            });
        }
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleBigWinCompleted(completed))
    setBigWinCompleted(completed: boolean) {
        this.handleFadeBGM(completed);
        return completed;
    }

    handleBigWinActions(completed: boolean) {
        this.tweenDelay?.stop();

        if (this.skipClickCount > 1 || (this.skipClickCount === 1 && this.isTurboMode)) {
            this.setBigWinCompleted(completed);
            return;
        }

        this.tweenBigWin?.stop();
        this.winAmountForNoAnim(this.winAmount);
        !this.isTurboMode && this.stopSoundCoinIncrement();
        this.playSound(AudioIds.WINCOUNT_STOP);
        AudioUtils.stopStoppableSFX(AudioIds.STINGER_WINCOUNT);

        const duration = getCustomDuration("bigWin", this.isTurboMode);
        this.tweenDelay = tween({})
            .delay(duration)
            .call(() => {
                this.setBigWinCompleted(completed);
            })
            .start();
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.stopStoppableSFX(id))
    stopSoundCoinIncrement() {
        return AudioIds.WINCOUNT_INCREMENT;
    }

    @handle(CascadingUIHandler, (handler, fadeBGM: boolean) => handler.handleFadeBGM(fadeBGM))
    handleFadeBGM(fadeBGM: boolean) {
        return fadeBGM;
    }
}
