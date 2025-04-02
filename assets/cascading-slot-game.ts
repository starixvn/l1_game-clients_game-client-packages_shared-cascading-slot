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

import { AutoPlayHandler } from "./auto-play/scripts/auto-play-handlers";
import { AutoPlayStore } from "./auto-play/scripts/auto-play-store";
import { SlotBetHandler } from "./bets/slot-bet-handler";
import { CascadingSlotConfig, UNIT_SECOND_SPIN } from "./cascading-slot-base-configs";
import { CascadingSlotState } from "./cascading-slot-state";
import { convertData, prefabCache } from "./cascading-slot-utils";
import { CascadingFreespinsHandler } from "./freespins/scripts";
import { CascadingUIHandler } from "./main-ui/cascading-ui-handler";
import { CascadingSlotSettlementStore } from "./settlements";
import { CascadingSlotBoard } from "./slot-board/components/cascading-slot-board";
import { CascadingTotalMultiplierHandler } from "./total-multiplier/scripts/cascading-total-multiplier-handler";
import { TotalMultiplierView } from "./total-multiplier/scripts/cascading-total-multiplier-view";
import { TumbleWinWiew } from "./tumbles/scripts/components/tumble-win-view";

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

    private isAutoplay = false;
    private roundsAutoplay = 0;

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

    @render(AutoPlayStore, (store) => store.isAutoplay)
    onAutoplay(isAutoplay: boolean) {
        this.isAutoplay = isAutoplay;
    }

    @render(AutoPlayStore, (store) => store.roundsAutoplay)
    onRoundsAutoplay(roundsAutoplay: number) {
        this.roundsAutoplay = roundsAutoplay;
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
        const { win, roundId, totalFreeSpins, isFreeSpin, multiplier, totalMultiplier, reachMaxWin, tumbles, result, actualBetwin } =
            finishData;
        const symbolsBoard = { symbols: convertData(result), multipliers: tumbles[0]?.multipliers, isTurbo: false, tumbles };
        await this.board.spinResult(symbolsBoard);
        await this.board.handleTumbles(tumbles);
        const winMultiplier = multiplier > 0 && win > 0;
        await this.board.handleMultiplier(isFreeSpin, winMultiplier, this.tumbleWinView, this.totalMultiplierView);
        if (win > 0) {
            this.getBalance();
            await this.tumbleWinView.setTotalWinValue(actualBetwin);
        }

        this.setFreeSpins(totalFreeSpins);
        const needShowTotalMultiplier = totalMultiplier > 0;
        if (winMultiplier && isFreeSpin && needShowTotalMultiplier) {
            await this.totalMultiplierView.showView(true);
            await this.board.movingMultiplier(
                this.tumbleWinView.multiplier.node,
                this.effectContainer,
                this.totalMultiplierView.total.node
            );
        }
        await this.showEffectSpecialCase(finishData);
        const delayForNextSpin = this.getCustomDuration("delayForNextSpin");
        await FunctionUtils.delay(delayForNextSpin * UNIT_SECOND_SPIN);
        this.changeCascadingState(CascadingSlotState.SETTLED);
        isFreeSpin && this.handleFreeSpins(totalFreeSpins);
        this.checkSpinNextRound();
    }

    @render(Rounds.RoundStore, (store) => store.clientRoundId)
    renderRoundId(roundId: number) {
        roundId > 1 && this.lblRoundId && (this.lblRoundId.string = `#${roundId}`);
    }

    @handle(SlotBetHandler, (handler) => handler.handle())
    sendBet() {}

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {}

    @handle(CascadingUIHandler, (handler, state: string) => handler.changeCascadingState(state))
    changeCascadingState(state: string) {
        return state;
    }

    @handle(CascadingFreespinsHandler, (handle, freespins: number) => handle.setTotalFreeSpins(freespins))
    setFreeSpins(freespins: number) {
        return freespins;
    }

    @handle(CascadingTotalMultiplierHandler, (handler, winMultiplier: boolean) => handler.setWinMultiplier(winMultiplier))
    setWinMultiplier(multiplier: number, win: number) {
        return multiplier > 0 && win > 0;
    }

    spin() {
        this.handleNewRound();
        this.sendBet();
        this.changeCascadingState(CascadingSlotState.SPINNING);
        this.handleSymbolPreviewVisiblity(false);
    }

    @handle(AutoPlayHandler, (handler) => handler.checkSpinNextRound())
    checkSpinNextRound() {}

    handleFreeSpins(totalFreeSpins: number) {
        if (totalFreeSpins > 0) {
            this.spin();
        }
    }

    getCustomDuration(key: string): number {
        //const config = this.isTurboMode() ? CascadingSlotConfig.turbo : CascadingSlotConfig.normal;
        const config = CascadingSlotConfig.normal;
        return config[key];
    }

    async showEffectSpecialCase(data: any) {
        const { bigWin, freeSpins } = data;
        if (bigWin) {
            console.log("show effect big win");
            await FunctionUtils.delay(1000);
        }

        if (freeSpins > 0) {
            await this.board.highlightScatterItems();
            console.log("show effect free spins");
            await FunctionUtils.delay(1000);
        }
    }

    @render(gc.Player.MainPlayerStore, (store) => store.balance)
    setBalance(value: number) {
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
}
