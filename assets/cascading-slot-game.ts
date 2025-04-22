import gc from "@sg/game-client-base";
import { _decorator, Component, Game, game, Input, input, JsonAsset, KeyCode, Label, Node, sp } from "cc";
import { LogStore } from "db://shared-components/game/scripts/stores/log-store";
import { bundleManager } from "db://shared-components/shared/common-components/bundle-manager/bundle-manager";
import { StaticNode } from "db://shared-components/shared/common-components/static-node/scripts/static-node";
import { StaticGroupId } from "db://shared-components/shared/common-components/static-node/scripts/static-node-info";
import { FunctionUtils } from "db://shared-components/shared/utils";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import Observer from "observer";

import { CascadingSlotConfig, UNIT_SECOND_SPIN } from "./cascading-slot-base-configs";
import { convertData, getCustomDuration, resourcesCache } from "./cascading-slot-utils";
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
import { HoldActionStore } from "./stores/hold-action-store";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;
const { Rounds, Connection, HideGame, Settlements, FormatUtils, RoundHistories } = gc;

@ccclass
export class CascadingSlotGame extends Component {
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
            this.board.colorInfo = this.colorInfo;
            this.board.initBoardFullItems();
        });
        this.addEvent();
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
        this.removeEvent();
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
        const cache = resourcesCache.slotSymbols || {};
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

        resourcesCache.slotSymbols = cache;
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
            this.handleTotalWin({ win: actualBetwin, isActualWin: true });
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

            // Enable autoplay when free spin effect is completed
            this.enableAutoPlayOnFreeSpinCompleted();

            // When the free spin effect is completed, handle the next round
            // by automatically spinning
            this.checkSpinNextRound();
        }
    }

    @handle(AutoPlayHandler, (handler) => handler.checkAutoPlayWhenSettlementCompleted())
    enableAutoPlayOnFreeSpinCompleted() {}

    @render(CascadingUIStore, (store) => store.roundId)
    renderRoundId(roundId: number) {
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
        if (value === undefined || value === null) {
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

    @handle(CascadingUIHandler, (handler, changed: boolean) => handler.handleChangeUserBalance(changed))
    handleChangeUserBalance(changed: boolean) {
        return changed;
    }

    @handle(CascadingUIHandler, (handle, state: string) => handle.updateSpinButtonState(state))
    setSpinningButtonState(state: string) {
        return state;
    }

    @handle(CascadingUIHandler, (handle, params: any) => handle.handleTotalWin(params))
    handleTotalWin(params: { win: number; isActualWin: boolean }) {
        return params;
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    addEvent() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    removeEvent() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE) {
            this.updatePressingKey(true);
        }
    }

    onKeyUp(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE) {
            this.updatePressingKey(false);
        }
    }

    @handle(AutoPlayHandler, (handler, isPressingKey: boolean) => handler.updatePressingKey(isPressingKey))
    updatePressingKey(isPressingKey: boolean) {
        return isPressingKey;
    }

    @render(HoldActionStore, (store) => store.isPressingKey, { fireImmediately: false })
    handlePressingKey(isPressingKey: boolean) {
        if (!isPressingKey) {
            return;
        }

        this.spin();
    }
}
