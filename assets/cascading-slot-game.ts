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
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] onLoad called - Starting game initialization", {
            boardComponent: !!this.board,
            totalMultiplierViewComponent: !!this.totalMultiplierView,
            tumbleWinViewComponent: !!this.tumbleWinView,
            effectContainer: !!this.effectContainer,
            lblRoundId: !!this.lblRoundId,
            lblMinBet: !!this.lblMinBet,
            lblMaxBet: !!this.lblMaxBet,
            lblBalance: !!this.lblBalance,
            colorInfo: !!this.colorInfo,
            gameFeatureInfo: !!this.gameFeatureInfo,
            isTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });

        this.initConfig();
        this.registerEventShowHideGame();
        this.initUserSettings();
        this.node.addComponent(GameVisibility);
        this.focusGameCanvas();
        this.addComponent(FSBPromotionUIManager);

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] onLoad completed - Game initialization finished", {
            timestamp: new Date().toISOString()
        });
    }

    initConfig() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] initConfig called", {
            colorInfoExists: !!this.colorInfo,
            gameFeatureInfoExists: !!this.gameFeatureInfo,
            colorInfoJson: this.colorInfo?.json,
            gameFeatureInfoJson: this.gameFeatureInfo?.json,
            timestamp: new Date().toISOString()
        });

        resourcesCache.colorJson = this.colorInfo.json as ColorJson;
        resourcesCache.gameFeatures = this.gameFeatureInfo.json as GameFeatureJson;

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] initConfig completed - Resources cache updated", {
            resourcesCacheColorJson: !!resourcesCache.colorJson,
            resourcesCacheGameFeatures: !!resourcesCache.gameFeatures,
            timestamp: new Date().toISOString()
        });
    }

    start() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] start called - Beginning game startup", {
            boardExists: !!this.board,
            colorInfoExists: !!this.colorInfo,
            timestamp: new Date().toISOString()
        });

        this.loadSlotSymbols();
        this.board.colorInfo = this.colorInfo;
        this.board.initBoardFullItems();

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] start completed - Game fully initialized", {
            boardColorInfoSet: !!this.board.colorInfo,
            timestamp: new Date().toISOString()
        });
    }

    protected registerEventShowHideGame() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] registerEventShowHideGame called", {
            timestamp: new Date().toISOString()
        });

        game.on(Game.EVENT_HIDE, this.onHideGame, this);
        game.on(Game.EVENT_SHOW, this.onShowGame, this);

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Game show/hide event listeners registered", {
            timestamp: new Date().toISOString()
        });
    }

    protected clearEventShowHideGame() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] clearEventShowHideGame called", {
            timestamp: new Date().toISOString()
        });

        game.off(Game.EVENT_HIDE, this.onHideGame, this);
        game.off(Game.EVENT_SHOW, this.onShowGame, this);

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Game show/hide event listeners cleared", {
            timestamp: new Date().toISOString()
        });
    }

    protected handleStaticNodeAndSetEmptyLabels() {
        const lblList: Label[] = [this?.lblRoundId, this?.lblMinBet, this?.lblMaxBet];
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleStaticNodeAndSetEmptyLabels called", {
            lblListLength: lblList.length,
            lblRoundIdExists: !!this.lblRoundId,
            lblMinBetExists: !!this.lblMinBet,
            lblMaxBetExists: !!this.lblMaxBet,
            timestamp: new Date().toISOString()
        });

        if (lblList.length > 0) {
            lblList?.forEach((label, index) => {
                cascadingSlotLogger.info(`[CASCADING_SLOT_GAME] Processing label ${index}`, {
                    labelExists: !!label,
                    timestamp: new Date().toISOString()
                });

                if (label) {
                    const component = label?.addComponent(StaticNode);
                    if (component) {
                        component.groupId = StaticGroupId.TextContainer;
                        cascadingSlotLogger.info(`[CASCADING_SLOT_GAME] StaticNode component added to label ${index}`, {
                            groupId: component.groupId,
                            timestamp: new Date().toISOString()
                        });
                    }
                }
            });
            ComponentUtils.setEmptyLabels(lblList);
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Empty labels set for all labels", {
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleStaticNodeAndSetEmptyLabels completed", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler)
    connectToService() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] connectToService called - Connecting to game service", {
            timestamp: new Date().toISOString()
        });
    }

    @render(gc.GameConfigs.GameSetting, (gameSetting) => gameSetting.name)
    logLoadScene(gameName: string) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] logLoadScene called - Scene loading completed", {
            gameName,
            timestamp: new Date().toISOString()
        });
        cascadingSlotLogger.info(`LoadScene ${gameName}`);
        console.timeEnd("Game Load Time");
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] logLoadScene completed", {
            gameName,
            timestamp: new Date().toISOString()
        });
    }

    @render(LogStore, (store) => store.message)
    logInfo(message: string) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] logInfo called - Logging info message", {
            message,
            messageLength: message?.length,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.UserSettings.UserSettingHandlers, (handle) => handle.loadStorages())
    initUserSettings() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] initUserSettings called - Initializing user settings", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.PlayerSelections.PlayerSelectionHandlers.InitHandlers)
    initPlayerSelections() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] initPlayerSelections called - Initializing player selections", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(HideGame.HideGameHandler)
    onHideGame() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] onHideGame called - Game hidden event triggered", {
            timestamp: new Date().toISOString()
        });
        // reload here will run when page appears from hidden
        // to fix issue on iOS that EVENT_SHOW are not triggered when phone active
        // if (sys.os === sys.OS.IOS) {
        //     setTimeout(() => {
        //         window.location.reload();
        //     }, 100);
        // }
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] onHideGame completed", {
            timestamp: new Date().toISOString()
        });
    }

    onShowGame() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] onShowGame called - Game shown event triggered, reloading page", {
            timestamp: new Date().toISOString()
        });
        window.location.reload();
    }

    @render(CascadingUIStore, (store) => store.isTrialMode)
    renderTrialMode(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTrialMode called - Rendering trial mode", {
            isTrialMode,
            timestamp: new Date().toISOString()
        });
        this.handleTrialModeWithPromo(isTrialMode);
        if (!isTrialMode) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTrialMode - Not in trial mode, calling inGame", {
                isTrialMode,
                timestamp: new Date().toISOString()
            });
            this.inGame();
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTrialMode - In trial mode, skipping inGame", {
                isTrialMode,
                timestamp: new Date().toISOString()
            });
        }
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTrialMode completed", {
            isTrialMode,
            timestamp: new Date().toISOString()
        });
    }

    @handle(Connection.ConnectionHandlers.InGameHandler, (handler) => handler.requestInGame())
    inGame() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] inGame called - Requesting in-game state", {
            timestamp: new Date().toISOString()
        });

        // Check for hyper-spin batch recovery after game initialization
        setTimeout(() => {
            this.checkHyperSpinBatchRecovery();
        }, 1000); // Delay to ensure all stores are initialized
    }

    @handle(FSBPromotionUIHandler, (handler, isTrialMode: boolean) => handler.handleTrialMode(isTrialMode))
    handleTrialModeWithPromo(isTrialMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleTrialModeWithPromo called - Handling trial mode with promotion", {
            isTrialMode,
            timestamp: new Date().toISOString()
        });
        const result = isTrialMode;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleTrialModeWithPromo completed", {
            isTrialMode,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @render(CascadingUIStore, (store) => store.isFreeSpins)
    notifyFreeSpinFromGame(isActive: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] notifyFreeSpinFromGame called - Notifying free spin from game", {
            isActive,
            source: FreeSpinSource.GAME,
            timestamp: new Date().toISOString()
        });
        const signal = { source: FreeSpinSource.GAME, active: isActive };
        this.notifyFreeSpin(signal);
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] notifyFreeSpinFromGame completed", {
            isActive,
            signal,
            timestamp: new Date().toISOString()
        });
    }

    @handle(FSBPromotionUIHandler, (handler, signal: FreeSpinSignal) => handler.handleFreeSpin(signal))
    public notifyFreeSpin(signal: FreeSpinSignal) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] notifyFreeSpin called - Notifying free spin", {
            signal,
            source: signal?.source,
            active: signal?.active,
            timestamp: new Date().toISOString()
        });
        const result = signal;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] notifyFreeSpin completed", {
            signal,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    loadSlotSymbols() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] loadSlotSymbols called - Loading slot symbols", {
            symbolCount: CascadingSlotConfig?.symbolCount,
            existingCacheSize: Object.keys(resourcesCache.slotSymbols || {}).length,
            timestamp: new Date().toISOString()
        });

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
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] loadSlotSymbols - Missing symbol asset", {
                    index,
                    path,
                    timestamp: new Date().toISOString()
                });
            }
        }

        resourcesCache.slotSymbols = cache;

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] loadSlotSymbols completed - Slot symbols loaded", {
            symbolCount: CascadingSlotConfig?.symbolCount,
            loadedCount,
            skippedCount,
            missingCount,
            totalCacheSize: Object.keys(cache).length,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        const settlementStartTime = Date.now();
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleSettlement called - Starting settlement process", {
            finishData,
            hasFinishData: !!finishData,
            settlementStartTime: new Date(settlementStartTime).toISOString(),
            timestamp: new Date().toISOString()
        });

        if (!finishData) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleSettlement - No finish data provided, exiting", {
                timestamp: new Date().toISOString()
            });
            return;
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleSettlement - Processing finish data", {
            finishDataKeys: Object.keys(finishData),
            timestamp: new Date().toISOString()
        });

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

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleSettlement - Extracted settlement data", {
            win,
            bigWin,
            megaWin,
            superWin,
            totalFreeSpins,
            isFreeSpin,
            multiplier,
            totalMultiplier,
            reachMaxWin,
            tumblesCount: tumbles?.length,
            hasResult: !!result,
            actualBetwin,
            freeSpins,
            timestamp: new Date().toISOString()
        });
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

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Hyper-spin and free-spin detection", {
            isHyperSpinActive,
            isFreeSpin,
            totalFreeSpins,
            isFreeSpinActive,
            isInHyperSpin,
            willSkipAnimations: isInHyperSpin,
            detectionMethod: "cascading_ui_store_with_free_spin_check",
            timestamp: new Date().toISOString()
        });

        const spinResultStartTime = Date.now();
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Starting spin result processing", {
            isInHyperSpin,
            isTurboMode: this.isTurboMode,
            spinResultStartTime: new Date(spinResultStartTime).toISOString(),
            timestamp: new Date().toISOString()
        });

        const symbolsBoard = { symbols: convertData(result), multipliers: tumbles[0]?.multipliers, isTurbo: false, tumbles };
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Prepared symbols board data", {
            symbolsBoard,
            symbolsCount: symbolsBoard.symbols?.length,
            multipliers: symbolsBoard.multipliers,
            tumblesCount: symbolsBoard.tumbles?.length,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Calling board.spinResult", {
            boardExists: !!this.board,
            isTurboMode: this.isTurboMode,
            isInHyperSpin,
            timestamp: new Date().toISOString()
        });

        await this.board.spinResult(symbolsBoard, this.isTurboMode, isInHyperSpin);

        const tumbleStartTime = Date.now();
        const spinResultDuration = tumbleStartTime - spinResultStartTime;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Spin result completed, starting tumbles", {
            spinResultDuration: `${spinResultDuration}ms`,
            tumbleStartTime: new Date(tumbleStartTime).toISOString(),
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Calling board.handleTumbles", {
            tumblesCount: tumbles?.length,
            isTurboMode: this.isTurboMode,
            isInHyperSpin,
            timestamp: new Date().toISOString()
        });

        await this.board.handleTumbles(tumbles, this.isTurboMode, isInHyperSpin);

        const settlementCompleteTime = Date.now();
        const tumbleDuration = settlementCompleteTime - tumbleStartTime;
        const totalSettlementDuration = settlementCompleteTime - spinResultStartTime;

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Settlement completed", {
            tumbleDuration: `${tumbleDuration}ms`,
            totalSettlementDuration: `${totalSettlementDuration}ms`,
            settlementCompleteTime: new Date(settlementCompleteTime).toISOString(),
            timestamp: new Date().toISOString()
        });
        const winTumbles = tumbles.length > 1;
        const winMultiplier = multiplier > 0 && winTumbles;

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Win analysis", {
            winTumbles,
            winMultiplier,
            multiplier,
            tumblesCount: tumbles.length,
            win,
            isInHyperSpin,
            timestamp: new Date().toISOString()
        });

        // Skip multiplier animations during hyper-spin for faster execution
        if (!isInHyperSpin) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Processing multiplier animations (not in hyper-spin)", {
                winMultiplier,
                isFreeSpin,
                tumbleWinViewExists: !!this.tumbleWinView,
                totalMultiplierViewExists: !!this.totalMultiplierView,
                timestamp: new Date().toISOString()
            });

            winMultiplier && this.handleTriggerWinMultiplier();
            await this.board.handleMultiplier(isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Skipping multiplier animations (in hyper-spin mode)", {
                timestamp: new Date().toISOString()
            });
        }

        if (win > 0) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Processing win amount", {
                win,
                actualBetwin,
                winTumbles,
                isInHyperSpin,
                tumbleWinViewExists: !!this.tumbleWinView,
                timestamp: new Date().toISOString()
            });

            this.getBalance();
            this.handleChangeUserBalance(true);
            if (winTumbles && !isInHyperSpin) {
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Setting tumble win value", {
                    actualBetwin,
                    timestamp: new Date().toISOString()
                });
                await this.tumbleWinView.setTotalWinValue(actualBetwin);
            }
            this.handleTotalWin({ win: win, isActualWin: true });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] No win amount to process", {
                win,
                timestamp: new Date().toISOString()
            });
        }

        // Skip UI updates during hyper-spin for maximum speed
        if (!isInHyperSpin) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Processing UI updates (not in hyper-spin)", {
                win,
                totalFreeSpins,
                totalMultiplier,
                reachMaxWin,
                timestamp: new Date().toISOString()
            });

            this.updateTotalWinPromo({ win, totalFreeSpins });
            this.showTotalMultiplierView(totalMultiplier, isFreeSpin, winMultiplier);
            reachMaxWin && this.setReachMaxWin(true);
            this.setTotalMultiplierValue(totalMultiplier);
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Skipping UI updates (in hyper-spin mode)", {
                timestamp: new Date().toISOString()
            });
        }

        // Skip special effects during hyper-spin for maximum speed
        const isHaveBigWin = bigWin || megaWin || superWin;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Special effects analysis", {
            bigWin,
            megaWin,
            superWin,
            isHaveBigWin,
            freeSpins,
            isInHyperSpin,
            timestamp: new Date().toISOString()
        });

        if (!isInHyperSpin) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Processing special effects (not in hyper-spin)", {
                isHaveBigWin,
                win,
                freeSpins,
                timestamp: new Date().toISOString()
            });

            this.handleHaveBigWin(isHaveBigWin);
            this.updateBigWinAmount(win);
            this.handleHaveFreeSpin(freeSpins > 0);
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Skipping special effects (in hyper-spin mode)", {
                timestamp: new Date().toISOString()
            });
        }

        // Always update free spins data
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Updating free spins data", {
            freeSpins,
            totalFreeSpins,
            timestamp: new Date().toISOString()
        });

        this.setFreeSpinsByRound(freeSpins);
        this.setFreeSpinsTotal(totalFreeSpins);

        const noWinMoreFreespins = freeSpins <= 0;

        let shouldHandleFreeSpinEffectCompleted = noWinMoreFreespins && !isHaveBigWin;

        // In hyper-spin mode, immediately mark effects as completed since we don't show UI anyway
        // This prevents the batch from getting stuck waiting for non-existent free spin effects
        if (isInHyperSpin && noWinMoreFreespins) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Hyper-spin mode: immediately marking free spin effects as completed", {
                isInHyperSpin,
                noWinMoreFreespins,
                isHaveBigWin,
                freeSpins,
                totalFreeSpins,
                timestamp: new Date().toISOString()
            });
            this.handleFreeSpinEffectCompleted(true);
            shouldHandleFreeSpinEffectCompleted = false; // Don't call it again
        } else if (isInHyperSpin && isFreeSpinActive && !noWinMoreFreespins) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Hyper-spin mode: free spins active but still have rounds to play - forcing continuation", {
                isInHyperSpin,
                noWinMoreFreespins,
                freeSpins,
                totalFreeSpins,
                isHaveBigWin,
                note: "Free spins will continue in hyper-spin batch mode - forcing effect completion",
                timestamp: new Date().toISOString()
            });
            // In hyper-spin mode with active free spins, force effect completion to continue the batch
            // This ensures free spin rounds progress automatically without waiting for UI effects
            this.handleFreeSpinEffectCompleted(true);
        }

        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Free spin completion check", {
            noWinMoreFreespins,
            isHaveBigWin,
            isInHyperSpin,
            stopOnFeature: this.stopOnFeature,
            willHandleFreeSpinEffectCompleted: shouldHandleFreeSpinEffectCompleted,
            hyperSpinImmediateCompletion: isInHyperSpin && noWinMoreFreespins,
            timestamp: new Date().toISOString()
        });

        if (shouldHandleFreeSpinEffectCompleted) {
            console.warn("🎰 FREESPIN COMPLETED: Free spin effects completed, proceeding to next round", {
                noWinMoreFreespins,
                isHaveBigWin,
                isInHyperSpin,
                freeSpins,
                totalFreeSpins,
                timestamp: new Date().toISOString()
            });
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Handling free spin effect completion", {
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
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] recordHyperSpinSpinData called", {
            hasFinishData: !!finishData,
            timestamp: new Date().toISOString()
        });
        return finishData;
    }

    protected async showTotalMultiplierView(totalMultiplier: number, isFreeSpin: boolean, winMultiplier: boolean) {
        const showStartTime = Date.now();
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] showTotalMultiplierView called - Showing total multiplier view", {
            totalMultiplier,
            isFreeSpin,
            winMultiplier,
            totalMultiplierViewExists: !!this.totalMultiplierView,
            tumbleWinViewExists: !!this.tumbleWinView,
            boardExists: !!this.board,
            effectContainerExists: !!this.effectContainer,
            timestamp: new Date().toISOString()
        });

        const needShowTotalMultiplier = totalMultiplier > 0;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] showTotalMultiplierView - Checking conditions", {
            needShowTotalMultiplier,
            winMultiplier,
            isFreeSpin,
            willShow: winMultiplier && isFreeSpin && needShowTotalMultiplier,
            timestamp: new Date().toISOString()
        });

        if (winMultiplier && isFreeSpin && needShowTotalMultiplier) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] showTotalMultiplierView - Showing view and moving multiplier", {
                timestamp: new Date().toISOString()
            });
            await this.totalMultiplierView.showView(true);
            await this.board.movingMultiplier(
                this.tumbleWinView.multiplier.node,
                this.effectContainer,
                this.totalMultiplierView.total.node
            );
            const showDuration = Date.now() - showStartTime;
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] showTotalMultiplierView completed - View shown and multiplier moved", {
                showDuration: `${showDuration}ms`,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] showTotalMultiplierView - Conditions not met, skipping view", {
                reason: !winMultiplier ? "no win multiplier" : !isFreeSpin ? "not free spin" : "no need to show",
                timestamp: new Date().toISOString()
            });
        }
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    handleFreeSpinEffectCompleted(completed: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleFreeSpinEffectCompleted called - Handling free spin effect completion", {
            completed,
            timestamp: new Date().toISOString()
        });
        const result = completed;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleFreeSpinEffectCompleted completed", {
            completed,
            result,
            timestamp: new Date().toISOString()
        });
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
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkNextRound called - Checking for next round", {
            isFreeSpinEffectCompleted,
            nextRoundCheckStart: new Date(nextRoundCheckStart).toISOString(),
            isTurboMode: this.isTurboMode,
            isHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        if (isFreeSpinEffectCompleted) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Free spin effects completed - proceeding with next round", {
                timestamp: new Date().toISOString()
            });

            // Skip delay entirely for hyper-spin mode to achieve faster spinning
            // Use reactive render property for hyper-spin detection
            const isInHyperSpin = this.isHyperSpinActive;
            const delayForNextSpin = isInHyperSpin ? 0 : getCustomDuration("delayForNextSpin", this.isTurboMode);

            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Calculating delay for next spin", {
                isInHyperSpin,
                isTurboMode: this.isTurboMode,
                calculatedDelayForNextSpin: delayForNextSpin,
                delayStartTime: new Date().toISOString(),
                timestamp: new Date().toISOString()
            });

            if (delayForNextSpin > 0) {
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Applying delay before next spin", {
                    delayForNextSpin: `${delayForNextSpin}ms`,
                    timestamp: new Date().toISOString()
                });
                await AnimationUtils.delayTime(delayForNextSpin);
            } else {
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] No delay applied (hyper-spin mode or zero delay)", {
                    delayForNextSpin,
                    isInHyperSpin,
                    timestamp: new Date().toISOString()
                });
            }

            const afterDelayTime = Date.now();
            const actualDelay = afterDelayTime - nextRoundCheckStart;
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Delay completed, triggering next round actions", {
                requestedDelay: `${delayForNextSpin}ms`,
                actualDelay: `${actualDelay}ms`,
                delayDifference: `${actualDelay - delayForNextSpin}ms`,
                isInHyperSpin,
                detectionMethod: "static_flag",
                afterDelayTime: new Date(afterDelayTime).toISOString(),
                timestamp: new Date().toISOString()
            });

            // Enable autoplay when free spin effect is completed
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Enabling autoplay on free spin completed", {
                timestamp: new Date().toISOString()
            });
            this.enableAutoPlayOnFreeSpinCompleted();

            // When the free spin effect is completed, handle the next round
            // by automatically spinning
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Handling end game API error and checking spin next round", {
                willCallHandleEndGameApiError: true,
                willCallCheckSpinNextRound: true,
                timestamp: new Date().toISOString()
            });

            this.handleEndGameApiError();
            this.checkSpinNextRound();

            const hyperSpinCheckStart = Date.now();
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Calling checkHyperSpinNextRound", {
                hyperSpinCheckStart: new Date(hyperSpinCheckStart).toISOString(),
                checkHyperSpinNextRoundExists: typeof this.checkHyperSpinNextRound === 'function',
                timestamp: new Date().toISOString()
            });

            this.checkHyperSpinNextRound();
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Free spin effects not completed - waiting", {
                isFreeSpinEffectCompleted,
                timestamp: new Date().toISOString()
            });
        }

        const checkNextRoundDuration = Date.now() - nextRoundCheckStart;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkNextRound completed", {
            checkNextRoundDuration: `${checkNextRoundDuration}ms`,
            isFreeSpinEffectCompleted,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingSlotErrorHandler, (handler) => handler.handleEndGameApiError())
    handleEndGameApiError() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleEndGameApiError called - Handling end game API error", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(AutoPlayHandler, (handler) => handler.checkAutoPlayWhenSettlementCompleted())
    enableAutoPlayOnFreeSpinCompleted() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] enableAutoPlayOnFreeSpinCompleted called - Enabling autoplay on free spin completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.roundId)
    renderRoundId(roundId: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderRoundId called - Rendering round ID", {
            roundId,
            lblRoundIdExists: !!this.lblRoundId,
            timestamp: new Date().toISOString()
        });

        if (roundId < 1) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderRoundId - Round ID invalid, clearing label", {
                roundId,
                timestamp: new Date().toISOString()
            });
            this.lblRoundId && (this.lblRoundId.string = "");
            return;
        }

        const roundIdString = `#${roundId}`;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderRoundId - Setting round ID label", {
            roundId,
            roundIdString,
            timestamp: new Date().toISOString()
        });
        this.lblRoundId && (this.lblRoundId.string = roundIdString);
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderRoundId completed", {
            roundId,
            roundIdString,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleNewRound called - Handling new round", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsTotal(freespins))
    setFreeSpinsTotal(freespins: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setFreeSpinsTotal called - Setting total free spins", {
            freespins,
            timestamp: new Date().toISOString()
        });
        const result = freespins;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setFreeSpinsTotal completed", {
            freespins,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsByRound(freespins))
    setFreeSpinsByRound(freespins: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setFreeSpinsByRound called - Setting free spins by round", {
            freespins,
            timestamp: new Date().toISOString()
        });
        const result = freespins;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setFreeSpinsByRound completed", {
            freespins,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(AutoPlayHandler, (handler) => handler.checkSpinNextRound())
    checkSpinNextRound() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkSpinNextRound called - Checking if should spin next round", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(HyperSpinHandler, (handler) => handler.checkHyperSpinNextRound())
    checkHyperSpinNextRound() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkHyperSpinNextRound called - Checking hyper spin next round", {
            isHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });
        cascadingSlotLogger.info("[HYPER_SPIN_GAME] CascadingSlotGame.checkHyperSpinNextRound() - Called after bet settlement");
        // The @handle decorator will automatically call the HyperSpinHandler.checkHyperSpinNextRound() method
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkHyperSpinNextRound completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(FSBPromotionUIStore, (store) => store.changeUserBalance)
    handleUpdateBalance(isUpdateBalance: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleUpdateBalance called - Handling balance update", {
            isUpdateBalance,
            timestamp: new Date().toISOString()
        });
        if (isUpdateBalance) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleUpdateBalance - Balance changed, calling handleChangeUserBalance", {
                isUpdateBalance,
                timestamp: new Date().toISOString()
            });
            this.handleChangeUserBalance(true);
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleUpdateBalance - No balance change, skipping", {
                isUpdateBalance,
                timestamp: new Date().toISOString()
            });
        }
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleUpdateBalance completed", {
            isUpdateBalance,
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => ({ balance: store.userBalance, changedBalance: store.changeUserBalance }))
    setBalance(data: { balance: number; changedBalance: boolean }) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setBalance called - Setting balance", {
            data,
            balance: data?.balance,
            changedBalance: data?.changedBalance,
            lblBalanceExists: !!this.lblBalance,
            timestamp: new Date().toISOString()
        });

        if (!data || !data.changedBalance) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setBalance - No data or balance not changed, skipping", {
                hasData: !!data,
                changedBalance: data?.changedBalance,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const value = data.balance;
        if (value === undefined || value === null) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setBalance - Balance value is invalid, skipping", {
                value,
                timestamp: new Date().toISOString()
            });
            return;
        }

        const formattedBalance = FormatUtils.truncateFixedDecimals(value, 2).toString();
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setBalance - Setting balance label", {
            value,
            formattedBalance,
            timestamp: new Date().toISOString()
        });
        this.lblBalance && (this.lblBalance.string = formattedBalance);
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setBalance completed", {
            value,
            formattedBalance,
            timestamp: new Date().toISOString()
        });
    }

    @handle(gc.Auth.AuthHandlers.GetBalance)
    getBalance() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] getBalance called - Requesting balance from server", {
            timestamp: new Date().toISOString()
        });
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTurboMode called - Rendering turbo mode", {
            isTurboMode,
            previousTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });
        this.isTurboMode = isTurboMode;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderTurboMode completed - Turbo mode updated", {
            isTurboMode,
            currentTurboMode: this.isTurboMode,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handle, multiplier: number) => handle.handleTotalMultiplier(multiplier))
    setTotalMultiplierValue(totalMultiplier: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setTotalMultiplierValue called - Setting total multiplier value", {
            totalMultiplier,
            timestamp: new Date().toISOString()
        });
        const result = totalMultiplier;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setTotalMultiplierValue completed", {
            totalMultiplier,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, bigWin: any) => handle.handleHaveBigWin(bigWin))
    handleHaveBigWin(bigwin: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleHaveBigWin called - Handling big win", {
            bigwin,
            timestamp: new Date().toISOString()
        });
        const result = bigwin;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleHaveBigWin completed", {
            bigwin,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, isShow: any) => handle.setReachMaxWin(isShow))
    setReachMaxWin(isShow: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setReachMaxWin called - Setting reach max win", {
            isShow,
            timestamp: new Date().toISOString()
        });
        const result = isShow;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] setReachMaxWin completed", {
            isShow,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, win: number) => handle.handleBigWinAmount(win))
    updateBigWinAmount(win: number) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] updateBigWinAmount called - Updating big win amount", {
            win,
            timestamp: new Date().toISOString()
        });
        const result = win;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] updateBigWinAmount completed", {
            win,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, freespin: any) => handle.handleHaveFreeSpin(freespin))
    handleHaveFreeSpin(freespin: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleHaveFreeSpin called - Handling free spin", {
            freespin,
            timestamp: new Date().toISOString()
        });
        const result = freespin;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleHaveFreeSpin completed", {
            freespin,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleChangeUserBalance called - Handling user balance change", {
            changed,
            timestamp: new Date().toISOString()
        });
        const result = changed;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleChangeUserBalance completed", {
            changed,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handle, params: any) => handle.handleTotalWin(params))
    handleTotalWin(params: { win: number; isActualWin: boolean }) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleTotalWin called - Handling total win", {
            params,
            win: params?.win,
            isActualWin: params?.isActualWin,
            timestamp: new Date().toISOString()
        });
        const result = params;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleTotalWin completed", {
            params,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] playSound called - Playing sound effect", {
            id,
            timestamp: new Date().toISOString()
        });
        const result = id;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] playSound completed", {
            id,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    private focusGameCanvas() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas called - Focusing game canvas", {
            canvasExists: !!game.canvas,
            timestamp: new Date().toISOString()
        });
        // Auto-focus the game canvas when loading
        if (game.canvas) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas - Canvas exists, scheduling focus", {
                timestamp: new Date().toISOString()
            });
            // Set initial focus
            setTimeout(() => {
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas - Applying focus to canvas", {
                    timestamp: new Date().toISOString()
                });
                game.canvas.focus();
                cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas - Focus applied", {
                    timestamp: new Date().toISOString()
                });
            }, 100);
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas - Canvas does not exist, skipping focus", {
                timestamp: new Date().toISOString()
            });
        }
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] focusGameCanvas completed", {
            timestamp: new Date().toISOString()
        });
    }

    @render(GameVisibilityStore, (store) => store.isVisible)
    renderGameVisibility(isVisible: boolean) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderGameVisibility called - Rendering game visibility", {
            isVisible,
            isHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        if (!isVisible) {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderGameVisibility - Game not visible, calling handleOnGameHide", {
                isVisible,
                timestamp: new Date().toISOString()
            });

            // Check if hyper-spin batch should be interrupted when game is hidden
            if (this.isHyperSpinActive) {
                cascadingSlotLogger.warn("[HYPER_SPIN_INTERRUPTION] Game hidden during active hyper-spin batch", {
                    isHyperSpinActive: this.isHyperSpinActive,
                    timestamp: new Date().toISOString()
                });

                // Mark batch as interrupted due to game visibility change
                this.handleHyperSpinInterruptionDueToGameHide();
            }

            this.handleOnGameHide();
        } else {
            cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderGameVisibility - Game is visible", {
                isVisible,
                timestamp: new Date().toISOString()
            });
        }
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] renderGameVisibility completed", {
            isVisible,
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.handleOnGameHide())
    handleOnGameHide() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleOnGameHide called - Handling game hide event", {
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle hyper-spin interruption when game is hidden
     */
    private handleHyperSpinInterruptionDueToGameHide() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleHyperSpinInterruptionDueToGameHide called", {
            isHyperSpinActive: this.isHyperSpinActive,
            timestamp: new Date().toISOString()
        });

        // The interruption will be detected by the HyperSpinHandler.checkHyperSpinNextRound()
        // when it next runs and finds the game is hidden
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] Hyper-spin interruption will be detected on next round check", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.handleTriggerWinMultiplier())
    handleTriggerWinMultiplier() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] handleTriggerWinMultiplier called - Triggering win multiplier", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(CascadingUIHandler, (handler) => handler.checkHyperSpinBatchRecovery())
    checkHyperSpinBatchRecovery() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] checkHyperSpinBatchRecovery called - Checking for interrupted batches", {
            timestamp: new Date().toISOString()
        });
    }

    @handle(FSBPromotionUIHandler, (handler, payload: { win: number; totalFreeSpins: number }) => handler.updateTotalWin(payload))
    updateTotalWinPromo(payload: { win: number; totalFreeSpins: number }) {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] updateTotalWinPromo called - Updating total win promotion", {
            payload,
            win: payload?.win,
            totalFreeSpins: payload?.totalFreeSpins,
            timestamp: new Date().toISOString()
        });
        const result = payload;
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] updateTotalWinPromo completed", {
            payload,
            result,
            timestamp: new Date().toISOString()
        });
        return result;
    }

    @handle(CascadingUIHandler, (handler) => handler.triggerOpenDialog(DialogName.DUMMY_DIALOG))
    clickOnBackground() {
        cascadingSlotLogger.info("[CASCADING_SLOT_GAME] clickOnBackground called - Background clicked, opening dialog", {
            dialogName: DialogName.DUMMY_DIALOG,
            timestamp: new Date().toISOString()
        });
    }
}
