import gc from "@sg/game-client-base";
import inversify from "inversify";

import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";
import { FunctionUtils } from "db://shared-components/shared/utils/function-utils";
import { CascadingSlotState } from "../cascading-slot-state";
import { AutoPlayStore } from "../stores/auto-play-store";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingHoldActionHandlers } from "./cascading-hold-action-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class SlotBetHandler extends gc.Bet.BetHandler {
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(CascadingUIHandler) protected readonly uiHandler: CascadingUIHandler;
    @inject(gc.Connection.ConnectionTrialStore) protected readonly connectionTrialStore: gc.Connection.ConnectionTrialStore;
    @inject(CascadingUIStore) protected readonly uiStore: CascadingUIStore;
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;

    @inject(FSBPromotionUIStore) protected readonly fsbPromotionUIStore: FSBPromotionUIStore;
    @inject(gc.Bet.BetResponseHandlers) protected readonly betResponseHandlers: gc.Bet.BetResponseHandlers;
    @inject(CascadingHoldActionHandlers) protected readonly cascadingHoldActionHandlers: CascadingHoldActionHandlers;

    handle() {
        const betData = this.slotBetData();
        return this.handleBetDataWithAmount(betData, betData.totalBet);
    }

    handleInterruption() {
        if (this.betStore.isProcessingBet) {
            this.resetBetProcessingInterrupt();
            if (this.uiStore.isAutoSpinOrFreeSpin || this.fsbPromotionUIStore.isFSBPromotionInProgress) {
                this.handle();
            }
        }
    }

    resetBetProcessingInterrupt() {
        this.uiStore.isPlacingBet = false;
        this.betResponseHandlers.stopProcessingBetAndClearInterval();
        this.uiHandler.resetProcessingBet();
        this.cascadingHoldActionHandlers.clearTriggerAction();
    }

    buyFreespins(amount: number) {
        this.uiHandler.handleNewRound();
        const betData = this.slotBetData();
        Object.assign(betData, { buyFreeSpin: true });
        return this.handleBetDataWithAmount(betData, amount);
    }

    slotBetData() {
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.effectiveCoinValue,
            betLevel: this.betControlStore.effectiveBetLevel,
            totalBet: this.betControlStore.effectiveTotalBet,
            freeSpin: this.uiStore.isFreeSpins || this.fsbPromotionUIStore.isFSBPromotionInProgress,
            clientSentTime: new Date(),
        };
    }

    isConnectionReady() {
        return this.connectionStore.isConnected && this.connectionStore.signedIn;
    }

    async sendRequestBet(data: any) {
        await FunctionUtils.waitUntil(() => this.isConnectionReady(), 100, 20 * 60000).catch(() => { });
        if (!this.isConnectionReady()) {
            return;
        }

        this.uiStore.isTrialMode
            ? this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data)
            : this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
        this.retryGameHandler.handle();
    }

    handleBetDataWithAmount(data: any, amount: number) {
        let success = false;
        if (this.isValidBet(amount)) {
            this.uiStore.changeUserBalance = false;
            this.betStore.isProcessingBet = true;
            this.sendRequestBet(data);
            this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
            this.uiStore.changeUserBalance = true;

            success = true;
        } else {
            this.uiHandler.resetProcessingBet();
        }

        return success;
    }

    isValidBet(amount: number) {
        if (this.betStore.isProcessingBet) {
            this.showWarningProcessingBet();
            return false;
        }

        if (this.uiStore.isFreeSpins || this.fsbPromotionUIStore.isFSBPromotionInProgress) {
            return true;
        }

        const availableBalance = this.uiStore.userBalance;
        if (this.gameSetting?.validateBalanceWhenBet && amount > availableBalance) {
            this.showNoticePlaceBetFailure();
            return false;
        }

        return true;
    }
}
