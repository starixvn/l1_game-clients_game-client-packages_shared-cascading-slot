import gc from "@sg/game-client-base";
import { _decorator, instantiate, Label, Node, Prefab, sp, Tween, tween } from "cc";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { AudioUtils } from "db://shared-components/game/audios/utils";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { AnimationUtils } from "db://shared-components/shared/utils";
import Observer from "observer";
import { GameSpeed, getConfigGameSpeed } from "../../cascading-slot-utils";
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
    private isChangeLevelBig = true;
    private totalBet = 0;
    private coinValue = 0;
    private gameSpeed = GameSpeed.NORMAL;
    private tweenBigWin: Tween<Node> = null;
    private tweenDelay = null;

    private skipClickCount = 0;
    private readonly MAX_SKIP_CLICK_COUNT = 2;
    private bigWinRange = [];

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
        if (totalBet === 0) {
            return;
        }

        const { isMega, isSuper } = this.checkBigWinThresholds(betWin, totalBet);

        if (isSuper) {
            this.isChangeLevelSuper && this.setAnimationChangeSuper();
        } else if (isMega) {
            this.isChangeLevelMega && this.setAnimationChangeMega();
        } else {
            this.isChangeLevelBig && this.setAnimationChangeBig();
        }
    }

    handleLogBigWinRange(superThreshold: number, megaThreshold: number) {
        if (typeof superThreshold !== "number" || typeof megaThreshold !== "number") {
            console.log("[bigWinRange] is not a number", {
                bigWinRange: this.bigWinRange,
            });
        }
    }

    private checkBigWinThresholds(betWin: number, totalBet: number) {
        if (totalBet === 0) {
            return { isMega: false, isSuper: false };
        }
        const valueRatio = betWin / totalBet;

        const megaThreshold = +this.bigWinRange?.[1];
        const superThreshold = +this.bigWinRange?.[2];
        this.handleLogBigWinRange(superThreshold, megaThreshold);

        const isSuper = valueRatio >= superThreshold;
        const isMega = valueRatio >= megaThreshold && !isSuper;

        return { isMega, isSuper };
    }

    showHideBigWinNode(show: boolean) {
        this.nodeBigWin && (this.nodeBigWin.active = show);
    }

    async setAnimationChangeSuper() {
        this.playSound(AudioIds.SUPER_WIN);
        this.isChangeLevelSuper = false;
        await this.changeLevelAnimation(this.mainSpine, "hide", this.superWinPrefab);
    }

    async setAnimationChangeMega() {
        this.playSound(AudioIds.MEGA_WIN);
        this.isChangeLevelMega = false;
        await this.changeLevelAnimation(this.mainSpine, "hide", this.megaWinPrefab);
    }
    async setAnimationChangeBig() {
        this.playSound(AudioIds.BIG_WIN);
        this.isChangeLevelBig = false;
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
        const { isMega, isSuper } = this.checkBigWinThresholds(betWin, this.totalBet);
        if (isMega || isSuper) {
            this.showHideBigWinNode(false);
        }
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

    @render(CascadingUIStore, (store) => store.gameSpeed)
    renderTurboMode(gameSpeed: string) {
        this.gameSpeed = gameSpeed;
    }

    @render(CascadingUIStore, (store) => store.bigWinAmount)
    handleBigWinAmount(win: number) {
        if (win <= 0) {
            return;
        }
        this.winAmount = win;
        if (this.gameSpeed) {
            this.isChangeLevelBig = true;
            this.isChangeLevelSuper = true;
            this.isChangeLevelMega = true;
            this.winAmountForNoAnim(this.winAmount);
            const ratio = this.winAmount / this.totalBet;
            const megaThreshold = this.bigWinRange?.[2];
            const shouldShow = typeof megaThreshold === "number" ? ratio < megaThreshold : true;
            this.showHideBigWinNode(shouldShow);
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
        return completed;
    }

    handleBigWinActions(completed: boolean) {
        this.tweenDelay?.stop();
        const fastSpeed = this.gameSpeed === GameSpeed.ULTRA || this.gameSpeed === GameSpeed.TURBO;
        if (this.skipClickCount > 1 || (this.skipClickCount === 1 && fastSpeed)) {
            this.setBigWinCompleted(completed);
            return;
        }

        this.tweenBigWin?.stop();
        this.winAmountForNoAnim(this.winAmount);
        !fastSpeed && this.stopSoundCoinIncrement();
        this.scheduleOnce(() => this.playSound(AudioIds.WINCOUNT_STOP), 0.1);
        AudioUtils.stopStoppableSFX(AudioIds.STINGER_WINCOUNT);

        const duration = getConfigGameSpeed("bigWin", this.gameSpeed);
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

    setBigWinRange(bigWinRange: number[]) {
        this.bigWinRange = bigWinRange;
    }
}
