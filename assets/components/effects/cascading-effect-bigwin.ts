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
import { cascadingSlotLogger } from "../../cascading-slot-logger";

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
    private isTurboMode = false;
    private tweenBigWin: Tween<Node> = null;
    private tweenDelay = null;

    private skipClickCount = 0;
    private readonly MAX_SKIP_CLICK_COUNT = 2;
    private bigWinRange = [];

    setAmount(data: BigWinType) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAmount called", {
            data,
            amount: data.amount,
            duration: data.duration ?? 0,
            delayTime: data.delayTime ?? 0,
            noZeroSuffix: data.noZeroSuffix ?? false,
            hasLblWinAmount: !!this.lblWinAmount,
            willStartTween: true,
            timestamp: new Date().toISOString()
        });

        const { amount } = data;
        const duration = data.duration ?? 0;
        const delayTime = data.delayTime ?? 0;
        const noZeroSuffix = data.noZeroSuffix ?? false;

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Starting tween animation", {
            amount,
            duration,
            delayTime,
            noZeroSuffix,
            willDelay: delayTime > 0,
            willAnimate: duration > 0,
            timestamp: new Date().toISOString()
        });

        tween(this.lblWinAmount.node)
            .delay(delayTime)
            .call(() => {
                cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Tween callback executed", {
                    willFloatToNumber: true,
                    amount,
                    duration,
                    noZeroSuffix,
                    timestamp: new Date().toISOString()
                });
                AnimationUtils.floatToNumber({ label: this.lblWinAmount, amount, duration, noZeroSuffix: noZeroSuffix });
            })
            .start();

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Tween started", {
            timestamp: new Date().toISOString()
        });
    }

    async changeFrameForBigWinLevel(betWin: number, totalBet: number) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] changeFrameForBigWinLevel called", {
            betWin,
            totalBet,
            willSkipIfZeroBet: totalBet === 0,
            willCheckThresholds: totalBet > 0,
            timestamp: new Date().toISOString()
        });

        if (totalBet === 0) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Skipping change frame - total bet is zero", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const { isMega, isSuper } = this.checkBigWinThresholds(betWin, totalBet);
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Thresholds checked", {
            isMega,
            isSuper,
            willChangeToSuper: isSuper && this.isChangeLevelSuper,
            willChangeToMega: !isSuper && isMega && this.isChangeLevelMega,
            willChangeToBig: !isSuper && !isMega && this.isChangeLevelBig,
            timestamp: new Date().toISOString()
        });

        if (isSuper) {
            this.isChangeLevelSuper && this.setAnimationChangeSuper();
        } else if (isMega) {
            this.isChangeLevelMega && this.setAnimationChangeMega();
        } else {
            this.isChangeLevelBig && this.setAnimationChangeBig();
        }

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] changeFrameForBigWinLevel completed", {
            betWin,
            totalBet,
            timestamp: new Date().toISOString()
        });
    }

    handleLogBigWinRange(superThreshold: number, megaThreshold: number) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] handleLogBigWinRange called", {
            superThreshold,
            megaThreshold,
            bigWinRange: this.bigWinRange,
            superIsNumber: typeof superThreshold === "number",
            megaIsNumber: typeof megaThreshold === "number",
            willLogWarning: !(typeof superThreshold === "number" && typeof megaThreshold === "number"),
            timestamp: new Date().toISOString()
        });

        if (typeof superThreshold !== "number" || typeof megaThreshold !== "number") {
            cascadingSlotLogger.info("[bigWinRange] is not a number", {
                bigWinRange: this.bigWinRange,
            });
        }
    }

    private checkBigWinThresholds(betWin: number, totalBet: number) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] checkBigWinThresholds called", {
            betWin,
            totalBet,
            willSkipIfZeroBet: totalBet === 0,
            willCalculateRatio: totalBet > 0,
            bigWinRange: this.bigWinRange,
            timestamp: new Date().toISOString()
        });

        if (totalBet === 0) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Returning false thresholds - total bet is zero", {
                timestamp: new Date().toISOString()
            });
            return { isMega: false, isSuper: false };
        }

        const valueRatio = betWin / totalBet;
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Value ratio calculated", {
            betWin,
            totalBet,
            valueRatio,
            timestamp: new Date().toISOString()
        });

        const megaThreshold = +this.bigWinRange?.[1];
        const superThreshold = +this.bigWinRange?.[2];
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Thresholds extracted", {
            megaThreshold,
            superThreshold,
            bigWinRange: this.bigWinRange,
            timestamp: new Date().toISOString()
        });

        this.handleLogBigWinRange(superThreshold, megaThreshold);

        const isSuper = valueRatio >= superThreshold;
        const isMega = valueRatio >= megaThreshold && !isSuper;

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Threshold results", {
            valueRatio,
            megaThreshold,
            superThreshold,
            isSuper,
            isMega,
            timestamp: new Date().toISOString()
        });

        return { isMega, isSuper };
    }

    showHideBigWinNode(show: boolean) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] showHideBigWinNode called", {
            show,
            hasNodeBigWin: !!this.nodeBigWin,
            currentActive: this.nodeBigWin?.active,
            willSetActive: !!this.nodeBigWin,
            timestamp: new Date().toISOString()
        });

        this.nodeBigWin && (this.nodeBigWin.active = show);

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Big win node visibility set", {
            show,
            finalActive: this.nodeBigWin?.active,
            timestamp: new Date().toISOString()
        });
    }

    async setAnimationChangeSuper() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAnimationChangeSuper called", {
            isChangeLevelSuper: this.isChangeLevelSuper,
            willPlaySound: true,
            willSetFlag: true,
            willChangeLevelAnimation: this.isChangeLevelSuper,
            timestamp: new Date().toISOString()
        });

        this.playSound(AudioIds.SUPER_WIN);
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Super win sound played", {
            timestamp: new Date().toISOString()
        });

        this.isChangeLevelSuper = false;
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Super change level flag set to false", {
            timestamp: new Date().toISOString()
        });

        await this.changeLevelAnimation(this.mainSpine, "hide", this.superWinPrefab);

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAnimationChangeSuper completed", {
            timestamp: new Date().toISOString()
        });
    }

    async setAnimationChangeMega() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAnimationChangeMega called", {
            isChangeLevelMega: this.isChangeLevelMega,
            willPlaySound: true,
            willSetFlag: true,
            willChangeLevelAnimation: this.isChangeLevelMega,
            timestamp: new Date().toISOString()
        });

        this.playSound(AudioIds.MEGA_WIN);
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Mega win sound played", {
            timestamp: new Date().toISOString()
        });

        this.isChangeLevelMega = false;
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Mega change level flag set to false", {
            timestamp: new Date().toISOString()
        });

        await this.changeLevelAnimation(this.mainSpine, "hide", this.megaWinPrefab);

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAnimationChangeMega completed", {
            timestamp: new Date().toISOString()
        });
    }

    async setAnimationChangeBig() {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] setAnimationChangeBig called", {
            isChangeLevelBig: this.isChangeLevelBig,
            willPlaySound: true,
            willSetFlag: true,
            timestamp: new Date().toISOString()
        });

        this.playSound(AudioIds.BIG_WIN);
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Big win sound played", {
            timestamp: new Date().toISOString()
        });

        this.isChangeLevelBig = false;
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Big change level flag set to false", {
            timestamp: new Date().toISOString()
        });
    }

    async changeLevelAnimation(skeleton: sp.Skeleton, animation: string, levelPrefab: Prefab) {
        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] changeLevelAnimation called", {
            hasSkeleton: !!skeleton,
            animation,
            hasLevelPrefab: !!levelPrefab,
            willSetAnimation: true,
            willCheckDuration: true,
            willInstantiate: true,
            willManageChildren: true,
            timestamp: new Date().toISOString()
        });

        try {
            skeleton.setAnimation(0, animation, false);
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Animation set on skeleton", {
                animation,
                loop: false,
                track: 0,
                timestamp: new Date().toISOString()
            });

            const duration = skeleton.findAnimation(animation)?.duration || 0;
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Animation duration checked", {
                duration,
                willDelay: duration > 0,
                willHideNode: duration > 0,
                timestamp: new Date().toISOString()
            });

            if (duration > 0) {
                await AnimationUtils.delayTime(0.1);
                cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Delay completed, hiding big win node", {
                    timestamp: new Date().toISOString()
                });
                this.showHideBigWinNode(false);
            }

            const node = instantiate(levelPrefab);
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Level prefab instantiated", {
                hasNode: !!node,
                nodeName: node?.name,
                timestamp: new Date().toISOString()
            });

            this.changeLevel.removeAllChildren();
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Change level children removed", {
                timestamp: new Date().toISOString()
            });

            this.changeLevel.addChild(node);
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] New level node added", {
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] Error in changeLevelAnimation", {
                error,
                animation,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_EFFECT_BIGWIN] changeLevelAnimation completed", {
            animation,
            timestamp: new Date().toISOString()
        });
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
        if (this.skipClickCount > 1 || (this.skipClickCount === 1 && this.isTurboMode)) {
            this.setBigWinCompleted(completed);
            return;
        }

        this.tweenBigWin?.stop();
        this.winAmountForNoAnim(this.winAmount);
        !this.isTurboMode && this.stopSoundCoinIncrement();
        this.scheduleOnce(() => this.playSound(AudioIds.WINCOUNT_STOP), 0.1);
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

    setBigWinRange(bigWinRange: number[]) {
        this.bigWinRange = bigWinRange;
    }
}



