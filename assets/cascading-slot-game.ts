import gc from "@sg/game-client-base";
import { _decorator, Game, game, JsonAsset, Label, Node } from "cc";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { StaticNode } from "db://shared-components/shared/common-components/static-node/scripts/static-node";
import { StaticGroupId } from "db://shared-components/shared/common-components/static-node/scripts/static-node-info";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import Observer from "observer";
import { cascadingSlotLogger } from "./cascading-slot-logger";

import { FSBPromotionUIManager } from "db://shared-common-slot/fsb-promotion/scripts/components/fsb-promotion-ui-manager";
import { FSBPromotionUIHandler } from "db://shared-common-slot/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import {
    FreeSpinSignal,
    FreeSpinSource,
    FSBPromotionUIStore,
} from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { GameComponentBase } from "db://shared-components/game/scripts/components/game-component-base";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { GameVisibility } from "db://shared-components/shared/common-components/game-visibility/game-visibility";
import { GameVisibilityStore } from "db://shared-components/shared/common-components/game-visibility/game-visibility-store";
import { CascadingSlotConfig } from "./cascading-slot-base-configs";
import { ColorJson, convertData, DialogName, GameFeatureJson, getCustomDuration, resourcesCache } from "./cascading-slot-utils";
import { CascadingSlotBoard } from "./components/slot-board/components/cascading-slot-board";
import { TotalMultiplierView } from "./components/total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "./components/tumbles/tumble-win-view";
import { AutoPlayHandler } from "./handlers/auto-play-handlers";
import { CascadingSlotErrorHandler } from "./handlers/cascading-slot-error-handler";
import { CascadingUIHandler } from "./handlers/cascading-ui-handler";
import { HyperSpinHandler } from "./handlers/hyper-spin-handler";
import { CascadingSlotSettlementStore } from "./stores/cascading-slot-settlement-store";
import { CascadingUIStore } from "./stores/cascading-ui-store";
import { HyperSpinStore } from "./stores/hyper-spin-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Rounds, Connection, HideGame, Settlements, FormatUtils, RoundHistories } = gc;

@ccclass
export class CascadingSlotGame extends GameComponentBase {
    @property(CascadingSlotBoard)
    board: CascadingSlotBoard = null;

    @property(TotalMultiplierView)
    totalMultiplierView: TotalMultiplierView = null;

    @property(TumbleWinWiew)
    tumbleWinView: TumbleWinWiew = null;

    @property(Node)
    effectContainer: Node = null;

    @property(Label)
    lblRoundId: Label = null;

    @property(Label)
    lblMinBet: Label = null;

    @property(Label)
    lblMaxBet: Label = null;

    @property(Label)
    lblBalance: Label = null;

    @property(JsonAsset)
    colorInfo: JsonAsset = null;

    @property(JsonAsset)
    gameFeatureInfo: JsonAsset = null;

    public isTurboMode = false;
    private isHyperSpinActive = false;
    private stopOnFeature = false;

    onLoad() {

        this.initConfig();
        this.registerEventShowHideGame();
        this.initUserSettings();
        this.node.addComponent(GameVisibility);
        this.focusGameCanvas();
        this.addComponent(FSBPromotionUIManager);

    }

    initConfig() {

        resourcesCache.colorJson = this.colorInfo.json as ColorJson;
        resourcesCache.gameFeatures = this.gameFeatureInfo.json as GameFeatureJson;

    }

    start() {

        this.loadSlotSymbols();
        this.board.colorInfo = this.colorInfo;
        this.board.initBoardFullItems();

    }

    protected registerEventShowHideGame() {

        game.on(Game.EVENT_HIDE, this.onHideGame, this);
        game.on(Game.EVENT_SHOW, this.onShowGame, this);

    }

    protected clearEventShowHideGame() {

        game.off(Game.EVENT_HIDE, this.onHideGame, this);
        game.off(Game.EVENT_SHOW, this.onShowGame, this);

    }

    protected handleStaticNodeAndSetEmptyLabels() {
        const lblList: Label[] = [this?.lblRoundId, this?.lblMinBet, this?.lblMaxBet];

        if (lblList.length > 0) {
            lblList?.forEach((label, index) => {

                if (label) {
                    const component = label?.addComponent(StaticNode);
                    if (component) {
                        component.groupId = StaticGroupId.TextContainer;
                    }
                }
            });
            ComponentUtils.setEmptyLabels(lblList);
        }

    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler)
    connectToService() {
    }

    @render(gc.GameConfigs.GameSetting, (gameSetting) => gameSetting.name)
    logLoadScene(gameName: string) {
        console.timeEnd("Game Load Time");
    }

    @render(LogStore, (store) => store.message)
    logInfo(message: string) {
    }

    @handle(gc.UserSettings.UserSettingHandlers, (handle) => handle.loadStorages())
    initUserSettings() {
    }

    @handle(gc.PlayerSelections.PlayerSelectionHandlers.InitHandlers)
    initPlayerSelections() {
    }

    @handle(HideGame.HideGameHandler)
    onHideGame() {
        // reload here will run when page appears from hidden
        // to fix issue on iOS that EVENT_SHOW are not triggered when phone active
        // if (sys.os === sys.OS.IOS) {
        //     setTimeout(() => {
        //         window.location.reload();
        //     }, 100);
        // }
    }

    onShowGame() {
        window.location.reload();
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        this.handleTrialModeWithPromo(isTrialMode);
        if (!isTrialMode) {
            this.inGame();
        } else {
        }
    }

    @handle(Connection.ConnectionHandlers.InGameHandler, (handler) => handler.requestInGame())
    inGame() {

        // Check for hyper-spin batch recovery after game initialization
        setTimeout(() => {
            this.checkHyperSpinBatchRecovery();
        }, 1000); // Delay to ensure all stores are initialized
    }

    @handle(FSBPromotionUIHandler, (handler, isTrialMode: boolean) => handler.handleTrialMode(isTrialMode))
    handleTrialModeWithPromo(isTrialMode: boolean) {
        const result = isTrialMode;
        return result;
    }

    @render(CascadingUIStore, (store) => store.isFreeSpins)
    notifyFreeSpinFromGame(isActive: boolean) {
        const signal = { source: FreeSpinSource.GAME, active: isActive };
        this.notifyFreeSpin(signal);
    }

    @handle(FSBPromotionUIHandler, (handler, signal: FreeSpinSignal) => handler.handleFreeSpin(signal))
    public notifyFreeSpin(signal: FreeSpinSignal) {
        const result = signal;
        return result;
    }

    loadSlotSymbols() {

        const cache = resourcesCache.slotSymbols || {};
        let loadedCount = 0;
        let skippedCount = 0;
        let missingCount = 0;

        for (let index = 0; index < CascadingSlotConfig?.symbolCount; index++) {
            if (cache[index]) {
                skippedCount++;
                continue;
            }
            const path = `symbol-spines/symbol-${index}`;
            const asset = bundleManager.cachedAssets[path];
            if (asset) {
                cache[index] = asset;
                loadedCount++;
            } else {
                missingCount++;
            }
        }

        resourcesCache.slotSymbols = cache;

    }

    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        const settlementStartTime = Date.now();

        if (!finishData) {
            return;
        }

        this.handleChangeUserBalance(false);
        const {
            win,
            bigWin,
            megaWin,
            superWin,
            totalFreeSpins,
            isFreeSpin,
            multiplier,
            totalMultiplier,
            reachMaxWin,
            tumbles,
            result,
            actualBetwin,
            freeSpins,
        } = finishData;

        // Check if we're in hyper-spin batch mode to skip animations for faster execution
        // In hyper-spin batch mode, free-spin should play WITHOUT free UI (no animations, no popup)
        // This ensures fast batch execution while keeping hyper-spin popup open
        let isInHyperSpin = false;
        // Use CascadingUIStore.isHyperSpinActive which is synced with HyperSpinStore.isHyperSpinActive
        // via HyperSpinStore.setHyperSpinActive() method
        // Access via the reactive render property
        const isHyperSpinActive = this.isHyperSpinActive;
        // Check if free-spin is active (either this round is a free-spin or there are remaining free-spins)
        const isFreeSpinActive = isFreeSpin || totalFreeSpins > 0;

        // Add console.warn when freespin is active
        if (isFreeSpinActive) {
            console.warn("🎰 FREESPIN PLAYING: Free-spin detected in settlement", {
                isFreeSpin,
                totalFreeSpins,
                isFreeSpinActive,
                isHyperSpinActive,
                roundId: finishData.roundId,
                win,
                timestamp: new Date().toISOString()
            });
        }

        // Animation skipping logic for hyper-spin batch mode:
        // - Skip animations if hyper-spin is active AND free-spin is NOT active (normal hyper-spin)
        // - Skip animations if hyper-spin is active AND free-spin is active AND stopOnFeature is false (batch mode: no free UI)
        // - Play animations if hyper-spin is active AND free-spin is active AND stopOnFeature is true (normal free UI)
        // - Play animations if hyper-spin is NOT active (normal game mode)
        // When stopOnFeature = true, free spins should run normally with UI effects even in hyper-spin mode
        if (isHyperSpinActive && isFreeSpinActive && !this.stopOnFeature) {
            // Hyper-spin batch mode with free-spin and stopOnFeature=false: Skip all animations (no free UI)
            console.warn("🎰 FREESPIN BATCH MODE: Playing free-spin without UI in hyper-spin batch (stopOnFeature=false)", {
                isFreeSpin,
                totalFreeSpins,
                isHyperSpinActive,
                stopOnFeature: this.stopOnFeature,
                roundId: finishData.roundId,
                timestamp: new Date().toISOString()
            });
            isInHyperSpin = true;
        } else if (isHyperSpinActive && isFreeSpinActive && this.stopOnFeature) {
            // Hyper-spin mode with free-spin and stopOnFeature=true: Play animations normally
            console.warn("🎰 FREESPIN NORMAL UI: Playing free-spin with UI effects in hyper-spin mode (stopOnFeature=true)", {
                isFreeSpin,
                totalFreeSpins,
                isHyperSpinActive,
                stopOnFeature: this.stopOnFeature,
                roundId: finishData.roundId,
                timestamp: new Date().toISOString()
            });
            isInHyperSpin = false;
        } else if (isHyperSpinActive && !isFreeSpinActive) {
            // Hyper-spin batch mode without free-spin: Skip animations
            isInHyperSpin = true;
        } else {
            // Normal game mode: Play animations
            isInHyperSpin = false;
        }

        const spinResultStartTime = Date.now();

        const symbolsBoard = { symbols: convertData(result), multipliers: tumbles[0]?.multipliers, isTurbo: false, tumbles };

        await this.board.spinResult(symbolsBoard, this.isTurboMode, isInHyperSpin);

        const tumbleStartTime = Date.now();
        const spinResultDuration = tumbleStartTime - spinResultStartTime;

        await this.board.handleTumbles(tumbles, this.isTurboMode, isInHyperSpin);

        const settlementCompleteTime = Date.now();
        const tumbleDuration = settlementCompleteTime - tumbleStartTime;
        const totalSettlementDuration = settlementCompleteTime - spinResultStartTime;

        const winTumbles = tumbles.length > 1;
        const winMultiplier = multiplier > 0 && winTumbles;

        // Skip multiplier animations during hyper-spin for faster execution
        if (!isInHyperSpin) {

            winMultiplier && this.handleTriggerWinMultiplier();
            await this.board.handleMultiplier(isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        } else {
        }

        if (win > 0) {

            this.getBalance();
            this.handleChangeUserBalance(true);
            if (winTumbles && !isInHyperSpin) {
                await this.tumbleWinView.setTotalWinValue(actualBetwin);
            }
            this.handleTotalWin({ win: win, isActualWin: true });
        } else {
        }

        // Skip UI updates during hyper-spin for maximum speed
        if (!isInHyperSpin) {

            this.updateTotalWinPromo({ win, totalFreeSpins });
            this.showTotalMultiplierView(totalMultiplier, isFreeSpin, winMultiplier);
            reachMaxWin && this.setReachMaxWin(true);
            this.setTotalMultiplierValue(totalMultiplier);
        } else {
        }

        // Skip special effects during hyper-spin for maximum speed
        const isHaveBigWin = bigWin || megaWin || superWin;

        if (!isInHyperSpin) {

            this.handleHaveBigWin(isHaveBigWin);
            this.updateBigWinAmount(win);
            this.handleHaveFreeSpin(freeSpins > 0);
        } else {
        }

        // Always update free spins data

        this.setFreeSpinsByRound(freeSpins);
        this.setFreeSpinsTotal(totalFreeSpins);

        const noWinMoreFreespins = freeSpins <= 0;

        let shouldHandleFreeSpinEffectCompleted = noWinMoreFreespins && !isHaveBigWin;

        // In hyper-spin mode, immediately mark effects as completed since we don't show UI anyway
        // This prevents the batch from getting stuck waiting for non-existent free spin effects
        if (isInHyperSpin && noWinMoreFreespins) {
            this.handleFreeSpinEffectCompleted(true);
            shouldHandleFreeSpinEffectCompleted = false; // Don't call it again
        } else if (isInHyperSpin && isFreeSpinActive && !noWinMoreFreespins) {
            // In hyper-spin mode with active free spins, force effect completion to continue the batch
            // This ensures free spin rounds progress automatically without waiting for UI effects
            this.handleFreeSpinEffectCompleted(true);
        }

        if (shouldHandleFreeSpinEffectCompleted) {
            console.warn("🎰 FREESPIN COMPLETED: Free spin effects completed, proceeding to next round", {
                noWinMoreFreespins,
                isHaveBigWin,
                isInHyperSpin,
                freeSpins,
                totalFreeSpins,
                timestamp: new Date().toISOString()
            });
            console.warn("[CASCADING_SLOT_GAME] Handling free spin effect completion");
            this.handleFreeSpinEffectCompleted(true);
        }
        // else {
        //     cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Skipping free spin effect completion - continuing hyper-spin batch", {
        //         isInHyperSpin,
        //         shouldHandleFreeSpinEffectCompleted,
        //         timestamp: new Date().toISOString()
        //     });

        //     this.handleFreeSpinEffectCompleted(false);

        //     // In hyper-spin mode, when we skip free spin effects, we need to continue the batch directly
        //     if (isInHyperSpin) {
        //         cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Continuing hyper-spin batch after skipping free spin effects", {
        //             timestamp: new Date().toISOString()
        //         });
        //         this.checkHyperSpinNextRound();
        //     }
        // }

        // Record spin data for hyper-spin batch tracking
        if (isInHyperSpin) {
            this.recordHyperSpinSpinData(finishData);
        }

    }

    @handle(HyperSpinHandler, (handler, finishData: any) => handler.handleRecordSpinData(finishData))
    recordHyperSpinSpinData(finishData: any) {
        return finishData;
    }

    protected async showTotalMultiplierView(totalMultiplier: number, isFreeSpin: boolean, winMultiplier: boolean) {
        const showStartTime = Date.now();

        const needShowTotalMultiplier = totalMultiplier > 0;

        if (winMultiplier && isFreeSpin && needShowTotalMultiplier) {
            await this.totalMultiplierView.showView(true);
            await this.board.movingMultiplier(
                this.tumbleWinView.multiplier.node,
                this.effectContainer,
                this.totalMultiplierView.total.node
            );
            const showDuration = Date.now() - showStartTime;
        } else {
        }
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    handleFreeSpinEffectCompleted(completed: boolean) {
        const result = completed;
        return result;
    }

    @render(CascadingUIStore, (store) => store.isHyperSpinActive)
    renderHyperSpinActive(isHyperSpinActive: boolean) {
        this.isHyperSpinActive = isHyperSpinActive;
    }

    @render(HyperSpinStore, (store) => store.stopOnFeature)
    renderStopOnFeature(stopOnFeature: boolean) {
        this.stopOnFeature = stopOnFeature;
    }

    @render(CascadingUIStore, (store) => store.isFreeSpinEffectCompleted)
    async checkNextRound(isFreeSpinEffectCompleted: boolean) {
        const nextRoundCheckStart = Date.now();

        if (isFreeSpinEffectCompleted) {

            // Skip delay entirely for hyper-spin mode to achieve faster spinning
            // Use reactive render property for hyper-spin detection
            const isInHyperSpin = this.isHyperSpinActive;
            const delayForNextSpin = isInHyperSpin ? 0 : getCustomDuration("delayForNextSpin", this.isTurboMode);

            if (delayForNextSpin > 0) {
                await AnimationUtils.delayTime(delayForNextSpin);
            } else {
            }

            const afterDelayTime = Date.now();
            const actualDelay = afterDelayTime - nextRoundCheckStart;

            // Enable autoplay when free spin effect is completed
            this.enableAutoPlayOnFreeSpinCompleted();

            // When the free spin effect is completed, handle the next round
            // by automatically spinning

            this.handleEndGameApiError();
            this.checkSpinNextRound();

            const hyperSpinCheckStart = Date.now();

            this.checkHyperSpinNextRound();
        } else {
        }

        const checkNextRoundDuration = Date.now() - nextRoundCheckStart;
    }

    @handle(CascadingSlotErrorHandler, (handler) => handler.handleEndGameApiError())
    handleEndGameApiError() {
    }

    @handle(AutoPlayHandler, (handler) => handler.checkAutoPlayWhenSettlementCompleted())
    enableAutoPlayOnFreeSpinCompleted() {
    }

    @render(CascadingUIStore, (store) => store.roundId)
    renderRoundId(roundId: number) {

        if (roundId < 1) {
            this.lblRoundId && (this.lblRoundId.string = "");
            return;
        }

        const roundIdString = `#${roundId}`;
        this.lblRoundId && (this.lblRoundId.string = roundIdString);
    }

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsTotal(freespins))
    setFreeSpinsTotal(freespins: number) {
        const result = freespins;
        return result;
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsByRound(freespins))
    setFreeSpinsByRound(freespins: number) {
        const result = freespins;
        return result;
    }

    @handle(AutoPlayHandler, (handler) => handler.checkSpinNextRound())
    checkSpinNextRound() {
    }

    @handle(HyperSpinHandler, (handler) => handler.checkHyperSpinNextRound())
    checkHyperSpinNextRound() {
        // The @handle decorator will automatically call the HyperSpinHandler.checkHyperSpinNextRound() method
    }

    @render(FSBPromotionUIStore, (store) => store.changeUserBalance)
    handleUpdateBalance(isUpdateBalance: boolean) {
        if (isUpdateBalance) {
            this.handleChangeUserBalance(true);
        } else {
        }
    }

    @render(CascadingUIStore, (store) => ({ balance: store.userBalance, changedBalance: store.changeUserBalance }))
    setBalance(data: { balance: number; changedBalance: boolean }) {

        if (!data || !data.changedBalance) {
            return;
        }

        const value = data.balance;
        if (value === undefined || value === null) {
            return;
        }

        const formattedBalance = FormatUtils.truncateFixedDecimals(value, 2).toString();
        this.lblBalance && (this.lblBalance.string = formattedBalance);
    }

    @handle(gc.Auth.AuthHandlers.GetBalance)
    getBalance() {
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }

    @handle(CascadingUIHandler, (handle, multiplier: number) => handle.handleTotalMultiplier(multiplier))
    setTotalMultiplierValue(totalMultiplier: number) {
        const result = totalMultiplier;
        return result;
    }

    @handle(CascadingUIHandler, (handle, bigWin: any) => handle.handleHaveBigWin(bigWin))
    handleHaveBigWin(bigwin: boolean) {
        const result = bigwin;
        return result;
    }

    @handle(CascadingUIHandler, (handle, isShow: any) => handle.setReachMaxWin(isShow))
    setReachMaxWin(isShow: boolean) {
        const result = isShow;
        return result;
    }

    @handle(CascadingUIHandler, (handle, win: number) => handle.handleBigWinAmount(win))
    updateBigWinAmount(win: number) {
        const result = win;
        return result;
    }

    @handle(CascadingUIHandler, (handle, freespin: any) => handle.handleHaveFreeSpin(freespin))
    handleHaveFreeSpin(freespin: boolean) {
        const result = freespin;
        return result;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        const result = changed;
        return result;
    }

    @handle(CascadingUIHandler, (handle, params: any) => handle.handleTotalWin(params))
    handleTotalWin(params: { win: number; isActualWin: boolean }) {
        const result = params;
        return result;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        const result = id;
        return result;
    }

    private focusGameCanvas() {
        // Auto-focus the game canvas when loading
        if (game.canvas) {
            // Set initial focus
            setTimeout(() => {
                game.canvas.focus();
            }, 100);
        } else {
        }
    }

    @render(GameVisibilityStore, (store) => store.isVisible)
    renderGameVisibility(isVisible: boolean) {

        if (!isVisible) {

            // Check if hyper-spin batch should be interrupted when game is hidden
            if (this.isHyperSpinActive) {

                // Mark batch as interrupted due to game visibility change
                this.handleHyperSpinInterruptionDueToGameHide();
            }

            this.handleOnGameHide();
        } else {
        }
    }

    @handle(CascadingUIHandler, (handler) => handler.handleOnGameHide())
    handleOnGameHide() {
    }

    /**
     * Handle hyper-spin interruption when game is hidden
     */
    private handleHyperSpinInterruptionDueToGameHide() {

        // The interruption will be detected by the HyperSpinHandler.checkHyperSpinNextRound()
        // when it next runs and finds the game is hidden
    }

    @handle(CascadingUIHandler, (handler) => handler.handleTriggerWinMultiplier())
    handleTriggerWinMultiplier() {
    }

    @handle(CascadingUIHandler, (handler) => handler.checkHyperSpinBatchRecovery())
    checkHyperSpinBatchRecovery() {
    }

    @handle(FSBPromotionUIHandler, (handler, payload: { win: number; totalFreeSpins: number }) => handler.updateTotalWin(payload))
    updateTotalWinPromo(payload: { win: number; totalFreeSpins: number }) {
        const result = payload;
        return result;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.DUMMY_DIALOG))
    clickOnBackground() {
    }
}
