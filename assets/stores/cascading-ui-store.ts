import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";

import { cascadingSlotLogger } from "../cascading-slot-logger";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { DialogName, SlotNotification, SpinButtonState } from "../cascading-slot-utils";
import { AutoPlayStore } from "./auto-play-store";
import { FlashSpinStore } from "./flash-spin-store";
import { CascadingSlotConfigsStore } from "./cascading-slot-configs-store";
import { CascadingSlotTumblesStore } from "./cascading-slot-tumbles-store";
import { HoldActionStore } from "./hold-action-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIStore {
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    @inject(FlashSpinStore) protected readonly flashSpinStore: FlashSpinStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    constructor() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] CascadingUIStore constructor called", {
            autoPlayStoreInjected: !!this.autoPlayStore,
            flashSpinStoreInjected: !!this.flashSpinStore,
            tumblesStoreInjected: !!this.tumblesStore,
            mainPlayerStoreInjected: !!this.mainPlayerStore,
            configsStoreInjected: !!this.configsStore,
            holdActionStoreInjected: !!this.holdActionStore,
            fsbPromotionUIStoreInjected: !!this.fsbPromotionUIStore,
            timestamp: new Date().toISOString()
        });

        mobx.makeAutoObservable(this);

        cascadingSlotLogger.info("[CASCADING_UI_STORE] MobX auto-observable setup completed", {
            timestamp: new Date().toISOString()
        });
    }

    checkToSpinNext = false;
    totalWin = 0;
    isHyperSpinActive = false;
    totalTumbleWin = 0;
    isActualWin = false;

    multiplier = 0;
    totalMultiplier = 0;
    get isShowTotalMultiplierJoinGame() {
        return this.totalMultiplier > 0;
    }

    isTurboModeUI = false;
    isTrialMode = false;

    _cascadingState = CascadingSlotState.NOT_READY_BET;

    _bottomMessageState = SlotNotification.BEFORE_SPIN;
    _spinButtonState = SpinButtonState.IDLE;

    activePeekEffect = false;
    haveBigWin = false;
    bigWinAmount = 0;
    isBigWinCompleted = false;

    highlightScatters = false;
    isHighlightScattersCompleted = false;

    freeSpinsTotal = 0;
    freeSpinsByRound = 0;
    freeSpinsJoinGame = {};
    haveFreeSpin = false;
    isFreeSpinEffectCompleted = false;

    freespinCountMsgBottom = 0;

    isConnectedTrialService = false;
    changeUserBalance = true;

    showReachMaxWin = false;

    roundId = 0;
    triggerCancelAutoPlay = null;
    isPlacingBet = false;

    triggerWinMultiplier = null;

    triggerDuringFreeSpinBonus = null;
    portraitshowTotalMultiplierView = false;
    get minPeekScatterCount() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get minPeekScatterCount accessed", {
            hasGameConfigs: !!this.configsStore.gameConfigs,
            isFreeSpins: this.isFreeSpins,
            timestamp: new Date().toISOString()
        });

        if (!this.configsStore.gameConfigs) {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] No game configs available, returning default value", {
                defaultValue: 1000,
                timestamp: new Date().toISOString()
            });
            return 1000; // default value
        }

        const freeSpinOdds = this.configsStore.gameConfigs.odds.freeSpins;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] Retrieved free spin odds", {
            freeSpinOdds,
            timestamp: new Date().toISOString()
        });

        const odds = this.isFreeSpins ? freeSpinOdds.additionalOdds : freeSpinOdds.initialOdds;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] Selected odds array", {
            usingAdditionalOdds: this.isFreeSpins,
            oddsCount: odds.length,
            timestamp: new Date().toISOString()
        });

        const minOdd = odds.filter((odd) => odd.odds > 0).sort((a, b) => a.count - b.count)[0];
        const result = minOdd.count - 1;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] Calculated min peek scatter count", {
            minOdd,
            calculatedCount: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get isTurboMode() {
        const result = this.isTurboModeUI || (this.holdActionStore.isHolding && !this.isTrialMode);
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isTurboMode accessed", {
            isTurboModeUI: this.isTurboModeUI,
            holdActionStoreIsHolding: this.holdActionStore.isHolding,
            isTrialMode: this.isTrialMode,
            calculatedIsTurboMode: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get isShowBigWin() {
        const result = this.haveBigWin || !this.isBigWinCompleted;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isShowBigWin accessed", {
            haveBigWin: this.haveBigWin,
            isBigWinCompleted: this.isBigWinCompleted,
            calculatedIsShowBigWin: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get isShowHighlightScatters() {
        const result = this.isBigWinCompleted && this.haveFreeSpin;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isShowHighlightScatters accessed", {
            isBigWinCompleted: this.isBigWinCompleted,
            haveFreeSpin: this.haveFreeSpin,
            calculatedIsShowHighlightScatters: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get isShowFreeSpinEffect() {
        const result = this.isHighlightScattersCompleted && this.haveFreeSpin;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isShowFreeSpinEffect accessed", {
            isHighlightScattersCompleted: this.isHighlightScattersCompleted,
            haveFreeSpin: this.haveFreeSpin,
            calculatedIsShowFreeSpinEffect: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get cascadingState() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get cascadingState accessed", {
            currentCascadingState: this._cascadingState,
            timestamp: new Date().toISOString()
        });
        return this._cascadingState;
    }

    set cascadingState(state: string) {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] set cascadingState called", {
            previousState: this._cascadingState,
            newState: state,
            timestamp: new Date().toISOString()
        });
        this._cascadingState = state;
    }

    get isSymbolPreviewVisible() {
        const result = this.dialogOpenEvent?.name === DialogName.PREVIEW_ODDS;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isSymbolPreviewVisible accessed", {
            dialogOpenEvent: this.dialogOpenEvent,
            calculatedIsSymbolPreviewVisible: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get bottomMessageState() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get bottomMessageState accessed", {
            currentBottomMessageState: this._bottomMessageState,
            timestamp: new Date().toISOString()
        });
        return this._bottomMessageState;
    }

    set bottomMessageState(state: string) {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] set bottomMessageState called", {
            previousState: this._bottomMessageState,
            newState: state,
            timestamp: new Date().toISOString()
        });
        this._bottomMessageState = state;
    }

    get isHideTopMessage() {
        const result = this.tumblesStore.tumbles.length > 1 || this.totalMultiplier > 0;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isHideTopMessage accessed", {
            tumblesCount: this.tumblesStore.tumbles.length,
            totalMultiplier: this.totalMultiplier,
            calculatedIsHideTopMessage: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get isFreeSpins() {
        const result = this.freeSpinsTotal > 0;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isFreeSpins accessed", {
            freeSpinsTotal: this.freeSpinsTotal,
            calculatedIsFreeSpins: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get userBalance() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get userBalance accessed", {
            isTrialMode: this.isTrialMode,
            timestamp: new Date().toISOString()
        });

        if (this.isTrialMode) {
            const trialBalance = this.configsStore.trialUser?.balance;
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Trial mode balance calculation", {
                trialBalance,
                trialUser: this.configsStore.trialUser,
                hasTrialUser: !!this.configsStore.trialUser,
                trialUserBalance: this.configsStore.trialUser?.balance,
                timestamp: new Date().toISOString()
            });

            // Provide a default trial balance if trial user balance is not available or is 0
            // This ensures stop-on-loss slider works in trial mode
            const defaultTrialBalance = 100000; // 100k default for trial mode
            const finalBalance = trialBalance || defaultTrialBalance;

            cascadingSlotLogger.info("[CASCADING_UI_STORE] Trial mode balance resolved", {
                originalTrialBalance: trialBalance,
                defaultTrialBalance,
                finalBalance,
                usedDefault: !trialBalance,
                timestamp: new Date().toISOString()
            });

            return finalBalance;
        }

        const mainBalance = this.mainPlayerStore.balance;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] Main mode balance retrieved", {
            mainBalance,
            mainPlayerStoreExists: !!this.mainPlayerStore,
            timestamp: new Date().toISOString()
        });

        return mainBalance;
    }

    get disabledTurboMode() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledTurboMode accessed", {
            holdActionStoreIsHolding: this.holdActionStore.isHolding,
            isTrialMode: this.isTrialMode,
            timestamp: new Date().toISOString()
        });

        if (this.holdActionStore.isHolding) {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Turbo mode disabled due to hold action", {
                reason: "holdActionStore.isHolding",
                timestamp: new Date().toISOString()
            });
            return true;
        }

        const result = this.isTrialMode;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] Turbo mode disabled status determined", {
            disabledDueToTrialMode: result,
            finalDisabledTurboMode: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get haveEventGame() {
        const result = this.haveBigWin || this.isShowFreeSpinEffect;
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get haveEventGame accessed", {
            haveBigWin: this.haveBigWin,
            isShowFreeSpinEffect: this.isShowFreeSpinEffect,
            calculatedHaveEventGame: result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    get spinButtonState() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get spinButtonState accessed", {
            cascadingState: this.cascadingState,
            haveBigWin: this.haveBigWin,
            haveFreeSpin: this.haveFreeSpin,
            tumblesCount: this.tumblesStore.tumbles.length,
            timestamp: new Date().toISOString()
        });

        if (this.cascadingState === CascadingSlotState.SPINNING) {
            if (this.haveBigWin || this.haveFreeSpin || this.tumblesStore.tumbles.length > 1) {
                cascadingSlotLogger.info("[CASCADING_UI_STORE] Spin button state: WIN_TUMBLE_OR_EVENT", {
                    reason: "haveBigWin || haveFreeSpin || tumbles.length > 1",
                    haveBigWin: this.haveBigWin,
                    haveFreeSpin: this.haveFreeSpin,
                    tumblesLength: this.tumblesStore.tumbles.length,
                    timestamp: new Date().toISOString()
                });
                return SpinButtonState.WIN_TUMBLE_OR_EVENT;
            }
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Spin button state: SPINNING", {
                reason: "cascadingState is SPINNING but no win/tumble conditions met",
                timestamp: new Date().toISOString()
            });
            return SpinButtonState.SPINNING;
        } else {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Spin button state: IDLE", {
                reason: "cascadingState is not SPINNING",
                timestamp: new Date().toISOString()
            });
            return SpinButtonState.IDLE;
        }
    }

    get disabledSpinButton() {
        const result = (
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.cascadingState === CascadingSlotState.NOT_READY_BET ||
            this.holdActionStore.triggerAction
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledSpinButton accessed", {
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isNotReadyBet: this.cascadingState === CascadingSlotState.NOT_READY_BET,
            holdActionStoreTriggerAction: this.holdActionStore.triggerAction,
            calculatedDisabledSpinButton: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get disabledChangeTrialMode() {
        const result = (
            this.cascadingState === CascadingSlotState.SPINNING ||
            (this.isFreeSpins && !this.isTrialMode) ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledChangeTrialMode accessed", {
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isFreeSpins: this.isFreeSpins,
            isTrialMode: this.isTrialMode,
            freeSpinsAndNotTrialMode: this.isFreeSpins && !this.isTrialMode,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            calculatedDisabledChangeTrialMode: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get disabledAutoPlay() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledAutoPlay accessed", {
            autoPlayStoreIsAutoplay: this.autoPlayStore.isAutoplay,
            holdActionStoreIsHolding: this.holdActionStore.isHolding,
            isFreeSpins: this.isFreeSpins,
            isTrialMode: this.isTrialMode,
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            timestamp: new Date().toISOString()
        });

        if (this.autoPlayStore.isAutoplay) {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Auto play not disabled - already in autoplay mode", {
                reason: "autoPlayStore.isAutoplay is true",
                timestamp: new Date().toISOString()
            });
            return false;
        }

        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.isTrialMode ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] Auto play disabled status determined", {
            disabledDueToHolding: this.holdActionStore.isHolding,
            disabledDueToFreeSpins: this.isFreeSpins,
            disabledDueToTrialMode: this.isTrialMode,
            disabledDueToSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            disabledDueToFSBPromotion: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            finalDisabledAutoPlay: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get disabledFlashSpin() {
        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledFlashSpin accessed", {
            flashSpinStoreIsFlashSpin: this.flashSpinStore.isFlashSpin,
            holdActionStoreIsHolding: this.holdActionStore.isHolding,
            isFreeSpins: this.isFreeSpins,
            isTrialMode: this.isTrialMode,
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            timestamp: new Date().toISOString()
        });

        if (this.flashSpinStore.isFlashSpin) {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] Flash spin not disabled - already in flash spin mode", {
                reason: "flashSpinStore.isFlashSpin is true",
                timestamp: new Date().toISOString()
            });
            return false;
        }

        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.isTrialMode ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] Flash spin disabled status determined", {
            disabledDueToHolding: this.holdActionStore.isHolding,
            disabledDueToFreeSpins: this.isFreeSpins,
            disabledDueToTrialMode: this.isTrialMode,
            disabledDueToSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            disabledDueToFSBPromotion: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            finalDisabledFlashSpin: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get disabledHyperSpin() {
        // If hyper-spin is already active, don't disable it (allow it to continue during free spins)
        // This ensures an active hyper-spin batch continues even when free spins are triggered
        if (this.isHyperSpinActive) {
            cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledHyperSpin accessed - Hyper-spin active, allowing continuation", {
                isHyperSpinActive: this.isHyperSpinActive,
                isFreeSpins: this.isFreeSpins,
                willReturnDisabled: false,
                timestamp: new Date().toISOString()
            });
            return false; // Keep hyper-spin active even during free spins
        }

        // Otherwise, disable button when conditions are met (prevents starting new hyper-spin)
        const result = (
            this.holdActionStore.isHolding ||
            this.isFreeSpins ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledHyperSpin accessed", {
            holdActionStoreIsHolding: this.holdActionStore.isHolding,
            isFreeSpins: this.isFreeSpins,
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            isHyperSpinActive: this.isHyperSpinActive,
            calculatedDisabledHyperSpin: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get disabledOpenInputBet() {
        const result = this.isFreeSpins || this.cascadingState === CascadingSlotState.SPINNING || this.fsbPromotionUIStore.isFSBPromotionInProgress;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disabledOpenInputBet accessed", {
            isFreeSpins: this.isFreeSpins,
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            calculatedDisabledOpenInputBet: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get isUsedFSBPromotionBonus() {
        const result = this.freeSpinsTotal <= 0 && this.checkToSpinNext;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isUsedFSBPromotionBonus accessed", {
            freeSpinsTotal: this.freeSpinsTotal,
            checkToSpinNext: this.checkToSpinNext,
            calculatedIsUsedFSBPromotionBonus: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    fadeBGM = { value: true };

    get disableBuyFreespins() {
        const result = (
            this.isFreeSpins ||
            this.cascadingState === CascadingSlotState.SPINNING ||
            this.autoPlayStore.isAutoplay ||
            this.fsbPromotionUIStore.isFSBPromotionInProgress
        );

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get disableBuyFreespins accessed", {
            isFreeSpins: this.isFreeSpins,
            cascadingState: this.cascadingState,
            isSpinning: this.cascadingState === CascadingSlotState.SPINNING,
            autoPlayStoreIsAutoplay: this.autoPlayStore.isAutoplay,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            calculatedDisableBuyFreespins: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get showFreeSpinsSectionsPortrait() {
        const result = this.bottomMessageState === SlotNotification.FREESPINS;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get showFreeSpinsSectionsPortrait accessed", {
            bottomMessageState: this.bottomMessageState,
            calculatedShowFreeSpinsSectionsPortrait: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get isShowAutoSpinRoundPortrait() {
        const result = this.bottomMessageState === SlotNotification.AUTO_SPIN;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isShowAutoSpinRoundPortrait accessed", {
            bottomMessageState: this.bottomMessageState,
            calculatedIsShowAutoSpinRoundPortrait: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    get isAutoSpinOrFreeSpin() {
        const result = this.isFreeSpins || this.autoPlayStore.isAutoplay;

        cascadingSlotLogger.info("[CASCADING_UI_STORE] get isAutoSpinOrFreeSpin accessed", {
            isFreeSpins: this.isFreeSpins,
            autoPlayStoreIsAutoplay: this.autoPlayStore.isAutoplay,
            calculatedIsAutoSpinOrFreeSpin: result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    dialogOpenEvent: { name: string } = null;
}
