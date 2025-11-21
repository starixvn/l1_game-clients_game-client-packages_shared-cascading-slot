import gc from "@sg/game-client-base";
import inversify from "inversify";

import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import mobx from "mobx";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet, DialogName, resourcesCache, SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { CascadingSlotSettlementStore } from "../stores/cascading-slot-settlement-store";
import { CascadingSlotTumblesStore } from "../stores/cascading-slot-tumbles-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HyperSpinStore } from "../stores/hyper-spin-store";
import { BetControlHandlers } from "./bet-control-handlers";

const { injectable, inject } = inversify;

@injectable()
export class CascadingUIHandler implements gc.Shared.IMultipleHandlers {
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(CascadingSlotTumblesStore) protected readonly tumblesStore: CascadingSlotTumblesStore;
    @inject(CascadingSlotSettlementStore) protected readonly settlementStore: CascadingSlotSettlementStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingSlotConfigsStore) protected readonly configsStore: CascadingSlotConfigsStore;
    @inject(BetControlHandlers) protected readonly betControlHandlers: BetControlHandlers;
    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.UserSettings.UserSettingHandlers) protected readonly userSettingHandlers: gc.UserSettings.UserSettingHandlers;
    @inject(gc.GameUserSettings.GameUserSettingHandler)
    protected readonly gameUserSettingHandler: gc.GameUserSettings.GameUserSettingHandler;
    @inject(BuyFreespinsStore) protected readonly buyFsStore: BuyFreespinsStore;
    @inject(HyperSpinStore) protected readonly hyperSpinStore: HyperSpinStore;

    constructor() {

        setTimeout(() => {

            mobx.reaction(
                () => this.betControlStore.coinValue,
                () => {
                    this.saveGameUserSettings();
                }
            );
            mobx.reaction(
                () => this.betControlStore.betLevel,
                () => {
                    this.saveGameUserSettings();
                }
            );

        }, 0);
    }

    handle() { }

    handleTotalWin({ win, isActualWin = false }) {

        this.uiStore.isActualWin = isActualWin;
        if (!this.uiStore.isActualWin) {
            const previousTotalWin = this.uiStore.totalWin;
            this.uiStore.totalWin += win;
        } else {
            const previousTotalWin = this.uiStore.totalWin;
            this.uiStore.totalWin = win;
        }
    }

    handleTotalWinTumble(tumberWin: number) {

        this.tumblesStore.isShowTumbleWinFrame = true;

        this.handleTotalWin({ win: tumberWin, isActualWin: false });
    }

    handleFreeSpinsTotal(freeSpinsTotal: number) {

        const previousFreeSpinsTotal = this.uiStore.freeSpinsTotal;
        this.uiStore.freeSpinsTotal = freeSpinsTotal;

        // If free-spin is being activated (transitioning from 0 to > 0) during hyper-spin,
        // close the hyper-spin popup and trigger free-spin auto-start (similar to buy-freespins workflow)
        // Check if hyper-spin is active OR if hyper-spin rounds are set (handles the setup delay window)
        const isHyperSpinActiveOrSetup = this.uiStore.isHyperSpinActive || (this.hyperSpinStore?.roundsHyperSpin ?? 0) > 0;
        const conditionMet = previousFreeSpinsTotal === 0 && freeSpinsTotal > 0 && isHyperSpinActiveOrSetup;

        if (conditionMet) {

            // Handle popup behavior based on stopOnFeature setting
            if (this.hyperSpinStore.stopOnFeature) {
                // When stopOnFeature = true, close hyper-spin popup and run free spins normally with UI

                // Close the hyper-spin popup since we're running freespins with normal UI
                if (this.hyperSpinStore) {

                    // Set popup states to false to close them
                    this.hyperSpinStore.isOpenHyperSpinPopup = false;
                    this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

                    // Deactivate hyper-spin since we're running freespins normally
                    this.hyperSpinStore.setHyperSpinActive(false);
                    this.uiStore.isHyperSpinActive = false;

                    // Verify the state changes took effect
                    setTimeout(() => {
                    }, 100);
                }
            } else {
                // When stopOnFeature = false, keep hyper-spin popup open for batch mode monitoring

                // IMPORTANT: In hyper-spin batch mode, keep the hyper-spin popup open during free-spin
                // This allows users to monitor hyper-spin progress while free-spins play
                // Hyper-spin should remain active during free-spin so it can continue after free-spin ends
                // Do NOT close the popup UI - keep it open for batch mode visibility
                if (this.hyperSpinStore) {
                    const wasHyperSpinActive = this.hyperSpinStore.isHyperSpinActive;

                    // Verify hyper-spin state is preserved

                    // Ensure hyper-spin remains active if it was active before
                    // This is a safeguard in case something else tries to deactivate it
                    // Use HyperSpinStore method to properly set the state
                    if (wasHyperSpinActive && !this.hyperSpinStore.isHyperSpinActive) {
                        this.hyperSpinStore.setHyperSpinActive(true);
                    }
                }
            }

            // Update free-spin count message (similar to buy-freespins workflow)
            this.updateFreespinCountMsgBottom(freeSpinsTotal);

            // Set up free-spin trigger (similar to buy-freespins workflow)
            this.handleTriggerDuringFreeSpinBonus();

            // Trigger free-spin auto-start immediately to close popup and start free spins without delay

            // Set isFreeSpinEffectCompleted immediately to trigger the reactive flow
            // This ensures checkNextRound() is called, which will then call checkSpinNextRound()
            // checkSpinNextRound() checks if freeSpinsTotal > 0 and automatically places bet
            // Since CascadingUIStore.isHyperSpinActive remains true during free-spin,
            // the next settlement will have isInHyperSpin = true and skip animations
            this.uiStore.isFreeSpinEffectCompleted = true;

        }

        const shouldTriggerFreeSpinBonusEnd = freeSpinsTotal === 0 && !this.fsbPromotionUIStore.isFSBPromotionInProgress;

        if (shouldTriggerFreeSpinBonusEnd) {
            this.handleTriggerDuringFreeSpinBonus(null);
        }
    }

    handleFreeSpinsByRound(freeSpins: number) {

        this.uiStore.freeSpinsByRound = freeSpins;
    }

    handleMultiplier(multiplier: number) {

        this.uiStore.multiplier += multiplier;
    }

    handleOnGameHide() {

        this.resetBottomMessageState();
        this.uiStore.triggerCancelAutoPlay = {};

    }

    handlePlaceBetFailed(clearFreeSpins = false) {

        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.uiStore.triggerCancelAutoPlay = {};
        this.uiStore.isPlacingBet = false;

        const isMessageForFreeSpins = this.uiStore.bottomMessageState === SlotNotification.FREESPINS;

        if (!isMessageForFreeSpins || clearFreeSpins) {
            this.resetBottomMessageState();
        }
        if (clearFreeSpins) {
            this.clearFreeSpins();
        }
        if (this.uiStore.isFreeSpins) {
            this.updateFreespinCountMsgBottom(this.uiStore.freeSpinsTotal);
        }

    }

    resetProcessingBet() {

        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.resetBottomMessageState();

    }

    resetBottomMessageState() {
        const newMessageState = this.uiStore.isTrialMode ? SlotNotification.BEFORE_SPIN_TRIAL : SlotNotification.BEFORE_SPIN;

        this.uiStore.bottomMessageState = newMessageState;
    }

    handleNewRound() {

        // Reset spin control flags
        this.uiStore.checkToSpinNext = false;

        // Reset tumble data
        this.tumblesStore.tumbles = [];
        this.tumblesStore.isShowTumbleWinFrame = false;
        this.uiStore.totalTumbleWin = 0;

        // Reset settlement data
        this.settlementStore.finishData = null;

        // Reset completion flags
        this.uiStore.isFreeSpinEffectCompleted = false;
        this.uiStore.isBigWinCompleted = false;
        this.uiStore.isHighlightScattersCompleted = false;
        this.uiStore.showReachMaxWin = false;

        // Reset multiplier and win data
        this.uiStore.multiplier = 0;
        const shouldResetTotalMultiplier = !this.uiStore.isFreeSpins && !this.fsbPromotionUIStore.isFSBPromotionInProgress;

        if (shouldResetTotalMultiplier) {
            this.uiStore.totalMultiplier = 0;
            this.uiStore.portraitshowTotalMultiplierView = false;
        }

        // Reset win and effect data
        this.uiStore.totalWin = 0;
        this.uiStore.activePeekEffect = false;

        // During hyper-spin, don't close the HYPER_SPIN dialog to keep bet control popup open
        // Check if hyper-spin is active
        const isInHyperSpin = this.uiStore.isHyperSpinActive;

        // Only close dialogs if not in hyper-spin mode
        if (!isInHyperSpin) {
            this.triggerOpenDialog(DialogName.DUMMY_DIALOG);
        } else {
        }

    }

    changeCascadingState(state: string) {

        this.uiStore.cascadingState = state;
        this.fsbPromotionUIStore.isSpinningFSB = state === CascadingSlotState.SPINNING;

    }

    handleTurboModeUI(isTurboModeUI: boolean) {

        this.uiStore.isTurboModeUI = isTurboModeUI;

    }

    handleBottomMessage(state: string) {

        if (
            this.uiStore.bottomMessageState === SlotNotification.FREESPINS ||
            this.uiStore.bottomMessageState === SlotNotification.AUTO_SPIN
        ) {
            return;
        }

        this.uiStore.bottomMessageState = state;
    }

    handleFreespinsJoinGame(freespins: any) {
        // Warn when free spins are received from service join game message
        if (freespins && (freespins.total > 0 || freespins.length > 0)) {
        }

        if (!freespins || freespins.total === 0 || freespins.length === 0) {

            if (this.betControlStore.lastSetting) {
                const { betLevel, coinValue } = this.betControlStore.lastSetting;
                this.betControlHandlers.init(coinValue, betLevel);
            } else {
                this.betControlHandlers.init();
            }
            return;
        }

        const { total, betLevel, coinValue, betMultiplier } = freespins;

        this.handleFreeSpinsTotal(total);
        this.updateFreespinCountMsgBottom(total);
        this.handleTriggerDuringFreeSpinBonus();

        this.betControlHandlers.init(coinValue, betLevel);
        this.betControlHandlers.setTotalBet(calculateTotalBet(betLevel, coinValue, betMultiplier));

        if (freespins.promotionId) {
            this.fsbPromotionUIStore.resumedFSBPromotion = true;
        }

        if (freespins?.buyFreeSpins) {
            this.buyFsStore.isActive = true;
        }

        if (total > 0) {
            this.buyFsStore.triggerAutoPlay = {};
        }

    }

    protected clearFreeSpins() {

        this.uiStore.freeSpinsTotal = 0;
        this.uiStore.freeSpinsByRound = 0;

    }

    handleTotalMultiplier(totalMultiplier: number) {

        if (totalMultiplier > 0) {
            this.uiStore.portraitshowTotalMultiplierView = true;
        }

        this.uiStore.totalMultiplier = totalMultiplier;

    }

    setPeekEffect(show: boolean) {

        this.uiStore.activePeekEffect = show;

    }

    handleHaveBigWin(bigwin: boolean) {

        if (!this.settlementStore.finishData) {
            return;
        }

        const isPeekEffectSuccess = this.settlementStore?.finishData?.freeSpins > 0 && this.uiStore.activePeekEffect;

        if (bigwin && !isPeekEffectSuccess) {
            this.uiStore.haveBigWin = bigwin;
        } else {
            this.uiStore.isBigWinCompleted = true;
        }

    }

    handleBigWinAmount(win: number) {

        this.uiStore.bigWinAmount = win;

    }

    handleBigWinCompleted(completed: boolean) {

        if (!this.settlementStore.finishData) {
            return;
        }

        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        const { freeSpins } = this.settlementStore.finishData;

        this.uiStore.haveBigWin = false;
        this.uiStore.isBigWinCompleted = completed;

        if (freeSpins <= 0) {
            this.handleFreeSpinEffectCompleted(true);
        }

    }

    handleHaveFreeSpin(haveFreeSpin: boolean) {

        // In hyper-spin batch mode, prevent free-spin effect UI from showing only when stopOnFeature is false
        // When stopOnFeature is true, free spins should run normally with UI effects even in hyper-spin mode
        // This ensures no animations, popups, or effects are displayed during batch mode optimization
        if (this.uiStore.isHyperSpinActive && haveFreeSpin && !this.hyperSpinStore.stopOnFeature) {
            // Don't set haveFreeSpin = true to prevent isShowFreeSpinEffect from becoming true
            // This prevents freespin effect container, mascot animations, and other UI effects
            this.uiStore.haveFreeSpin = false;
        } else {
            if (haveFreeSpin && this.uiStore.isHyperSpinActive && this.hyperSpinStore.stopOnFeature) {
            } else if (haveFreeSpin && !this.uiStore.isHyperSpinActive) {
            }
            this.uiStore.haveFreeSpin = haveFreeSpin;
        }

    }

    handleFreeSpinEffectCompleted(completed: boolean) {

        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        this.uiStore.haveFreeSpin = false;
        this.uiStore.isFreeSpinEffectCompleted = completed;

    }

    handleHighlightScattersCompleted(completed: boolean) {

        this.uiStore.isHighlightScattersCompleted = completed;

    }

    handleChangeMode(isTrialMode: boolean) {

        this.uiStore.isTrialMode = isTrialMode;

        if (isTrialMode) {
            this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN_TRIAL;
            this.uiStore.isTurboModeUI = false;
        } else {
            const newBottomMessageState = this.uiStore.cascadingState !== CascadingSlotState.READY_BET
                ? SlotNotification.SETTLED
                : SlotNotification.BEFORE_SPIN;
            this.uiStore.bottomMessageState = newBottomMessageState;
        }

        this.uiStore.roundId = 0;
        this.handleNewRound();
        this.betControlStore.needClearLastSetting = true;
        this.saveGameUserSettings();

    }

    saveGameUserSettings() {

        this.gameUserSettingHandler.saveTempStorage();

    }

    updateFreespinCountMsgBottom(count: number) {

        this.uiStore.bottomMessageState = SlotNotification.FREESPINS;
        this.uiStore.freespinCountMsgBottom = count;

    }

    updateConnectedTrialService(connected: boolean) {

        this.uiStore.isConnectedTrialService = connected;

    }

    handleChangeUserBalance(change: boolean) {

        this.uiStore.changeUserBalance = change;

    }

    setReachMaxWin(show: boolean) {

        this.uiStore.showReachMaxWin = show;

    }

    handleTriggerWinMultiplier() {

        this.uiStore.triggerWinMultiplier = {};

    }

    handleTriggerDuringFreeSpinBonus(trigger = {}) {

        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            return;
        }

        // In hyper-spin batch mode, skip free-spin UI effects (background change, music, etc.) only when stopOnFeature is false
        // When stopOnFeature is true, allow normal free-spin UI effects even in hyper-spin mode
        // This ensures free-spin plays silently without UI interruptions only in batch optimization mode
        if (this.uiStore.isHyperSpinActive && trigger && !this.hyperSpinStore.stopOnFeature) {
            // Don't set triggerDuringFreeSpinBonus to prevent background change
            return;
        } else if (this.uiStore.isHyperSpinActive && trigger && this.hyperSpinStore.stopOnFeature) {
        }

        this.uiStore.triggerDuringFreeSpinBonus = trigger;

    }

    handleFadeBGM(fadeBGM: boolean) {

        this.uiStore.fadeBGM = { value: fadeBGM };

    }

    handleShowTotalMultiplierView(move: boolean) {

        this.uiStore.portraitshowTotalMultiplierView = move;

    }

    triggerOpenDialog(name: string) {

        this.uiStore.dialogOpenEvent = { name };

    }

    /**
     * Check for interrupted hyper-spin batches on game initialization and offer recovery
     */
    checkHyperSpinBatchRecovery() {

        if (!this.hyperSpinStore?.currentBatchData) {
            return;
        }

        const batchStatus = this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus;
        const roundsRemaining = this.hyperSpinStore.roundsHyperSpin;

        // Check if batch was interrupted
        if (batchStatus === "Interrupted" && roundsRemaining > 0) {

            // Show recovery dialog
            this.showBatchRecoveryDialog();
        } else if (batchStatus === "Playing" && !this.hyperSpinStore.isHyperSpin) {
            // Batch was in progress but hyper-spin is not active - likely due to game restart

            // Mark as interrupted and show recovery options
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Interrupted";
            this.showBatchRecoveryDialog();
        } else {
        }
    }

    /**
     * Show recovery dialog for interrupted batch
     */
    private showBatchRecoveryDialog() {

        // For now, show a notification. In a full implementation, this would show a proper dialog
        const message = "An interrupted Hyper-Spin batch was detected. The batch will be available for recovery.";

        // Update UI state to indicate recovery is available
        if (this.uiStore) {
            this.uiStore.bottomMessageState = "HYPER_SPIN_RECOVERY_AVAILABLE";
        }
    }

    /**
     * Handle user choice for batch recovery
     */
    handleBatchRecoveryChoice(recover: boolean) {

        if (recover) {
            // Attempt to recover the batch using HyperSpinHandler
            // This would typically be called through the handler system

            // For now, directly call the store method since we have access to it
            const recoverySuccess = this.hyperSpinStore?.recoverInterruptedBatch();
            if (recoverySuccess) {
            } else {
                this.showRecoveryFailedMessage();
            }
        } else {
            // User chose not to recover - clean up the interrupted batch
            this.cleanupInterruptedBatch();
        }
    }

    /**
     * Show message when recovery fails
     */
    private showRecoveryFailedMessage() {
        const message = "Failed to recover the interrupted Hyper-Spin batch. Please start a new batch.";
        // Could show a notice here if noticeStore is available
    }

    /**
     * Clean up interrupted batch data
     */
    private cleanupInterruptedBatch() {

        if (this.hyperSpinStore) {
            this.hyperSpinStore.clearBatchData();
            this.hyperSpinStore.setHyperSpinActive(false);
        }

        if (this.uiStore) {
            this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN;
        }

    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
            handle: this.handleFreespinsJoinGame,
        },

        {
            name: GameServiceMessageCascading.CascadingTotalMultiplierMsg.eventName,
            handle: this.handleTotalMultiplier,
        },
    ];
}
