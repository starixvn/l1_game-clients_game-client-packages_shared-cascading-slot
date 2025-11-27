import gc from "@sg/game-client-base";
import { _decorator, Game, game, JsonAsset, Label, Node } from "cc";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { StaticNode } from "db://shared-components/shared/common-components/static-node/scripts/static-node";
import { StaticGroupId } from "db://shared-components/shared/common-components/static-node/scripts/static-node-info";
import { AnimationUtils } from "db://shared-components/shared/utils";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import Observer from "observer";
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
import { SlotModeContext } from "./mode/slot-mode-context";
import { SlotModeContextFactory } from "./mode/slot-mode-context-factory";
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
    private wasHyperSpinActive = false; // Track previous state to detect transitions
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
            lblList?.forEach((label) => {
                if (label) {
                    const component = label?.addComponent(StaticNode);
                    component && (component.groupId = StaticGroupId.TextContainer);
                }
            });
            ComponentUtils.setEmptyLabels(lblList);
        }

    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler)
    connectToService() { }

    @render(gc.GameConfigs.GameSetting, (gameSetting) => gameSetting.name)
    logLoadScene(gameName: string) {
        console.timeEnd("Game Load Time");
    }

    @render(LogStore, (store) => store.message)
    logInfo(message: string) { }

    @handle(gc.UserSettings.UserSettingHandlers, (handle) => handle.loadStorages())
    initUserSettings() { }

    @handle(gc.PlayerSelections.PlayerSelectionHandlers.InitHandlers)
    initPlayerSelections() { }

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
        }
    }

    @handle(Connection.ConnectionHandlers.InGameHandler, (handler) => handler.requestInGame())
    inGame() {
    }

    @handle(FSBPromotionUIHandler, (handler, isTrialMode: boolean) => handler.handleTrialMode(isTrialMode))
    handleTrialModeWithPromo(isTrialMode: boolean) {
        return isTrialMode;
    }

    @render(CascadingUIStore, (store) => store.isFreeSpins)
    notifyFreeSpinFromGame(isActive: boolean) {
        const signal = { source: FreeSpinSource.GAME, active: isActive };
        this.notifyFreeSpin(signal);
    }

    @handle(FSBPromotionUIHandler, (handler, signal: FreeSpinSignal) => handler.handleFreeSpin(signal))
    public notifyFreeSpin(signal: FreeSpinSignal) {
        return signal;
    }

    loadSlotSymbols() {
        const cache = resourcesCache.slotSymbols || {};

        for (let index = 0; index < CascadingSlotConfig?.symbolCount; index++) {
            if (cache[index]) {
                continue;
            }
            const path = `symbol-spines/symbol-${index}`;
            cache[index] = bundleManager.cachedAssets[path];
        }

        resourcesCache.slotSymbols = cache;

    }

    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        if (!finishData) {
            return;
        }

        const settlementData = this.extractSettlementData(finishData);
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const isInHyperSpin = this.isHyperSpinActive;

        await this.handleSpinAndTumbleResults(settlementData, isInHyperSpin, isFreeSpinActive);
        await this.handleWinProcessing(settlementData, isInHyperSpin);
        this.handleUIUpdates(settlementData, isInHyperSpin);
        this.handleSpecialEffects(settlementData, isInHyperSpin);
        this.handleFreeSpinLogic(settlementData, isInHyperSpin);

        // Record spin data for hyper-spin batch tracking
        if (isInHyperSpin) {
            this.recordHyperSpinSpinData(finishData);
        }
    }

    private extractSettlementData(finishData: any) {
        this.handleChangeUserBalance(false);
        return {
            win: finishData.win,
            bigWin: finishData.bigWin,
            megaWin: finishData.megaWin,
            superWin: finishData.superWin,
            totalFreeSpins: finishData.totalFreeSpins,
            isFreeSpin: finishData.isFreeSpin,
            multiplier: finishData.multiplier,
            totalMultiplier: finishData.totalMultiplier,
            reachMaxWin: finishData.reachMaxWin,
            tumbles: finishData.tumbles,
            result: finishData.result,
            actualBetwin: finishData.actualBetwin,
            freeSpins: finishData.freeSpins,
        };
    }

    /**
     * Create mode context based on current game state.
     * Centralizes the logic for determining which mode context to use.
     */
    private createModeContext(isInHyperSpin: boolean, isFreeSpinActive: boolean): SlotModeContext {
        if (isInHyperSpin) {
            return SlotModeContextFactory.createHyperSpin(this.stopOnFeature, isFreeSpinActive);
        }

        if (this.isTurboMode) {
            return SlotModeContextFactory.createTurbo();
        }

        return SlotModeContextFactory.createNormal();
    }

    private async handleSpinAndTumbleResults(settlementData: any, isInHyperSpin: boolean, isFreeSpinActive: boolean) {
        const symbolsBoard = {
            symbols: convertData(settlementData.result),
            multipliers: settlementData.tumbles[0]?.multipliers,
            isTurbo: false,
            tumbles: settlementData.tumbles
        };

        // Create mode context once and reuse for both calls
        const modeContext = this.createModeContext(isInHyperSpin, isFreeSpinActive);

        await this.board.spinResult(symbolsBoard, modeContext);
        await this.board.handleTumbles(settlementData.tumbles, modeContext);
    }

    private async handleWinProcessing(settlementData: any, isInHyperSpin: boolean) {
        const winTumbles = settlementData.tumbles.length > 1;
        const winMultiplier = settlementData.multiplier > 0 && winTumbles;

        // Skip multiplier animations during hyper-spin for faster execution
        if (!isInHyperSpin && this.tumbleWinView) {
            if (winMultiplier) {
                this.handleTriggerWinMultiplier();
            }
            await this.board.handleMultiplier(settlementData.isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        }

        if (settlementData.win > 0) {
            this.getBalance();
            this.handleChangeUserBalance(true);
            if (winTumbles && !isInHyperSpin && this.tumbleWinView) {
                await this.tumbleWinView.setTotalWinValue(settlementData.actualBetwin);
            }
            this.handleTotalWin({ win: settlementData.win, isActualWin: true });
        }
    }

    private handleUIUpdates(settlementData: any, isInHyperSpin: boolean) {
        // Skip UI updates during hyper-spin for maximum speed
        if (!isInHyperSpin) {
            this.updateTotalWinPromo({ win: settlementData.win, totalFreeSpins: settlementData.totalFreeSpins });
            this.showTotalMultiplierView(settlementData.totalMultiplier, settlementData.isFreeSpin, settlementData.multiplier > 0 && settlementData.tumbles.length > 1);
            if (settlementData.reachMaxWin) {
                this.setReachMaxWin(true);
            }
            this.setTotalMultiplierValue(settlementData.totalMultiplier);
        }
    }

    private handleSpecialEffects(settlementData: any, isInHyperSpin: boolean) {
        // Skip special effects during hyper-spin for maximum speed
        const isHaveBigWin = settlementData.bigWin || settlementData.megaWin || settlementData.superWin;

        if (!isInHyperSpin) {
            this.handleHaveBigWin(isHaveBigWin);
            this.updateBigWinAmount(settlementData.win);
            this.handleHaveFreeSpin(settlementData.freeSpins > 0);
        }
    }

    private handleFreeSpinLogic(settlementData: any, isInHyperSpin: boolean) {
        // Always update free spins data
        this.setFreeSpinsByRound(settlementData.freeSpins);
        this.setFreeSpinsTotal(settlementData.totalFreeSpins);

        const noWinMoreFreespins = settlementData.freeSpins <= 0;
        const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        const isHaveBigWin = settlementData.bigWin || settlementData.megaWin || settlementData.superWin;

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
                freeSpins: settlementData.freeSpins,
                totalFreeSpins: settlementData.totalFreeSpins,
                timestamp: new Date().toISOString()
            });
            console.warn("[CASCADING_SLOT_GAME] Handling free spin effect completion");
            this.handleFreeSpinEffectCompleted(true);
        }
    }


    @handle(HyperSpinHandler, (handler, finishData: any) => handler.handleRecordSpinData(finishData))
    recordHyperSpinSpinData(finishData: any) {
        return finishData;
    }

    protected async showTotalMultiplierView(totalMultiplier: number, isFreeSpin: boolean, winMultiplier: boolean) {
        const needShowTotalMultiplier = totalMultiplier > 0;

        if (winMultiplier && isFreeSpin && needShowTotalMultiplier && this.tumbleWinView) {
            await this.totalMultiplierView.showView(true);
            await this.board.movingMultiplier(
                this.tumbleWinView.multiplier.node,
                this.effectContainer,
                this.totalMultiplierView.total.node
            );
        }
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    handleFreeSpinEffectCompleted(completed: boolean) {
        return completed;
    }

    @render(CascadingUIStore, (store) => store.isHyperSpinActive)
    renderHyperSpinActive(isHyperSpinActive: boolean) {
        const previousState = this.isHyperSpinActive;
        this.isHyperSpinActive = isHyperSpinActive;

        // Detect transition from hyper-spin to normal mode
        if (previousState && !isHyperSpinActive) {
            this.handleHyperSpinDeactivated();
        }

        this.wasHyperSpinActive = isHyperSpinActive;
    }

    /**
     * Handles the transition from hyper-spin mode back to normal mode.
     * Restores the board to a ready state when hyper-spin is cancelled or completed.
     */
    private handleHyperSpinDeactivated() {
        // Only restore if we're not currently spinning
        // Check cascading state via UI store or handler
        this.restoreBoardToNormalMode();
    }

    /**
     * Restores the board to normal mode by reinitializing it with random items.
     * This ensures the board is populated when returning from hyper-spin mode.
     */
    private restoreBoardToNormalMode() {
        if (!this.board) {
            return;
        }

        // Restore board to initial state with random items
        this.board.initBoardFullItems();
    }

    @render(HyperSpinStore, (store) => store.stopOnFeature)
    renderStopOnFeature(stopOnFeature: boolean) {
        this.stopOnFeature = stopOnFeature;
    }

    @render(CascadingUIStore, (store) => ({
        isFreeSpinEffectCompleted: store.isFreeSpinEffectCompleted,
        isHyperSpinActive: store.isHyperSpinActive
    }))
    async checkNextRound(data: { isFreeSpinEffectCompleted: boolean; isHyperSpinActive: boolean }) {
        const { isFreeSpinEffectCompleted, isHyperSpinActive } = data;
        if (isFreeSpinEffectCompleted) {
            await this.handleFreeSpinEffectCompletion(isHyperSpinActive);
            this.handleHyperSpinCheck(isHyperSpinActive);
        }
    }

    private async handleFreeSpinEffectCompletion(isHyperSpinActive: boolean) {
        // Skip delay entirely for hyper-spin mode to achieve faster spinning
        // Use store state directly (more reliable than local property)
        const isInHyperSpin = isHyperSpinActive;
        const delayForNextSpin = isInHyperSpin ? 0 : getCustomDuration("delayForNextSpin", this.isTurboMode);

        if (delayForNextSpin > 0) {
            await AnimationUtils.delayTime(delayForNextSpin);
        }

        // Enable autoplay when free spin effect is completed
        this.enableAutoPlayOnFreeSpinCompleted();

        // When the free spin effect is completed, handle the next round
        // by automatically spinning
        this.handleEndGameApiError();
        this.checkSpinNextRound();
    }

    private handleHyperSpinCheck(isHyperSpinActive: boolean) {
        // Only check hyper-spin if it's actually active (prevents continuation after cancellation)
        // Use store state directly to avoid race conditions with local property
        console.warn("🔄 [GAME] checkNextRound() - checking hyper-spin", {
            isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        if (isHyperSpinActive) {
            this.callHyperSpinNextRoundIfNotCancelled();
        } else {
            console.warn("🛑 [GAME] Skipping checkHyperSpinNextRound() - hyper-spin not active", {
                timestamp: new Date().toISOString()
            });
        }
    }

    private callHyperSpinNextRoundIfNotCancelled() {
        // ✅ Check cancellation flag before calling checkHyperSpinNextRound()
        // The handler method will also check cancellation, but this prevents unnecessary calls
        try {
            const container = (this as any).container;
            if (container) {
                const hyperSpinHandler = container.get(HyperSpinHandler);
                if (hyperSpinHandler && hyperSpinHandler.isBatchCancelled) {
                    console.warn("🛑 [GAME] Skipping checkHyperSpinNextRound() - batch cancelled", {
                        timestamp: new Date().toISOString()
                    });
                    return;
                }
            }
        } catch (error) {
            // If we can't access handler, proceed (handler will check cancellation internally)
        }

        console.warn("✅ [GAME] Calling checkHyperSpinNextRound()", {
            timestamp: new Date().toISOString()
        });
        this.checkHyperSpinNextRound();
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

        this.lblRoundId && (this.lblRoundId.string = `#${roundId}`);
    }

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsTotal(freespins))
    setFreeSpinsTotal(freespins: number) {
        return freespins;
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsByRound(freespins))
    setFreeSpinsByRound(freespins: number) {
        return freespins;
    }

    @handle(AutoPlayHandler, (handler) => handler.checkSpinNextRound())
    checkSpinNextRound() {
    }

    @handle(HyperSpinHandler, (handler) => handler.checkHyperSpinNextRound())
    checkHyperSpinNextRound() {
        // The @handle decorator will automatically call the HyperSpinHandler.checkHyperSpinNextRound() method
        console.warn("🔄 [GAME] checkHyperSpinNextRound() called via @handle decorator", {
            isHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString(),
            stackTrace: new Error().stack?.split('\n').slice(1, 5).join('\n')
        });
    }

    @render(FSBPromotionUIStore, (store) => store.changeUserBalance)
    handleUpdateBalance(isUpdateBalance: boolean) {
        if (isUpdateBalance) {
            this.handleChangeUserBalance(true);
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

        this.lblBalance && (this.lblBalance.string = FormatUtils.truncateFixedDecimals(value, 2).toString());
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
        return totalMultiplier;
    }

    @handle(CascadingUIHandler, (handle, bigWin: any) => handle.handleHaveBigWin(bigWin))
    handleHaveBigWin(bigwin: boolean) {
        return bigwin;
    }

    @handle(CascadingUIHandler, (handle, isShow: any) => handle.setReachMaxWin(isShow))
    setReachMaxWin(isShow: boolean) {
        return isShow;
    }

    @handle(CascadingUIHandler, (handle, win: number) => handle.handleBigWinAmount(win))
    updateBigWinAmount(win: number) {
        return win;
    }

    @handle(CascadingUIHandler, (handle, freespin: any) => handle.handleHaveFreeSpin(freespin))
    handleHaveFreeSpin(freespin: boolean) {
        return freespin;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        return changed;
    }

    @handle(CascadingUIHandler, (handle, params: any) => handle.handleTotalWin(params))
    handleTotalWin(params: { win: number; isActualWin: boolean }) {
        return params;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    private focusGameCanvas() {
        // Auto-focus the game canvas when loading
        if (game.canvas) {
            // Set initial focus
            setTimeout(() => {
                game.canvas.focus();
            }, 100);
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
        return payload;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.DUMMY_DIALOG))
    clickOnBackground() {
    }
}
