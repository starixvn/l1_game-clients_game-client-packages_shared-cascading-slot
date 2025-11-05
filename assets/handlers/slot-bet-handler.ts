import gc from "@sg/game-client-base";
import inversify from "inversify";

import { CascadingSlotState } from "../cascading-slot-state";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { AutoPlayStore } from "../stores/auto-play-store";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingUIHandler } from "./cascading-ui-handler";
import { FSBPromotionUIStore } from "db://shared-common-slot/fsb-promotion/scripts/stores/fsb-promotion-ui-store";

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
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] handle called - Processing standard bet", {
            timestamp: new Date().toISOString()
        });

        const betData = this.slotBetData();
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Retrieved bet data for standard bet", {
            betData,
            totalBet: betData.totalBet,
            timestamp: new Date().toISOString()
        });

        const result = this.handleBetDataWithAmount(betData, betData.totalBet);
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] handle completed", {
            result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    buyFreespins(amount: number) {
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] buyFreespins called", {
            amount,
            timestamp: new Date().toISOString()
        });

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Calling handleNewRound before buy freespins", {
            timestamp: new Date().toISOString()
        });
        this.uiHandler.handleNewRound();

        const betData = this.slotBetData();
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Retrieved bet data for freespins purchase", {
            betData,
            amount,
            timestamp: new Date().toISOString()
        });

        Object.assign(betData, { buyFreeSpin: true });
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Added buyFreeSpin flag to bet data", {
            modifiedBetData: betData,
            timestamp: new Date().toISOString()
        });

        const result = this.handleBetDataWithAmount(betData, amount);
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] buyFreespins completed", {
            amount,
            result,
            timestamp: new Date().toISOString()
        });

        return result;
    }

    slotBetData() {
        const isFreeSpin = this.uiStore.isFreeSpins || this.fsbPromotionUIStore.isFSBPromotionInProgress;
        
        const betData = {
            m: this.orientationStore.m,
            username: this.mainPlayerStore.name,
            coinValue: this.betControlStore.effectiveCoinValue,
            betLevel: this.betControlStore.effectiveBetLevel,
            totalBet: this.betControlStore.effectiveTotalBet,
            freeSpin: isFreeSpin,
            clientSentTime: new Date(),
        };

        // Warn when free spin bet is being sent
        if (isFreeSpin) {
            console.warn("[SLOT_BET_HANDLER] 🎰 FREE SPIN BET REQUEST - freeSpin = true", {
                betData,
                isFreeSpins: this.uiStore.isFreeSpins,
                isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
                freeSpinsTotal: this.uiStore.freeSpinsTotal,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] slotBetData created", {
            betData,
            orientationStoreM: this.orientationStore.m,
            mainPlayerName: this.mainPlayerStore.name,
            effectiveCoinValue: this.betControlStore.effectiveCoinValue,
            effectiveBetLevel: this.betControlStore.effectiveBetLevel,
            effectiveTotalBet: this.betControlStore.effectiveTotalBet,
            isFreeSpins: this.uiStore.isFreeSpins,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            freeSpin: betData.freeSpin,
            clientSentTime: betData.clientSentTime,
            timestamp: new Date().toISOString()
        });

        return betData;
    }

    handleBetDataWithAmount(data: any, amount: number) {
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] handleBetDataWithAmount called", {
            data,
            amount,
            isTrialMode: this.uiStore.isTrialMode,
            timestamp: new Date().toISOString()
        });

        let success = false;
        const isValid = this.isValidBet(amount);

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation result", {
            amount,
            isValid,
            timestamp: new Date().toISOString()
        });

        if (isValid) {
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Processing valid bet", {
                amount,
                willSendToTrialConnection: this.uiStore.isTrialMode,
                willSendToMainConnection: !this.uiStore.isTrialMode,
                timestamp: new Date().toISOString()
            });

            this.uiStore.changeUserBalance = false;
            this.betStore.isProcessingBet = true;

            if (this.uiStore.isTrialMode) {
                cascadingSlotLogger.info("[SLOT_BET_HANDLER] Sending bet to trial connection", {
                    data,
                    timestamp: new Date().toISOString()
                });
                this.connectionTrialStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
            } else {
                cascadingSlotLogger.info("[SLOT_BET_HANDLER] Sending bet to main connection", {
                    data,
                    timestamp: new Date().toISOString()
                });
                this.connectionStore.send(gc.GameClientEmitMessage.Bet.eventName, data);
            }

            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Changing cascading state to SPINNING", {
                timestamp: new Date().toISOString()
            });
            this.uiHandler.changeCascadingState(CascadingSlotState.SPINNING);

            this.uiStore.changeUserBalance = true;

            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Calling retry game handler", {
                timestamp: new Date().toISOString()
            });
            this.retryGameHandler.handle();

            success = true;
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet processing completed successfully", {
                success,
                timestamp: new Date().toISOString()
            });
        } else {
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation failed, resetting processing", {
                amount,
                timestamp: new Date().toISOString()
            });
            this.uiHandler.resetProcessingBet();
        }

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] handleBetDataWithAmount completed", {
            success,
            amount,
            timestamp: new Date().toISOString()
        });
        return success;
    }

    isValidBet(amount: number) {
        cascadingSlotLogger.info("[SLOT_BET_HANDLER] isValidBet called", {
            amount,
            isProcessingBet: this.betStore.isProcessingBet,
            isFreeSpins: this.uiStore.isFreeSpins,
            isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
            userBalance: this.uiStore.userBalance,
            validateBalanceWhenBet: this.gameSetting?.validateBalanceWhenBet,
            timestamp: new Date().toISOString()
        });

        if (this.betStore.isProcessingBet) {
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation failed - already processing bet", {
                timestamp: new Date().toISOString()
            });
            this.showWarningProcessingBet();
            return false;
        }

        if (this.uiStore.isFreeSpins || this.fsbPromotionUIStore.isFSBPromotionInProgress) {
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation passed - free spins or FSB promotion active", {
                isFreeSpins: this.uiStore.isFreeSpins,
                isFSBPromotionInProgress: this.fsbPromotionUIStore.isFSBPromotionInProgress,
                timestamp: new Date().toISOString()
            });
            return true;
        }

        const availableBalance = this.uiStore.userBalance;
        const shouldValidateBalance = this.gameSetting?.validateBalanceWhenBet;
        const hasInsufficientBalance = amount > availableBalance;

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Balance validation check", {
            amount,
            availableBalance,
            shouldValidateBalance,
            hasInsufficientBalance,
            timestamp: new Date().toISOString()
        });

        if (shouldValidateBalance && hasInsufficientBalance) {
            cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation failed - insufficient balance", {
                amount,
                availableBalance,
                timestamp: new Date().toISOString()
            });
            this.showNoticePlaceBetFailure();
            return false;
        }

        cascadingSlotLogger.info("[SLOT_BET_HANDLER] Bet validation passed", {
            amount,
            timestamp: new Date().toISOString()
        });
        return true;
    }
}
