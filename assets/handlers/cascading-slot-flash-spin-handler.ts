import { FlashSpinEvent, SettlementInfo, STEP_DURATION } from "db://shared-common-slot/flash-spin/scripts/flash-spin-definitions";
import { AnimationUtils } from "db://shared-components/shared/utils";
import inversify from "inversify";
import mobx from "mobx";
import { FlashSpinHandler } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-handler";
import { FlashSpinStore } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-store";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { AutoPlayHandler } from "./auto-play-handlers";
import { BetControlHandlers } from "./bet-control-handlers";
import { CascadingUIHandler } from "./cascading-ui-handler";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotFlashSpinHandler {
    @inject(FlashSpinStore) protected readonly hyperSpinStore: FlashSpinStore;
    @inject(FlashSpinHandler) protected readonly hyperSpinHandler: FlashSpinHandler;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(AutoPlayHandler) protected readonly autoPlayHandler: AutoPlayHandler;
    @inject(BetControlHandlers) protected readonly betControlHandler: BetControlHandlers;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;

    constructor() {
        setTimeout(() => {
            mobx.reaction(
                () => this.hyperSpinStore.event,
                (event) => {
                    switch (event?.action) {
                        case FlashSpinEvent.PLACE_BET:
                            this.onPlaceBet();
                            break;
                        case FlashSpinEvent.OPEN_DIALOG:
                            this.openDialog(event.name);
                            break;
                        case FlashSpinEvent.CHANGE_TOTAL_BET:
                            this.changeTotalBet(event.increase);
                            break;
                        case FlashSpinEvent.CHANGE_TOTAL_BET_SLIDER:
                            this.setTotalBetFromSlider(event.progress);
                            break;
                        default:
                            break;
                    }
                }
            );

            mobx.reaction(
                () => this.betControlStore.totalBet,
                (totalBet) => {
                    this.hyperSpinStore.totalBet = totalBet;
                }
            );

            mobx.reaction(
                () => this.betControlStore.totalBetSliderProgress,
                (totalBetSliderProgress) => {
                    this.hyperSpinStore.totalBetSliderProgress = totalBetSliderProgress;
                }
            );

            mobx.reaction(
                () => this.cascadingUIStore.userBalance,
                (balance) => {
                    this.hyperSpinStore.userBalance = balance;
                }
            );

            mobx.reaction(
                () => this.cascadingUIStore.freeSpinsTotal,
                (freeSpinsTotal) => {
                    this.hyperSpinStore.freeSpinsTotal = freeSpinsTotal;
                }
            );

            mobx.reaction(() => this.configStore.gameConfigs?.maxWinPerRound,
                (maxWinPerRound) => {
                    this.hyperSpinStore.maxWinPerRound = maxWinPerRound ?? 0;
                });
            mobx.reaction(() => this.betControlStore.disabledChangeBet,
                (disabledChangeBet) => {
                    this.hyperSpinStore.disabledChangeBet = disabledChangeBet;
                });
            mobx.reaction(() => this.betControlStore.interactableTotalBet,
                (interactableTotalBet) => {
                    this.hyperSpinStore.interactableTotalBet = interactableTotalBet;
                });
            mobx.reaction(() => this.cascadingUIStore.disabledHyperSpin,
                (disabledHyperSpin) => {
                    this.hyperSpinStore.disabledHyperSpin = disabledHyperSpin;
                });

        }, 0);
    }

    async handleFlashSpin(finishData: any) {
        const record = this.createSpinRecord(finishData);
        this.hyperSpinHandler.updateSettlementSingleSpin(record);

        if (record.detailRecords) {
            const length = record.detailRecords.length;
            await AnimationUtils.delayTime((length + 1) * STEP_DURATION);
        }

        this.hyperSpinStore.addSpinToBatch();
        this.cascadingUIStore.isPlacingBet = false;
        this.hyperSpinHandler.checkSpinNextRound();
    }

    onPlaceBet() {
        const info = {
            isFreeSpin: this.cascadingUIStore.isFreeSpins,
            bet: this.betControlStore.totalBet,
            balance: this.cascadingUIStore.userBalance,
        };
        this.hyperSpinStore.initNewSingleSpinData(info);
        this.autoPlayHandler.placeBet();
    }


    private createSpinRecord(finishData: GameServiceMessageCascading.CascadingSlotFinish): SettlementInfo {
        const tumbles = finishData.tumbles;
        const bet = this.hyperSpinStore.singleSpinData.bet;
        const detailRecords = tumbles.map(tumble => {
            const win = tumble.win ?? 0;
            const { multiplier, winLevel } = this.hyperSpinStore.calculateMultiplier(win, bet);
            console.log(`create spin record  ${win} ${multiplier} ${winLevel}`);

            let bonusInfo = {};
            if (finishData.multiplier > 0) {
                const { winLevel: bonusWinLevel } = this.hyperSpinStore.calculateMultiplier(win * finishData.multiplier, bet);
                bonusInfo = {
                    bonusMultiplier: finishData.multiplier,
                    bonusWinLevel,
                };
            }

            return {
                winAmount: win,
                multiplier: multiplier,
                winLevel: winLevel,
                ...bonusInfo,
            };
        });

        return {
            totalWin: finishData.actualBetwin,
            balanceAfter: this.hyperSpinStore.singleSpinData.balanceBefore - this.hyperSpinStore.singleSpinData.bet + finishData.actualBetwin,
            detailRecords: detailRecords.length > 1 ? detailRecords : undefined,//normal at least 1 record
        }
    }


    private extractSettlementData(finishData: any) {
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

    private shouldSkipPlayFreeSpin(isFreeSpinActive: boolean): boolean {
        const stopOnFeature = this.hyperSpinStore.stopOnFeature;
        return !isFreeSpinActive || !stopOnFeature;
    }

    private handleFreeSpinLogic(settlementData: any) {
        const shouldStopForFeature = this.hyperSpinStore.stopOnFeature && settlementData.freeSpins > 0;

        if (shouldStopForFeature) {
            this.hyperSpinHandler.stopHyperSpin();
        }
    }

    changeTotalBet(increase: boolean) {
        this.betControlHandler.changeTotalBet(increase);
    }

    openDialog(name: string) {
        this.cascadingUIHandler.triggerOpenDialog(name);
    }

    setTotalBetFromSlider(sliderProgress: number) {
        const totalBetUnique = this.betControlStore.totalBetUnique;
        if (!totalBetUnique || totalBetUnique.length === 0) {
            return;
        }

        const clampedProgress = Math.max(0, Math.min(1, sliderProgress));
        const betValues = totalBetUnique.map(item => +Object.keys(item)[0]);
        const minBet = Math.min(...betValues);
        const maxBet = Math.max(...betValues);

        const targetBetValue = minBet + (maxBet - minBet) * clampedProgress;

        let closestIndex = 0;
        let minDiff = Math.abs(betValues[0] - targetBetValue);

        for (let i = 1; i < betValues.length; i++) {
            const diff = Math.abs(betValues[i] - targetBetValue);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = i;
            }
        }

        const clampedIndex = Math.max(0, Math.min(totalBetUnique.length - 1, closestIndex));
        if (this.betControlStore.currentTotalBetIndex !== clampedIndex) {
            this.betControlStore.currentTotalBetIndex = clampedIndex;
        }
    }
}
