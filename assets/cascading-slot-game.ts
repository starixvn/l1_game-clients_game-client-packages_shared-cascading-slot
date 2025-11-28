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
import { CascadingSlotBoard } from "./components/slot-board/components/cascading-slot-board";
import { TotalMultiplierView } from "./components/total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "./components/tumbles/tumble-win-view";
import { AutoPlayHandler } from "./handlers/auto-play-handlers";
import { CascadingSlotErrorHandler } from "./handlers/cascading-slot-error-handler";
import { CascadingUIHandler } from "./handlers/cascading-ui-handler";
import { HyperSpinSettlementHandler } from "./handlers/hyper-spin-settlement-handler";
import { HyperSpinHandler } from "./handlers/hyper-spin-handler";
import { CascadingSlotSettlementStore } from "./stores/cascading-slot-settlement-store";
import { CascadingUIStore } from "./stores/cascading-ui-store";
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
    private isHyperSpinActive = false; // Only used for routing check in handleSettlement

    // Lazy-loaded handlers - none currently

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

        // Route to hyper-spin handler if active
        // Use local property set via @render decorator, with fallback to container lookup
        let isHyperSpinActive = this.isHyperSpinActive;

        // Fallback: get from container if reactive update hasn't fired yet
        if (!isHyperSpinActive) {
            try {
                const container = (this as any).container;
                if (container) {
                    const cascadingUIStore = container.get(CascadingUIStore);
                    if (cascadingUIStore) {
                        isHyperSpinActive = cascadingUIStore.isHyperSpinActive;
                    }
                }
            } catch (error) {
                // Continue with local property
            }
        }

        console.warn("🎯 [GAME] handleSettlement() routing", {
            isHyperSpinActive,
            localIsHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        if (isHyperSpinActive) {
            await this.handleHyperSpinSettlement(finishData, this.board, this.tumbleWinView, this.totalMultiplierView);
            // Record hyper spin data after settlement
            this.recordHyperSpinSpinData(finishData);
            return;
        }

        // Normal mode settlement (master-branch logic)
        await this.handleNormalSettlement(finishData);
    }


    /**
     * Get handler from Observer container
     */
    private getHandlerFromObserver<T>(HandlerClass: new (...args: any[]) => T): T | null {
        try {
            // Observer stores container in its configuration
            const observerConfig = (Observer as any).config;
            if (observerConfig) {
                // Try game namespace first
                const gameNamespace = this.namespace || 'portrait-wukong';
                let container = observerConfig[gameNamespace]?.container;

                // Fallback to default namespace
                if (!container) {
                    container = observerConfig.default?.container;
                }

                // Fallback to any namespace
                if (!container) {
                    const namespaces = Object.keys(observerConfig);
                    if (namespaces.length > 0) {
                        container = observerConfig[namespaces[0]].container;
                    }
                }

                if (container && typeof container.get === 'function') {
                    const handler = container.get(HandlerClass);
                    console.warn("🎯 [GAME] Handler retrieved from Observer container", {
                        handlerClass: HandlerClass.name,
                        hasHandler: !!handler,
                        namespace: gameNamespace
                    });
                    return handler;
                }
            }
        } catch (error) {
            console.error("❌ [GAME] Failed to get handler from Observer container", error);
        }
        return null;
    }

    /**
     * Handle settlement for normal mode (master-branch logic).
     * This method contains the original settlement logic without hyper-spin conditionals.
     */
    private async handleNormalSettlement(finishData: any) {
        const settlementData = this.extractSettlementData(finishData);

        // Normal mode processing (master-branch logic)
        await this.handleNormalSpinAndTumbleResults(settlementData);
        await this.handleNormalWinProcessing(settlementData);
        this.handleNormalUIUpdates(settlementData);
        this.handleNormalSpecialEffects(settlementData);
        this.handleNormalFreeSpinLogic(settlementData);
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
     * Handle spin and tumble results for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private async handleNormalSpinAndTumbleResults(settlementData: any) {
        const symbolsBoard = {
            symbols: convertData(settlementData.result),
            multipliers: settlementData.tumbles[0]?.multipliers,
            isTurbo: this.isTurboMode,
            tumbles: settlementData.tumbles
        };

        await this.board.spinResult(symbolsBoard, this.isTurboMode);
        await this.board.handleTumbles(settlementData.tumbles, this.isTurboMode);
    }

    /**
     * Handle win processing for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private async handleNormalWinProcessing(settlementData: any) {
        const winTumbles = settlementData.tumbles.length > 1;
        const winMultiplier = settlementData.multiplier > 0 && winTumbles;

        if (this.tumbleWinView) {
            if (winMultiplier) {
                this.handleTriggerWinMultiplier();
            }
            await this.board.handleMultiplier(settlementData.isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        }

        if (settlementData.win > 0) {
            this.getBalance();
            this.handleChangeUserBalance(true);
            if (winTumbles && this.tumbleWinView) {
                await this.tumbleWinView.setTotalWinValue(settlementData.actualBetwin);
            }
            this.handleTotalWin({ win: settlementData.win, isActualWin: true });
        }
    }

    /**
     * Handle UI updates for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private handleNormalUIUpdates(settlementData: any) {
        this.updateTotalWinPromo({ win: settlementData.win, totalFreeSpins: settlementData.totalFreeSpins });
        this.showTotalMultiplierView(settlementData.totalMultiplier, settlementData.isFreeSpin, settlementData.multiplier > 0 && settlementData.tumbles.length > 1);
        if (settlementData.reachMaxWin) {
            this.setReachMaxWin(true);
        }
        this.setTotalMultiplierValue(settlementData.totalMultiplier);
    }

    /**
     * Handle special effects for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private handleNormalSpecialEffects(settlementData: any) {
        const isHaveBigWin = settlementData.bigWin || settlementData.megaWin || settlementData.superWin;

        this.handleHaveBigWin(isHaveBigWin);
        this.updateBigWinAmount(settlementData.win);
        this.handleHaveFreeSpin(settlementData.freeSpins > 0);
    }

    /**
     * Handle free spin logic for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private handleNormalFreeSpinLogic(settlementData: any) {
        // Always update free spins data
        this.setFreeSpinsByRound(settlementData.freeSpins);
        this.setFreeSpinsTotal(settlementData.totalFreeSpins);

        const noWinMoreFreespins = settlementData.freeSpins <= 0;
        const isHaveBigWin = settlementData.bigWin || settlementData.megaWin || settlementData.superWin;

        const shouldHandleFreeSpinEffectCompleted = noWinMoreFreespins && !isHaveBigWin;

        if (shouldHandleFreeSpinEffectCompleted) {
            this.handleFreeSpinEffectCompleted(true);
        }
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

    @handle(HyperSpinSettlementHandler, async (handler, finishData: any, board: CascadingSlotBoard, tumbleWinView: TumbleWinWiew | null, totalMultiplierView: TotalMultiplierView | null) =>
        await handler.handleSettlement(finishData, board, tumbleWinView, totalMultiplierView))
    async handleHyperSpinSettlement(finishData: any, board: CascadingSlotBoard, tumbleWinView: TumbleWinWiew | null, totalMultiplierView: TotalMultiplierView | null) {
        // Handler is called via @handle decorator, parameters are passed through
        return;
    }

    @handle(HyperSpinHandler, (handler) => handler.checkHyperSpinNextRound())
    handleHyperSpinNextRound() {
        // Handler is called via @handle decorator
        return;
    }

    @handle(HyperSpinHandler, (handler, finishData: any) => handler.handleRecordSpinData(finishData))
    recordHyperSpinSpinData(finishData: any) {
        return finishData;
    }

    /**
     * Render hyper-spin active state for routing check in handleSettlement.
     * This is the only hyper-spin awareness needed in this file.
     */
    @render(CascadingUIStore, (store) => store.isHyperSpinActive)
    renderHyperSpinActive(isHyperSpinActive: boolean) {
        this.isHyperSpinActive = isHyperSpinActive;
    }

    /**
     * Check next round - routes to hyper-spin handler if active, otherwise normal mode.
     */
    @render(CascadingUIStore, (store) => store.isFreeSpinEffectCompleted)
    async checkNextRound(isFreeSpinEffectCompleted: boolean) {
        if (!isFreeSpinEffectCompleted) {
            return;
        }

        // Route to hyper-spin handler if active (for batch continuation after free spins)
        if (this.isHyperSpinActive) {
            await this.handleHyperSpinNextRound();
            return;
        }

        // Normal mode handling
        await this.handleFreeSpinEffectCompletion();
    }


    /**
     * Handle free spin effect completion for normal mode.
     * Master-branch logic without hyper-spin conditionals.
     */
    private async handleFreeSpinEffectCompletion() {
        const delayForNextSpin = getCustomDuration("delayForNextSpin", this.isTurboMode);

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
            this.handleOnGameHide();
        }
    }

    @handle(CascadingUIHandler, (handler) => handler.handleOnGameHide())
    handleOnGameHide() {
    }

    @handle(CascadingUIHandler, (handler) => handler.handleTriggerWinMultiplier())
    handleTriggerWinMultiplier() {
    }


    @handle(FSBPromotionUIHandler, (handler, payload: { win: number; totalFreeSpins: number }) => handler.updateTotalWin(payload))
    updateTotalWinPromo(payload: { win: number; totalFreeSpins: number }) {
        return payload;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.DUMMY_DIALOG))
    clickOnBackground() {
    }
}
