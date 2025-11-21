import gc from "@sg/game-client-base";
import inversify from "inversify";

import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import mobx from "mobx";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";
import { CascadingSlotState } from "../cascading-slot-state";
import { calculateTotalBet, DialogName, resourcesCache, SlotNotification } from "../cascading-slot-utils";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { cascadingSlotLogger } from "../cascading-slot-logger";
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
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] CascadingUIHandler constructor called", {
            uiStoreInjected: !!this.uiStore,
            tumblesStoreInjected: !!this.tumblesStore,
            settlementStoreInjected: !!this.settlementStore,
            betControlStoreInjected: !!this.betControlStore,
            configsStoreInjected: !!this.configsStore,
            betControlHandlersInjected: !!this.betControlHandlers,
            hyperSpinStoreInjected: !!this.hyperSpinStore,
            timestamp: new Date().toISOString()
        });

        setTimeout(() => {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Setting up MobX reactions for user settings", {
                willSetupCoinValueReaction: true,
                willSetupBetLevelReaction: true,
                timestamp: new Date().toISOString()
            });

            mobx.reaction(
                () => this.betControlStore.coinValue,
                () => {
                    cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Coin value changed, saving game user settings", {
                        newCoinValue: this.betControlStore.coinValue,
                        timestamp: new Date().toISOString()
                    });
                    this.saveGameUserSettings();
                }
            );
            mobx.reaction(
                () => this.betControlStore.betLevel,
                () => {
                    cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Bet level changed, saving game user settings", {
                        newBetLevel: this.betControlStore.betLevel,
                        timestamp: new Date().toISOString()
                    });
                    this.saveGameUserSettings();
                }
            );

            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] MobX reactions setup completed", {
                timestamp: new Date().toISOString()
            });
        }, 0);
    }

    handle() { }

    handleTotalWin({ win, isActualWin = false }) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTotalWin called", {
            win,
            isActualWin,
            currentTotalWin: this.uiStore.totalWin,
            isActualWinFlag: this.uiStore.isActualWin,
            timestamp: new Date().toISOString()
        });

        this.uiStore.isActualWin = isActualWin;
        if (!this.uiStore.isActualWin) {
            const previousTotalWin = this.uiStore.totalWin;
            this.uiStore.totalWin += win;
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Total win accumulated (added to existing)", {
                previousTotalWin,
                addedWin: win,
                newTotalWin: this.uiStore.totalWin,
                timestamp: new Date().toISOString()
            });
        } else {
            const previousTotalWin = this.uiStore.totalWin;
            this.uiStore.totalWin = win;
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Total win set to actual win value", {
                previousTotalWin,
                newTotalWin: win,
                timestamp: new Date().toISOString()
            });
        }
    }

    handleTotalWinTumble(tumberWin: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTotalWinTumble called", {
            tumberWin,
            previousShowTumbleWinFrame: this.tumblesStore.isShowTumbleWinFrame,
            currentTotalWin: this.uiStore.totalWin,
            timestamp: new Date().toISOString()
        });

        this.tumblesStore.isShowTumbleWinFrame = true;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Tumble win frame enabled", {
            isShowTumbleWinFrame: this.tumblesStore.isShowTumbleWinFrame,
            timestamp: new Date().toISOString()
        });

        this.handleTotalWin({ win: tumberWin, isActualWin: false });
    }

    handleFreeSpinsTotal(freeSpinsTotal: number) {
        console.warn("🎰 HANDLE FREESPINS TOTAL: Called with freeSpinsTotal", {
            freeSpinsTotal,
            previousFreeSpinsTotal: this.uiStore.freeSpinsTotal,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            uiStoreIsHyperSpinActive: this.uiStore.isHyperSpinActive,
            hyperSpinStoreIsHyperSpin: this.hyperSpinStore?.isHyperSpin,
            hyperSpinStoreRoundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
            isOpenHyperSpinPopup: this.hyperSpinStore?.isOpenHyperSpinPopup,
            isOpenHyperSpinBetControlPopup: this.hyperSpinStore?.isOpenHyperSpinBetControlPopup,
            stopOnFeature: this.hyperSpinStore?.stopOnFeature,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFreeSpinsTotal called", {
            freeSpinsTotal,
            previousFreeSpinsTotal: this.uiStore.freeSpinsTotal,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            isOpenHyperSpinPopup: this.hyperSpinStore?.isOpenHyperSpinPopup,
            timestamp: new Date().toISOString()
        });

        const previousFreeSpinsTotal = this.uiStore.freeSpinsTotal;
        this.uiStore.freeSpinsTotal = freeSpinsTotal;

        // If free-spin is being activated (transitioning from 0 to > 0) during hyper-spin,
        // close the hyper-spin popup and trigger free-spin auto-start (similar to buy-freespins workflow)
        // Check if hyper-spin is active OR if hyper-spin rounds are set (handles the setup delay window)
        const isHyperSpinActiveOrSetup = this.uiStore.isHyperSpinActive || (this.hyperSpinStore?.roundsHyperSpin ?? 0) > 0;
        const conditionMet = previousFreeSpinsTotal === 0 && freeSpinsTotal > 0 && isHyperSpinActiveOrSetup;
        console.warn("🎰 FREESPIN ACTIVATION CONDITION CHECK", {
            conditionMet,
            previousFreeSpinsTotal,
            freeSpinsTotal,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            roundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
            isHyperSpinActiveOrSetup,
            stopOnFeature: this.hyperSpinStore?.stopOnFeature,
            conditionBreakdown: {
                previousWasZero: previousFreeSpinsTotal === 0,
                nowGreaterThanZero: freeSpinsTotal > 0,
                hyperSpinActive: this.uiStore.isHyperSpinActive,
                roundsSet: (this.hyperSpinStore?.roundsHyperSpin ?? 0) > 0
            },
            willExecutePopupLogic: conditionMet && this.hyperSpinStore?.stopOnFeature,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Checking free-spin activation during hyper-spin condition", {
            conditionMet,
            previousFreeSpinsTotal,
            freeSpinsTotal,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            roundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
            isHyperSpinActiveOrSetup,
            conditionBreakdown: {
                previousWasZero: previousFreeSpinsTotal === 0,
                nowGreaterThanZero: freeSpinsTotal > 0,
                hyperSpinActive: this.uiStore.isHyperSpinActive,
                roundsSet: (this.hyperSpinStore?.roundsHyperSpin ?? 0) > 0
            },
            timestamp: new Date().toISOString()
        });

        if (conditionMet) {
            console.warn("🎰 FREESPIN ACTIVATED: Free-spin triggered during hyper-spin batch mode", {
                freeSpinsTotal,
                previousFreeSpinsTotal,
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                roundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
                timestamp: new Date().toISOString()
            });

            // Handle popup behavior based on stopOnFeature setting
            if (this.hyperSpinStore.stopOnFeature) {
                // When stopOnFeature = true, close hyper-spin popup and run free spins normally with UI
                cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free-spin activated with stopOnFeature=true - closing popup and running normal freespin UI", {
                    freeSpinsTotal,
                    isHyperSpinActive: this.uiStore.isHyperSpinActive,
                    stopOnFeature: this.hyperSpinStore.stopOnFeature,
                    roundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
                    isOpenHyperSpinPopup: this.hyperSpinStore?.isOpenHyperSpinPopup,
                    isOpenHyperSpinBetControlPopup: this.hyperSpinStore?.isOpenHyperSpinBetControlPopup,
                    timestamp: new Date().toISOString()
                });

                // Close the hyper-spin popup since we're running freespins with normal UI
                if (this.hyperSpinStore) {
                    console.warn("🎰 HYPER-SPIN POPUP CLOSING: Closing hyper-spin popup for normal freespin experience", {
                        beforeClose: {
                            isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
                            isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
                            isHyperSpinActive: this.hyperSpinStore.isHyperSpin,
                        },
                        timestamp: new Date().toISOString()
                    });

                    cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Closing hyper-spin popup for normal freespin experience", {
                        isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
                        isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
                        timestamp: new Date().toISOString()
                    });

                    // Set popup states to false to close them
                    this.hyperSpinStore.isOpenHyperSpinPopup = false;
                    this.hyperSpinStore.isOpenHyperSpinBetControlPopup = false;

                    // Deactivate hyper-spin since we're running freespins normally
                    this.hyperSpinStore.setHyperSpinActive(false);
                    this.uiStore.isHyperSpinActive = false;

                    // Verify the state changes took effect
                    setTimeout(() => {
                        console.warn("🎰 HYPER-SPIN POPUP VERIFICATION: Checking if popup closed successfully", {
                            afterClose: {
                                isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
                                isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
                                isHyperSpinActive: this.hyperSpinStore.isHyperSpin,
                            },
                            uiStoreHyperSpinActive: this.uiStore.isHyperSpinActive,
                            timestamp: new Date().toISOString()
                        });
                    }, 100);
                }
            } else {
                // When stopOnFeature = false, keep hyper-spin popup open for batch mode monitoring
                cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free-spin activated with stopOnFeature=false - keeping popup open for batch mode", {
                    freeSpinsTotal,
                    isHyperSpinActive: this.uiStore.isHyperSpinActive,
                    stopOnFeature: this.hyperSpinStore.stopOnFeature,
                    roundsHyperSpin: this.hyperSpinStore?.roundsHyperSpin ?? 0,
                    isOpenHyperSpinPopup: this.hyperSpinStore?.isOpenHyperSpinPopup,
                    isOpenHyperSpinBetControlPopup: this.hyperSpinStore?.isOpenHyperSpinBetControlPopup,
                    timestamp: new Date().toISOString()
                });

                // IMPORTANT: In hyper-spin batch mode, keep the hyper-spin popup open during free-spin
                // This allows users to monitor hyper-spin progress while free-spins play
                // Hyper-spin should remain active during free-spin so it can continue after free-spin ends
                // Do NOT close the popup UI - keep it open for batch mode visibility
                if (this.hyperSpinStore) {
                    const wasHyperSpinActive = this.hyperSpinStore.isHyperSpinActive;

                    cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Keeping hyper-spin popup open during free-spin (batch mode)", {
                        wasHyperSpinActive,
                        isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
                        isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
                        note: "Hyper-spin popup remains open during free-spin in batch mode",
                        timestamp: new Date().toISOString()
                    });

                    // Verify hyper-spin state is preserved
                    cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Hyper-spin state verification", {
                        isHyperSpinActive: this.hyperSpinStore.isHyperSpinActive,
                        isOpenHyperSpinPopup: this.hyperSpinStore.isOpenHyperSpinPopup,
                        isOpenHyperSpinBetControlPopup: this.hyperSpinStore.isOpenHyperSpinBetControlPopup,
                        hyperSpinStatePreserved: this.hyperSpinStore.isHyperSpinActive === wasHyperSpinActive,
                        timestamp: new Date().toISOString()
                    });

                    // Ensure hyper-spin remains active if it was active before
                    // This is a safeguard in case something else tries to deactivate it
                    // Use HyperSpinStore method to properly set the state
                    if (wasHyperSpinActive && !this.hyperSpinStore.isHyperSpinActive) {
                        cascadingSlotLogger.warn("[CASCADING_UI_HANDLER] Hyper-spin was deactivated - restoring state via store", {
                            timestamp: new Date().toISOString()
                        });
                        this.hyperSpinStore.setHyperSpinActive(true);
                    }
                }
            }

            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Hyper-spin popup kept open for free-spin activation (batch mode)", {
                isOpenHyperSpinPopup: this.hyperSpinStore?.isOpenHyperSpinPopup,
                isOpenHyperSpinBetControlPopup: this.hyperSpinStore?.isOpenHyperSpinBetControlPopup,
                isHyperSpinActive: this.hyperSpinStore?.isHyperSpinActive,
                timestamp: new Date().toISOString()
            });

            // Update free-spin count message (similar to buy-freespins workflow)
            this.updateFreespinCountMsgBottom(freeSpinsTotal);
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free-spin count message updated", {
                freeSpinsTotal,
                timestamp: new Date().toISOString()
            });

            // Set up free-spin trigger (similar to buy-freespins workflow)
            this.handleTriggerDuringFreeSpinBonus();
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free-spin trigger set up", {
                triggerDuringFreeSpinBonus: this.uiStore.triggerDuringFreeSpinBonus,
                timestamp: new Date().toISOString()
            });

            // Trigger free-spin auto-start immediately to close popup and start free spins without delay
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Triggering free-spin auto-start immediately", {
                freeSpinsTotal,
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                timestamp: new Date().toISOString()
            });

            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Triggering free-spin auto-start via isFreeSpinEffectCompleted", {
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                previousIsFreeSpinEffectCompleted: this.uiStore.isFreeSpinEffectCompleted,
                timestamp: new Date().toISOString()
            });

            // Set isFreeSpinEffectCompleted immediately to trigger the reactive flow
            // This ensures checkNextRound() is called, which will then call checkSpinNextRound()
            // checkSpinNextRound() checks if freeSpinsTotal > 0 and automatically places bet
            // Since CascadingUIStore.isHyperSpinActive remains true during free-spin,
            // the next settlement will have isInHyperSpin = true and skip animations
            this.uiStore.isFreeSpinEffectCompleted = true;

            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free-spin effect completed flag set immediately - will trigger checkNextRound", {
                isFreeSpinEffectCompleted: this.uiStore.isFreeSpinEffectCompleted,
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                note: "Next free-spin round will skip animations because CascadingUIStore.isHyperSpinActive is true",
                timestamp: new Date().toISOString()
            });
        }

        const shouldTriggerFreeSpinBonusEnd = freeSpinsTotal === 0 && !this.fsbPromotionUIStore.isFSBPromotionInProgress;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Evaluating free spin bonus end condition", {
            freeSpinsTotal,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            shouldTriggerFreeSpinBonusEnd,
            timestamp: new Date().toISOString()
        });

        if (shouldTriggerFreeSpinBonusEnd) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Triggering free spin bonus end", {
                timestamp: new Date().toISOString()
            });
            this.handleTriggerDuringFreeSpinBonus(null);
        }
    }

    handleFreeSpinsByRound(freeSpins: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFreeSpinsByRound called", {
            freeSpins,
            previousFreeSpinsByRound: this.uiStore.freeSpinsByRound,
            timestamp: new Date().toISOString()
        });

        this.uiStore.freeSpinsByRound = freeSpins;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spins by round updated", {
            newFreeSpinsByRound: this.uiStore.freeSpinsByRound,
            timestamp: new Date().toISOString()
        });
    }

    handleMultiplier(multiplier: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleMultiplier called", {
            multiplier,
            previousMultiplier: this.uiStore.multiplier,
            timestamp: new Date().toISOString()
        });

        this.uiStore.multiplier += multiplier;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Multiplier accumulated", {
            addedMultiplier: multiplier,
            newMultiplier: this.uiStore.multiplier,
            timestamp: new Date().toISOString()
        });
    }

    handleOnGameHide() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleOnGameHide called", {
            previousBottomMessageState: this.uiStore.bottomMessageState,
            previousTriggerCancelAutoPlay: this.uiStore.triggerCancelAutoPlay,
            timestamp: new Date().toISOString()
        });

        this.resetBottomMessageState();
        this.uiStore.triggerCancelAutoPlay = {};

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Game hide handling completed", {
            newBottomMessageState: this.uiStore.bottomMessageState,
            newTriggerCancelAutoPlay: this.uiStore.triggerCancelAutoPlay,
            timestamp: new Date().toISOString()
        });
    }

    handlePlaceBetFailed(clearFreeSpins = false) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handlePlaceBetFailed called", {
            clearFreeSpins,
            previousCascadingState: this.uiStore.cascadingState,
            previousIsPlacingBet: this.uiStore.isPlacingBet,
            previousBottomMessageState: this.uiStore.bottomMessageState,
            isFreeSpins: this.uiStore.isFreeSpins,
            timestamp: new Date().toISOString()
        });

        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.uiStore.triggerCancelAutoPlay = {};
        this.uiStore.isPlacingBet = false;

        const isMessageForFreeSpins = this.uiStore.bottomMessageState === SlotNotification.FREESPINS;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Evaluating bottom message reset condition", {
            isMessageForFreeSpins,
            clearFreeSpins,
            willResetBottomMessage: !isMessageForFreeSpins || clearFreeSpins,
            timestamp: new Date().toISOString()
        });

        if (!isMessageForFreeSpins || clearFreeSpins) {
            this.resetBottomMessageState();
        }
        if (clearFreeSpins) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Clearing free spins", {
                timestamp: new Date().toISOString()
            });
            this.clearFreeSpins();
        }
        if (this.uiStore.isFreeSpins) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Updating freespin count message", {
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });
            this.updateFreespinCountMsgBottom(this.uiStore.freeSpinsTotal);
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Place bet failed handling completed", {
            newCascadingState: this.uiStore.cascadingState,
            newIsPlacingBet: this.uiStore.isPlacingBet,
            newBottomMessageState: this.uiStore.bottomMessageState,
            timestamp: new Date().toISOString()
        });
    }

    resetProcessingBet() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] resetProcessingBet called", {
            previousCascadingState: this.uiStore.cascadingState,
            previousBottomMessageState: this.uiStore.bottomMessageState,
            timestamp: new Date().toISOString()
        });

        this.changeCascadingState(CascadingSlotState.READY_BET);
        this.resetBottomMessageState();

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Processing bet reset completed", {
            newCascadingState: this.uiStore.cascadingState,
            newBottomMessageState: this.uiStore.bottomMessageState,
            timestamp: new Date().toISOString()
        });
    }

    resetBottomMessageState() {
        const newMessageState = this.uiStore.isTrialMode ? SlotNotification.BEFORE_SPIN_TRIAL : SlotNotification.BEFORE_SPIN;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] resetBottomMessageState called", {
            isTrialMode: this.uiStore.isTrialMode,
            previousBottomMessageState: this.uiStore.bottomMessageState,
            newBottomMessageState: newMessageState,
            timestamp: new Date().toISOString()
        });

        this.uiStore.bottomMessageState = newMessageState;
    }

    handleNewRound() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleNewRound called - Starting new round initialization", {
            previousCheckToSpinNext: this.uiStore.checkToSpinNext,
            previousTumblesCount: this.tumblesStore.tumbles.length,
            previousIsShowTumbleWinFrame: this.tumblesStore.isShowTumbleWinFrame,
            previousTotalTumbleWin: this.uiStore.totalTumbleWin,
            previousTotalWin: this.uiStore.totalWin,
            previousMultiplier: this.uiStore.multiplier,
            isFreeSpins: this.uiStore.isFreeSpins,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            timestamp: new Date().toISOString()
        });

        // Reset spin control flags
        this.uiStore.checkToSpinNext = false;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reset checkToSpinNext to false", {
            checkToSpinNext: this.uiStore.checkToSpinNext,
            timestamp: new Date().toISOString()
        });

        // Reset tumble data
        this.tumblesStore.tumbles = [];
        this.tumblesStore.isShowTumbleWinFrame = false;
        this.uiStore.totalTumbleWin = 0;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reset tumble data", {
            tumblesCount: this.tumblesStore.tumbles.length,
            isShowTumbleWinFrame: this.tumblesStore.isShowTumbleWinFrame,
            totalTumbleWin: this.uiStore.totalTumbleWin,
            timestamp: new Date().toISOString()
        });

        // Reset settlement data
        this.settlementStore.finishData = null;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Cleared settlement finish data", {
            finishDataCleared: this.settlementStore.finishData === null,
            timestamp: new Date().toISOString()
        });

        // Reset completion flags
        this.uiStore.isFreeSpinEffectCompleted = false;
        this.uiStore.isBigWinCompleted = false;
        this.uiStore.isHighlightScattersCompleted = false;
        this.uiStore.showReachMaxWin = false;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reset completion flags", {
            isFreeSpinEffectCompleted: this.uiStore.isFreeSpinEffectCompleted,
            isBigWinCompleted: this.uiStore.isBigWinCompleted,
            isHighlightScattersCompleted: this.uiStore.isHighlightScattersCompleted,
            showReachMaxWin: this.uiStore.showReachMaxWin,
            timestamp: new Date().toISOString()
        });

        // Reset multiplier and win data
        this.uiStore.multiplier = 0;
        const shouldResetTotalMultiplier = !this.uiStore.isFreeSpins && !this.fsbPromotionUIStore.isFSBPromotionInProgress;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Evaluating total multiplier reset condition", {
            isFreeSpins: this.uiStore.isFreeSpins,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            shouldResetTotalMultiplier,
            previousTotalMultiplier: this.uiStore.totalMultiplier,
            previousPortraitShowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
            timestamp: new Date().toISOString()
        });

        if (shouldResetTotalMultiplier) {
            this.uiStore.totalMultiplier = 0;
            this.uiStore.portraitshowTotalMultiplierView = false;
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reset total multiplier data", {
                totalMultiplier: this.uiStore.totalMultiplier,
                portraitshowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
                timestamp: new Date().toISOString()
            });
        }

        // Reset win and effect data
        this.uiStore.totalWin = 0;
        this.uiStore.activePeekEffect = false;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reset win and effect data", {
            totalWin: this.uiStore.totalWin,
            activePeekEffect: this.uiStore.activePeekEffect,
            timestamp: new Date().toISOString()
        });

        // During hyper-spin, don't close the HYPER_SPIN dialog to keep bet control popup open
        // Check if hyper-spin is active
        const isInHyperSpin = this.uiStore.isHyperSpinActive;
        cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] UI Handler handleNewRound hyper-spin detection", {
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            isInHyperSpin,
            willCloseDialog: !isInHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Only close dialogs if not in hyper-spin mode
        if (!isInHyperSpin) {
            cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] UI Handler - closing dialogs (not in hyper-spin)");
            this.triggerOpenDialog(DialogName.DUMMY_DIALOG);
        } else {
            cascadingSlotLogger.info("[HYPER_SPIN_DEBUG] UI Handler - keeping dialogs open (in hyper-spin mode)");
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleNewRound completed - New round fully initialized", {
            finalCheckToSpinNext: this.uiStore.checkToSpinNext,
            finalTumblesCount: this.tumblesStore.tumbles.length,
            finalTotalWin: this.uiStore.totalWin,
            finalMultiplier: this.uiStore.multiplier,
            finalIsHyperSpinActive: this.uiStore.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });
    }

    changeCascadingState(state: string) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] changeCascadingState called", {
            previousState: this.uiStore.cascadingState,
            newState: state,
            previousIsSpinningFSB: this.fsbPromotionUIStore.isSpinningFSB,
            newIsSpinningFSB: state === CascadingSlotState.SPINNING,
            timestamp: new Date().toISOString()
        });

        this.uiStore.cascadingState = state;
        this.fsbPromotionUIStore.isSpinningFSB = state === CascadingSlotState.SPINNING;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Cascading state changed successfully", {
            currentState: this.uiStore.cascadingState,
            currentIsSpinningFSB: this.fsbPromotionUIStore.isSpinningFSB,
            timestamp: new Date().toISOString()
        });
    }

    handleTurboModeUI(isTurboModeUI: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTurboModeUI called", {
            previousIsTurboModeUI: this.uiStore.isTurboModeUI,
            newIsTurboModeUI: isTurboModeUI,
            timestamp: new Date().toISOString()
        });

        this.uiStore.isTurboModeUI = isTurboModeUI;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Turbo mode UI state updated", {
            currentIsTurboModeUI: this.uiStore.isTurboModeUI,
            timestamp: new Date().toISOString()
        });
    }

    handleBottomMessage(state: string) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleBottomMessage called", {
            requestedState: state,
            currentBottomMessageState: this.uiStore.bottomMessageState,
            isFreespinsState: this.uiStore.bottomMessageState === SlotNotification.FREESPINS,
            isAutoSpinState: this.uiStore.bottomMessageState === SlotNotification.AUTO_SPIN,
            timestamp: new Date().toISOString()
        });

        if (
            this.uiStore.bottomMessageState === SlotNotification.FREESPINS ||
            this.uiStore.bottomMessageState === SlotNotification.AUTO_SPIN
        ) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Bottom message change blocked - protected state", {
                blockedState: this.uiStore.bottomMessageState,
                requestedState: state,
                timestamp: new Date().toISOString()
            });
            return;
        }

        this.uiStore.bottomMessageState = state;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Bottom message state updated", {
            newBottomMessageState: this.uiStore.bottomMessageState,
            timestamp: new Date().toISOString()
        });
    }

    handleFreespinsJoinGame(freespins: any) {
        // Warn when free spins are received from service join game message
        if (freespins && (freespins.total > 0 || freespins.length > 0)) {
            console.warn("🎰 FREESPIN JOIN GAME: Free spins received from join game service message", {
                freespinsTotal: freespins?.total || 0,
                freespinsLength: freespins?.length || 0,
                source: "join_game_service_message",
                messageType: GameServiceMessageCascading.CascadingFreeSpinsMsg.eventName,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFreespinsJoinGame called", {
            freespins,
            hasFreespins: !!freespins,
            freespinsTotal: freespins?.total,
            freespinsLength: freespins?.length,
            hasLastSetting: !!this.betControlStore.lastSetting,
            lastSetting: this.betControlStore.lastSetting,
            timestamp: new Date().toISOString()
        });

        if (!freespins || freespins.total === 0 || freespins.length === 0) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No valid freespins - initializing bet controls with last settings", {
                condition: !freespins ? "no freespins object" : freespins.total === 0 ? "total is 0" : "length is 0",
                hasLastSetting: !!this.betControlStore.lastSetting,
                timestamp: new Date().toISOString()
            });

            if (this.betControlStore.lastSetting) {
                const { betLevel, coinValue } = this.betControlStore.lastSetting;
                cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Initializing bet controls with last settings", {
                    betLevel,
                    coinValue,
                    timestamp: new Date().toISOString()
                });
                this.betControlHandlers.init(coinValue, betLevel);
            } else {
                cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Initializing bet controls with default settings", {
                    timestamp: new Date().toISOString()
                });
                this.betControlHandlers.init();
            }
            return;
        }

        const { total, betLevel, coinValue, betMultiplier } = freespins;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Processing valid freespins data", {
            total,
            betLevel,
            coinValue,
            betMultiplier,
            hasPromotionId: !!freespins.promotionId,
            hasBuyFreeSpins: !!freespins?.buyFreeSpins,
            timestamp: new Date().toISOString()
        });

        this.handleFreeSpinsTotal(total);
        this.updateFreespinCountMsgBottom(total);
        this.handleTriggerDuringFreeSpinBonus();

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Initializing bet controls for freespins", {
            coinValue,
            betLevel,
            calculatedTotalBet: calculateTotalBet(betLevel, coinValue, betMultiplier),
            timestamp: new Date().toISOString()
        });

        this.betControlHandlers.init(coinValue, betLevel);
        this.betControlHandlers.setTotalBet(calculateTotalBet(betLevel, coinValue, betMultiplier));

        if (freespins.promotionId) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Setting FSB promotion resume flag", {
                promotionId: freespins.promotionId,
                previousResumedFSBPromotion: this.fsbPromotionUIStore.resumedFSBPromotion,
                timestamp: new Date().toISOString()
            });
            this.fsbPromotionUIStore.resumedFSBPromotion = true;
        }

        if (freespins?.buyFreeSpins) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Activating buy freespins", {
                previousIsActive: this.buyFsStore.isActive,
                timestamp: new Date().toISOString()
            });
            this.buyFsStore.isActive = true;
        }

        if (total > 0) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Triggering auto play for freespins", {
                total,
                timestamp: new Date().toISOString()
            });
            this.buyFsStore.triggerAutoPlay = {};
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFreespinsJoinGame completed", {
            finalFreeSpinsTotal: this.uiStore.freeSpinsTotal,
            finalBuyFsIsActive: this.buyFsStore.isActive,
            finalResumedFSBPromotion: this.fsbPromotionUIStore.resumedFSBPromotion,
            timestamp: new Date().toISOString()
        });
    }

    protected clearFreeSpins() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] clearFreeSpins called", {
            previousFreeSpinsTotal: this.uiStore.freeSpinsTotal,
            previousFreeSpinsByRound: this.uiStore.freeSpinsByRound,
            timestamp: new Date().toISOString()
        });

        this.uiStore.freeSpinsTotal = 0;
        this.uiStore.freeSpinsByRound = 0;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spins cleared", {
            newFreeSpinsTotal: this.uiStore.freeSpinsTotal,
            newFreeSpinsByRound: this.uiStore.freeSpinsByRound,
            timestamp: new Date().toISOString()
        });
    }

    handleTotalMultiplier(totalMultiplier: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTotalMultiplier called", {
            totalMultiplier,
            previousTotalMultiplier: this.uiStore.totalMultiplier,
            previousPortraitShowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
            willShowMultiplierView: totalMultiplier > 0,
            timestamp: new Date().toISOString()
        });

        if (totalMultiplier > 0) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Enabling total multiplier view", {
                totalMultiplier,
                timestamp: new Date().toISOString()
            });
            this.uiStore.portraitshowTotalMultiplierView = true;
        }

        this.uiStore.totalMultiplier = totalMultiplier;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Total multiplier updated", {
            newTotalMultiplier: this.uiStore.totalMultiplier,
            newPortraitShowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
            timestamp: new Date().toISOString()
        });
    }

    setPeekEffect(show: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] setPeekEffect called", {
            show,
            previousActivePeekEffect: this.uiStore.activePeekEffect,
            timestamp: new Date().toISOString()
        });

        this.uiStore.activePeekEffect = show;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Peek effect state updated", {
            newActivePeekEffect: this.uiStore.activePeekEffect,
            timestamp: new Date().toISOString()
        });
    }

    handleHaveBigWin(bigwin: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleHaveBigWin called", {
            bigwin,
            hasFinishData: !!this.settlementStore.finishData,
            activePeekEffect: this.uiStore.activePeekEffect,
            finishDataFreeSpins: this.settlementStore?.finishData?.freeSpins,
            timestamp: new Date().toISOString()
        });

        if (!this.settlementStore.finishData) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No finish data available - skipping big win handling", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const isPeekEffectSuccess = this.settlementStore?.finishData?.freeSpins > 0 && this.uiStore.activePeekEffect;
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Evaluating big win conditions", {
            bigwin,
            isPeekEffectSuccess,
            freeSpins: this.settlementStore?.finishData?.freeSpins,
            activePeekEffect: this.uiStore.activePeekEffect,
            willSetHaveBigWin: bigwin && !isPeekEffectSuccess,
            willSetBigWinCompleted: !bigwin || isPeekEffectSuccess,
            timestamp: new Date().toISOString()
        });

        if (bigwin && !isPeekEffectSuccess) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Setting haveBigWin to true", {
                timestamp: new Date().toISOString()
            });
            this.uiStore.haveBigWin = bigwin;
        } else {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Setting isBigWinCompleted to true", {
                timestamp: new Date().toISOString()
            });
            this.uiStore.isBigWinCompleted = true;
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Big win handling completed", {
            finalHaveBigWin: this.uiStore.haveBigWin,
            finalIsBigWinCompleted: this.uiStore.isBigWinCompleted,
            timestamp: new Date().toISOString()
        });
    }

    handleBigWinAmount(win: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleBigWinAmount called", {
            win,
            previousBigWinAmount: this.uiStore.bigWinAmount,
            timestamp: new Date().toISOString()
        });

        this.uiStore.bigWinAmount = win;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Big win amount updated", {
            newBigWinAmount: this.uiStore.bigWinAmount,
            timestamp: new Date().toISOString()
        });
    }

    handleBigWinCompleted(completed: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleBigWinCompleted called", {
            completed,
            hasFinishData: !!this.settlementStore.finishData,
            previousHaveBigWin: this.uiStore.haveBigWin,
            previousIsBigWinCompleted: this.uiStore.isBigWinCompleted,
            triggerDuringFreeSpinBonus: this.uiStore.triggerDuringFreeSpinBonus,
            finishDataFreeSpins: this.settlementStore?.finishData?.freeSpins,
            timestamp: new Date().toISOString()
        });

        if (!this.settlementStore.finishData) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No finish data available - skipping big win completion", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        const { freeSpins } = this.settlementStore.finishData;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Processing big win completion", {
            freeSpins,
            willHandleFreeSpinEffectCompleted: freeSpins <= 0,
            timestamp: new Date().toISOString()
        });

        this.uiStore.haveBigWin = false;
        this.uiStore.isBigWinCompleted = completed;

        if (freeSpins <= 0) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No free spins remaining - handling free spin effect completion", {
                timestamp: new Date().toISOString()
            });
            this.handleFreeSpinEffectCompleted(true);
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Big win completion handling finished", {
            finalHaveBigWin: this.uiStore.haveBigWin,
            finalIsBigWinCompleted: this.uiStore.isBigWinCompleted,
            timestamp: new Date().toISOString()
        });
    }

    handleHaveFreeSpin(haveFreeSpin: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleHaveFreeSpin called", {
            haveFreeSpin,
            previousHaveFreeSpin: this.uiStore.haveFreeSpin,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        // In hyper-spin batch mode, prevent free-spin effect UI from showing only when stopOnFeature is false
        // When stopOnFeature is true, free spins should run normally with UI effects even in hyper-spin mode
        // This ensures no animations, popups, or effects are displayed during batch mode optimization
        if (this.uiStore.isHyperSpinActive && haveFreeSpin && !this.hyperSpinStore.stopOnFeature) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Skipping free-spin effect UI during hyper-spin batch mode (stopOnFeature=false)", {
                haveFreeSpin,
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                note: "Free-spin will play without UI effects in batch mode",
                timestamp: new Date().toISOString()
            });
            // Don't set haveFreeSpin = true to prevent isShowFreeSpinEffect from becoming true
            // This prevents freespin effect container, mascot animations, and other UI effects
            this.uiStore.haveFreeSpin = false;
        } else {
            if (haveFreeSpin && this.uiStore.isHyperSpinActive && this.hyperSpinStore.stopOnFeature) {
                console.warn("🎰 FREESPIN TRIGGERED WITH UI: Free-spin effects will be shown in hyper-spin mode (stopOnFeature=true)", {
                    haveFreeSpin,
                    isHyperSpinActive: this.uiStore.isHyperSpinActive,
                    stopOnFeature: this.hyperSpinStore.stopOnFeature,
                    timestamp: new Date().toISOString()
                });
            } else if (haveFreeSpin && !this.uiStore.isHyperSpinActive) {
                console.warn("🎰 FREESPIN TRIGGERED: Free-spin effects will be shown in normal game mode", {
                    haveFreeSpin,
                    isHyperSpinActive: this.uiStore.isHyperSpinActive,
                    timestamp: new Date().toISOString()
                });
            }
            this.uiStore.haveFreeSpin = haveFreeSpin;
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spin state updated", {
            newHaveFreeSpin: this.uiStore.haveFreeSpin,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });
    }

    handleFreeSpinEffectCompleted(completed: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFreeSpinEffectCompleted called", {
            completed,
            previousHaveFreeSpin: this.uiStore.haveFreeSpin,
            previousIsFreeSpinEffectCompleted: this.uiStore.isFreeSpinEffectCompleted,
            triggerDuringFreeSpinBonus: this.uiStore.triggerDuringFreeSpinBonus,
            timestamp: new Date().toISOString()
        });

        this.handleFadeBGM(!this.uiStore.triggerDuringFreeSpinBonus);
        this.uiStore.haveFreeSpin = false;
        this.uiStore.isFreeSpinEffectCompleted = completed;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spin effect completion updated", {
            newHaveFreeSpin: this.uiStore.haveFreeSpin,
            newIsFreeSpinEffectCompleted: this.uiStore.isFreeSpinEffectCompleted,
            timestamp: new Date().toISOString()
        });
    }

    handleHighlightScattersCompleted(completed: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleHighlightScattersCompleted called", {
            completed,
            previousIsHighlightScattersCompleted: this.uiStore.isHighlightScattersCompleted,
            timestamp: new Date().toISOString()
        });

        this.uiStore.isHighlightScattersCompleted = completed;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Highlight scatters completion updated", {
            newIsHighlightScattersCompleted: this.uiStore.isHighlightScattersCompleted,
            timestamp: new Date().toISOString()
        });
    }

    handleChangeMode(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleChangeMode called", {
            isTrialMode,
            previousIsTrialMode: this.uiStore.isTrialMode,
            previousCascadingState: this.uiStore.cascadingState,
            previousBottomMessageState: this.uiStore.bottomMessageState,
            previousIsTurboModeUI: this.uiStore.isTurboModeUI,
            previousRoundId: this.uiStore.roundId,
            timestamp: new Date().toISOString()
        });

        this.uiStore.isTrialMode = isTrialMode;

        if (isTrialMode) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Switching to trial mode", {
                settingBottomMessageState: SlotNotification.BEFORE_SPIN_TRIAL,
                settingIsTurboModeUI: false,
                timestamp: new Date().toISOString()
            });
            this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN_TRIAL;
            this.uiStore.isTurboModeUI = false;
        } else {
            const newBottomMessageState = this.uiStore.cascadingState !== CascadingSlotState.READY_BET
                ? SlotNotification.SETTLED
                : SlotNotification.BEFORE_SPIN;
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Switching to normal mode", {
                cascadingState: this.uiStore.cascadingState,
                settingBottomMessageState: newBottomMessageState,
                timestamp: new Date().toISOString()
            });
            this.uiStore.bottomMessageState = newBottomMessageState;
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Resetting round and clearing settings", {
            settingRoundId: 0,
            previousNeedClearLastSetting: this.betControlStore.needClearLastSetting,
            willCallHandleNewRound: true,
            willCallSaveGameUserSettings: true,
            timestamp: new Date().toISOString()
        });

        this.uiStore.roundId = 0;
        this.handleNewRound();
        this.betControlStore.needClearLastSetting = true;
        this.saveGameUserSettings();

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Mode change completed", {
            finalIsTrialMode: this.uiStore.isTrialMode,
            finalBottomMessageState: this.uiStore.bottomMessageState,
            finalIsTurboModeUI: this.uiStore.isTurboModeUI,
            finalRoundId: this.uiStore.roundId,
            finalNeedClearLastSetting: this.betControlStore.needClearLastSetting,
            timestamp: new Date().toISOString()
        });
    }

    saveGameUserSettings() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] saveGameUserSettings called", {
            gameUserSettingHandlerExists: !!this.gameUserSettingHandler,
            timestamp: new Date().toISOString()
        });

        this.gameUserSettingHandler.saveTempStorage();

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Game user settings saved", {
            timestamp: new Date().toISOString()
        });
    }

    updateFreespinCountMsgBottom(count: number) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] updateFreespinCountMsgBottom called", {
            count,
            previousBottomMessageState: this.uiStore.bottomMessageState,
            previousFreespinCountMsgBottom: this.uiStore.freespinCountMsgBottom,
            settingBottomMessageState: SlotNotification.FREESPINS,
            timestamp: new Date().toISOString()
        });

        this.uiStore.bottomMessageState = SlotNotification.FREESPINS;
        this.uiStore.freespinCountMsgBottom = count;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Freespin count message updated", {
            newBottomMessageState: this.uiStore.bottomMessageState,
            newFreespinCountMsgBottom: this.uiStore.freespinCountMsgBottom,
            timestamp: new Date().toISOString()
        });
    }

    updateConnectedTrialService(connected: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] updateConnectedTrialService called", {
            connected,
            previousIsConnectedTrialService: this.uiStore.isConnectedTrialService,
            timestamp: new Date().toISOString()
        });

        this.uiStore.isConnectedTrialService = connected;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Trial service connection updated", {
            newIsConnectedTrialService: this.uiStore.isConnectedTrialService,
            timestamp: new Date().toISOString()
        });
    }

    handleChangeUserBalance(change: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleChangeUserBalance called", {
            change,
            previousChangeUserBalance: this.uiStore.changeUserBalance,
            timestamp: new Date().toISOString()
        });

        this.uiStore.changeUserBalance = change;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] User balance change flag updated", {
            newChangeUserBalance: this.uiStore.changeUserBalance,
            timestamp: new Date().toISOString()
        });
    }

    setReachMaxWin(show: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] setReachMaxWin called", {
            show,
            previousShowReachMaxWin: this.uiStore.showReachMaxWin,
            timestamp: new Date().toISOString()
        });

        this.uiStore.showReachMaxWin = show;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Reach max win display updated", {
            newShowReachMaxWin: this.uiStore.showReachMaxWin,
            timestamp: new Date().toISOString()
        });
    }

    handleTriggerWinMultiplier() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTriggerWinMultiplier called", {
            previousTriggerWinMultiplier: this.uiStore.triggerWinMultiplier,
            timestamp: new Date().toISOString()
        });

        this.uiStore.triggerWinMultiplier = {};

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Win multiplier trigger set", {
            newTriggerWinMultiplier: this.uiStore.triggerWinMultiplier,
            timestamp: new Date().toISOString()
        });
    }

    handleTriggerDuringFreeSpinBonus(trigger = {}) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleTriggerDuringFreeSpinBonus called", {
            trigger,
            allowFreeSpinsFeature: resourcesCache.gameFeatures?.allowFreeSpinsFeature,
            previousTriggerDuringFreeSpinBonus: this.uiStore.triggerDuringFreeSpinBonus,
            isHyperSpinActive: this.uiStore.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        if (!resourcesCache.gameFeatures?.allowFreeSpinsFeature) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spins feature not allowed - skipping trigger", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        // In hyper-spin batch mode, skip free-spin UI effects (background change, music, etc.) only when stopOnFeature is false
        // When stopOnFeature is true, allow normal free-spin UI effects even in hyper-spin mode
        // This ensures free-spin plays silently without UI interruptions only in batch optimization mode
        if (this.uiStore.isHyperSpinActive && trigger && !this.hyperSpinStore.stopOnFeature) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Skipping free-spin bonus trigger during hyper-spin batch mode (stopOnFeature=false)", {
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                note: "Free-spin will play without background change or music in batch mode",
                timestamp: new Date().toISOString()
            });
            // Don't set triggerDuringFreeSpinBonus to prevent background change
            return;
        } else if (this.uiStore.isHyperSpinActive && trigger && this.hyperSpinStore.stopOnFeature) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Allowing free-spin bonus trigger during hyper-spin mode (stopOnFeature=true)", {
                isHyperSpinActive: this.uiStore.isHyperSpinActive,
                stopOnFeature: this.hyperSpinStore.stopOnFeature,
                note: "Free-spin will play with background change and music in hyper-spin mode",
                timestamp: new Date().toISOString()
            });
        }

        this.uiStore.triggerDuringFreeSpinBonus = trigger;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Free spin bonus trigger updated", {
            newTriggerDuringFreeSpinBonus: this.uiStore.triggerDuringFreeSpinBonus,
            timestamp: new Date().toISOString()
        });
    }

    handleFadeBGM(fadeBGM: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleFadeBGM called", {
            fadeBGM,
            previousFadeBGM: this.uiStore.fadeBGM,
            timestamp: new Date().toISOString()
        });

        this.uiStore.fadeBGM = { value: fadeBGM };

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] BGM fade state updated", {
            newFadeBGM: this.uiStore.fadeBGM,
            timestamp: new Date().toISOString()
        });
    }

    handleShowTotalMultiplierView(move: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleShowTotalMultiplierView called", {
            move,
            previousPortraitshowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
            timestamp: new Date().toISOString()
        });

        this.uiStore.portraitshowTotalMultiplierView = move;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Total multiplier view display updated", {
            newPortraitshowTotalMultiplierView: this.uiStore.portraitshowTotalMultiplierView,
            timestamp: new Date().toISOString()
        });
    }

    triggerOpenDialog(name: string) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] triggerOpenDialog called", {
            name,
            previousDialogOpenEvent: this.uiStore.dialogOpenEvent,
            timestamp: new Date().toISOString()
        });

        this.uiStore.dialogOpenEvent = { name };

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Dialog open event triggered", {
            newDialogOpenEvent: this.uiStore.dialogOpenEvent,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Check for interrupted hyper-spin batches on game initialization and offer recovery
     */
    checkHyperSpinBatchRecovery() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] checkHyperSpinBatchRecovery called", {
            hasHyperSpinStore: !!this.hyperSpinStore,
            hasCurrentBatchData: !!this.hyperSpinStore?.currentBatchData,
            batchStatus: this.hyperSpinStore?.currentBatchData?.summary.hyperSpinStatus,
            timestamp: new Date().toISOString()
        });

        if (!this.hyperSpinStore?.currentBatchData) {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No batch data found - no recovery needed", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        const batchStatus = this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus;
        const roundsRemaining = this.hyperSpinStore.roundsHyperSpin;

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Checking batch recovery conditions", {
            batchStatus,
            roundsRemaining,
            isHyperSpinActive: this.hyperSpinStore.isHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Check if batch was interrupted
        if (batchStatus === "Interrupted" && roundsRemaining > 0) {
            cascadingSlotLogger.warn("[CASCADING_UI_HANDLER] Interrupted hyper-spin batch detected", {
                roundsRemaining,
                totalRounds: this.hyperSpinStore.roundsList[this.hyperSpinStore.roundsList.indexOf(this.hyperSpinStore.selectedRoundOnPopup)] || this.hyperSpinStore.selectedRoundOnPopup,
                timestamp: new Date().toISOString()
            });

            // Show recovery dialog
            this.showBatchRecoveryDialog();
        } else if (batchStatus === "Playing" && !this.hyperSpinStore.isHyperSpin) {
            // Batch was in progress but hyper-spin is not active - likely due to game restart
            cascadingSlotLogger.warn("[CASCADING_UI_HANDLER] Incomplete hyper-spin batch detected on game restart", {
                batchStatus,
                roundsRemaining,
                isHyperSpinActive: this.hyperSpinStore.isHyperSpin,
                timestamp: new Date().toISOString()
            });

            // Mark as interrupted and show recovery options
            this.hyperSpinStore.currentBatchData.summary.hyperSpinStatus = "Interrupted";
            this.showBatchRecoveryDialog();
        } else {
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] No batch recovery needed", {
                batchStatus,
                roundsRemaining,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Show recovery dialog for interrupted batch
     */
    private showBatchRecoveryDialog() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] showBatchRecoveryDialog called", {
            timestamp: new Date().toISOString()
        });

        // For now, show a notification. In a full implementation, this would show a proper dialog
        const message = "An interrupted Hyper-Spin batch was detected. The batch will be available for recovery.";
        cascadingSlotLogger.warn("[HYPER_SPIN_RECOVERY] " + message);

        // Update UI state to indicate recovery is available
        if (this.uiStore) {
            this.uiStore.bottomMessageState = "HYPER_SPIN_RECOVERY_AVAILABLE";
        }
    }

    /**
     * Handle user choice for batch recovery
     */
    handleBatchRecoveryChoice(recover: boolean) {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] handleBatchRecoveryChoice called", {
            recover,
            hasHyperSpinStore: !!this.hyperSpinStore,
            timestamp: new Date().toISOString()
        });

        if (recover) {
            // Attempt to recover the batch using HyperSpinHandler
            // This would typically be called through the handler system
            cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Batch recovery requested - would call HyperSpinHandler.recoverInterruptedBatch()", {
                timestamp: new Date().toISOString()
            });

            // For now, directly call the store method since we have access to it
            const recoverySuccess = this.hyperSpinStore?.recoverInterruptedBatch();
            if (recoverySuccess) {
                cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Batch recovery successful", {
                    timestamp: new Date().toISOString()
                });
            } else {
                cascadingSlotLogger.error("[CASCADING_UI_HANDLER] Batch recovery failed", {
                    timestamp: new Date().toISOString()
                });
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
        cascadingSlotLogger.error("[HYPER_SPIN_RECOVERY] " + message);
        // Could show a notice here if noticeStore is available
    }

    /**
     * Clean up interrupted batch data
     */
    private cleanupInterruptedBatch() {
        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] cleanupInterruptedBatch called", {
            timestamp: new Date().toISOString()
        });

        if (this.hyperSpinStore) {
            this.hyperSpinStore.clearBatchData();
            this.hyperSpinStore.setHyperSpinActive(false);
        }

        if (this.uiStore) {
            this.uiStore.bottomMessageState = SlotNotification.BEFORE_SPIN;
        }

        cascadingSlotLogger.info("[CASCADING_UI_HANDLER] Interrupted batch cleaned up", {
            timestamp: new Date().toISOString()
        });
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
