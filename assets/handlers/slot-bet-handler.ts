import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { AutoPlayStore } from "../stores/auto-play-store";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { FSBPromotionUIStore } from "db://shared-common-slot/index";

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

    handle() {
        const betData = this.slotBetData();
        return this.handleBetData(betData);
    }
    slotBetData() {
        return {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.coinValue,
            betLevel: this.betControlStore.betLevel,
            totalBet: this.betControlStore.totalBet,
            freeSpin: this.uiStore.isFreeSpins || this.fsbPromotionUIStore.isFSBPromotionInProgress,
            clientSentTime: new Date(),
        };
    }

    handleBetData(data: any) {
        let success = false;
        const amount = data.totalBet;
        if (this.isValidBet(amount)) {
            this.uiStore.changeUserBalance = false;
            this.betStore.isProcessingBet = true;
            this.uiStore.isTrialMode
                ? this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data)
                : this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
            this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);
            this.uiStore.changeUserBalance = true;

            this.retryGameHandler.handle();
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
