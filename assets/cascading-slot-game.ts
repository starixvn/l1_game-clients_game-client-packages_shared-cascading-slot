import gc from "@sg/game-client-base";
import { _decorator, Game, game, JsonAsset, Label, Node, Prefab, sp } from "cc";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { StaticNode } from "db://shared-components/shared/common-components/static-node/scripts/static-node";
import { StaticGroupId } from "db://shared-components/shared/common-components/static-node/scripts/static-node-info";
import { FunctionUtils } from "db://shared-components/shared/utils";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import Observer from "observer";

import { CascadingSlotConfig, UNIT_SECOND_SPIN } from "./cascading-slot-base-configs";
import { convertData, getCustomDuration, prefabCache } from "./cascading-slot-utils";
import { CascadingEffectGameContainer } from "./components/effects/cascading-effect-game-container";
import { CascadingSlotBoard } from "./components/slot-board/components/cascading-slot-board";
import { TotalMultiplierView } from "./components/total-multiplier/cascading-total-multiplier-view";
import { TumbleWinWiew } from "./components/tumbles/tumble-win-view";
import { AutoPlayHandler } from "./handlers/auto-play-handlers";
import { CascadingUIHandler } from "./handlers/cascading-ui-handler";
import { SlotBetHandler } from "./handlers/slot-bet-handler";
import { AutoPlayStore } from "./stores/auto-play-store";
import { CascadingSlotSettlementStore } from "./stores/cascading-slot-settlement-store";
import { CascadingUIStore } from "./stores/cascading-ui-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Rounds, Connection, HideGame, Settlements, FormatUtils, RoundHistories } = gc;

@ccclass
export class CascadingSlotGame extends ObserverComponent {
    @property(CascadingSlotBoard)
    board: CascadingSlotBoard = null;

    @property(TotalMultiplierView)
    totalMultiplierView: TotalMultiplierView = null;

    @property(TumbleWinWiew)
    tumbleWinView: TumbleWinWiew = null;

    @property(Node)
    effectContainer: Node = null;

    @property(CascadingEffectGameContainer)
    effectGameContainer: CascadingEffectGameContainer = null;

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

    protected enableEventShowHideGame = true;

    public isTurboMode = false;
    private spinButtonSound = "spin_button";

    onLoad() {
        this.loadSlotSymbols().then(async () => {
            await this.loadMultiplierPrefab();
            this.board.colorInfo = this.colorInfo;
            this.board.initBoardFullItems();
            super.onLoad();
        });
    }

    private registerEventShowHideGame() {
        if (!this.enableEventShowHideGame) {
            return;
        }
        game.on(Game.EVENT_HIDE, this.onHideGame, this);
        game.on(Game.EVENT_SHOW, this.onShowGame, this);
    }

    private clearEventShowHideGame() {
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
    connectToService() {}

    @render(gc.GameConfigs.GameSetting, (gameSetting) => gameSetting.name)
    logLoadScene(gameName: string) {
        console.log(`LoadScene ${gameName}`);
    }

    @render(LogStore, (store) => store.message)
    logInfo(message: string) {}

    @handle(gc.UserSettings.UserSettingHandlers, (handle) => handle.loadStorages())
    initUserSettings() {}

    @handle(gc.PlayerSelections.PlayerSelectionHandlers.InitHandlers)
    initPlayerSelections() {}

    onDestroy(): void {
        super.onDestroy();
        this.clearEventShowHideGame();
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

    @render(Connection.ConnectionStore, (store) => store.signedIn)
    onSignedIn(signedIn: boolean) {
        signedIn && this.inGame();
    }

    @handle(Connection.ConnectionHandlers.InGameHandler)
    inGame() {}

    async loadSlotSymbols() {
        const cache = prefabCache.slotSymbols || {};
        for (let index = 0; index < CascadingSlotConfig?.symbolCount; index++) {
            if (cache[index]) {
                continue;
            }
            const path = `symbol-spines/symbol-${index}`;
            //const devPath = `../games/*/${path}`;
            try {
                const data = await bundleManager.loadAssetsFromBundle<sp.SkeletonData>("resources", path, sp.SkeletonData, null);
                // const data = await BundleManager.getInstance().loadAsset<sp.SkeletonData>({
                //     bundleId: this.gameId.toString(),
                //     path: path,
                //     pathForDevMode: devPath,
                //     type: sp.SkeletonData
                // });

                cache[index] = data;
            } catch (error) {
                console.warn(`Missing SkeletonData for ${path} `, error);
            }
        }

        prefabCache.slotSymbols = cache;
    }

    async loadMultiplierPrefab() {
        const cache = prefabCache.multiplierPrefab || {};
        if (cache !== null) {
            const path = `prefabs/multiplier`;
            try {
                const prefab = await bundleManager.loadAssetsFromBundle<Prefab>("resources", path, Prefab, null);

                prefabCache.multiplierPrefab = prefab;
            } catch (e) {
                console.warn(`Missing prefab for ${path} `, e);
            }
        }
    }

    @render(CascadingSlotSettlementStore, (store) => store.finishData, { fireImmediately: false })
    async handleSettlement(finishData: any) {
        if (!finishData) {
            return;
        }
        this.handleChangeUserBalance(false);
        const {
            win,
            bigWin,
            roundId,
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
        const symbolsBoard = { symbols: convertData(result), multipliers: tumbles[0]?.multipliers, isTurbo: false, tumbles };
        await this.board.spinResult(symbolsBoard, this.isTurboMode);
        await this.board.handleTumbles(tumbles);
        const winMultiplier = multiplier > 0 && win > 0;
        await this.board.handleMultiplier(isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        if (win > 0) {
            this.getBalance();
            this.handleChangeUserBalance(true);
            await this.tumbleWinView.setTotalWinValue(actualBetwin);
        }

        const needShowTotalMultiplier = totalMultiplier > 0;
        if (winMultiplier && isFreeSpin && needShowTotalMultiplier) {
            await this.totalMultiplierView.showView(true);
            await this.board.movingMultiplier(
                this.tumbleWinView.multiplier.node,
                this.effectContainer,
                this.totalMultiplierView.total.node
            );
        }

        this.setTotalMultiplierValue(totalMultiplier);
        this.handleHaveBigWin(bigWin);
        this.updateBigWinAmount(win);

        this.setFreeSpinsByRound(freeSpins);
        this.setFreeSpinsTotal(totalFreeSpins);
        this.handleHaveFreeSpin(freeSpins > 0);
    }

    @render(CascadingUIStore, (store) => store.isFreeSpinEffectCompleted)
    async checkNextRound(isFreeSpinEffectCompleted: boolean) {
        if (isFreeSpinEffectCompleted) {
            const delayForNextSpin = getCustomDuration("delayForNextSpin", this.isTurboMode);
            await FunctionUtils.delay(delayForNextSpin * UNIT_SECOND_SPIN);
            this.checkSpinNextRound();
        }
    }

    @render(CascadingUIStore, (store) => store.roundId)
    renderRoundId(roundId: number) {
        console.log("renderRoundId", roundId);
        if (roundId < 1) {
            this.lblRoundId && (this.lblRoundId.string = "");
            return;
        }
        this.lblRoundId && (this.lblRoundId.string = `#${roundId}`);
    }

    @handle(SlotBetHandler, (handler) => handler.handle())
    sendBet() {}

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {}

    @handle(CascadingUIHandler, (handler, state: string) => handler.changeCascadingState(state))
    changeCascadingState(state: string) {
        return state;
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsTotal(freespins))
    setFreeSpinsTotal(freespins: number) {
        return freespins;
    }

    @handle(CascadingUIHandler, (handle, freespins: number) => handle.handleFreeSpinsByRound(freespins))
    setFreeSpinsByRound(freespins: number) {
        return freespins;
    }

    spin() {
        this.playSound(this.spinButtonSound);
        this.handleNewRound();
        this.sendBet();
        this.handleSymbolPreviewVisiblity(false);
    }

    @handle(AutoPlayHandler, (handler) => handler.checkSpinNextRound())
    checkSpinNextRound() {}

    @render(CascadingUIStore, (store) => store.userBalance)
    setBalance(value: number) {
        if (!value) {
            return;
        }
        this.lblBalance && (this.lblBalance.string = FormatUtils.truncateFixedDecimals(value, 2).toString());
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    handleSymbolPreviewVisiblity(isVisible: boolean) {
        return isVisible;
    }

    hideSymbolPreview() {
        this.handleSymbolPreviewVisiblity(false);
    }

    @handle(gc.Auth.AuthHandlers.GetBalance)
    getBalance() {}

    @render(AutoPlayStore, (store) => store.triggerBet)
    renderTriggerBet(triggerBet: boolean) {
        if (triggerBet) {
            this.spin();
        }
    }

    @render(CascadingUIStore, (store) => store.isTurboMode)
    renderTurboMode(isTurboMode: boolean) {
        this.isTurboMode = isTurboMode;
    }

    @handle(CascadingUIHandler, (handler, state: string) => handler.handleBottomMessage(state))
    handleBottomMessage(state: string) {
        return state;
    }

    @handle(CascadingUIHandler, (handle, multiplier: number) => handle.handleTotalMultiplier(multiplier))
    setTotalMultiplierValue(totalMultiplier: number) {
        return totalMultiplier;
    }

    @handle(CascadingUIHandler, (handle, bigWin: any) => handle.handleHaveBigWin(bigWin))
    handleHaveBigWin(bigwin: boolean) {
        return bigwin;
    }

    @handle(CascadingUIHandler, (handle, win: number) => handle.handleBigWinAmount(win))
    updateBigWinAmount(win: number) {
        return win;
    }

    @handle(CascadingUIHandler, (handle, freespin: any) => handle.handleHaveFreeSpin(freespin))
    handleHaveFreeSpin(freespin: boolean) {
        return freespin;
    }

    @handle(CascadingUIHandler, (handler, completed: boolean) => handler.handleFreeSpinEffectCompleted(completed))
    setFreeSpinEffectCompleted(completed: boolean) {
        return completed;
    }

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        return changed;
    }

    @handle(CascadingUIHandler, (handle, state: string) => handle.updateSpinButtonState(state))
    setSpinningButtonState(state: string) {
        return state;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }
}
