import { AnimationUtils } from "db://shared-components/shared/utils";
import inversify from "inversify";
import mobx from "mobx";
import { FlashSpinHandler } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-handler";
import { FlashSpinStore, SettlementInfo } from "../../../shared-common-slot/assets/flash-spin/scripts/handlers/flash-spin-store";
import { BetControlStore } from "../stores/bet-control-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { AutoPlayHandler } from "./auto-play-handlers";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotFlashSpinHandler {
    @inject(FlashSpinStore) protected readonly hyperSpinStore: FlashSpinStore;
    @inject(FlashSpinHandler) protected readonly hyperSpinHandler: FlashSpinHandler;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(BetControlStore) protected readonly betControlStore: BetControlStore;
    @inject(AutoPlayHandler) protected readonly autoPlayHandler: AutoPlayHandler;


    constructor() {
        setTimeout(() => {
            mobx.reaction(
                () => this.hyperSpinStore.triggerPlaceBet,
                (triggerPlaceBet) => {
                    if (triggerPlaceBet) {
                        this.onPlaceBet();
                    }
                }
            );
        }, 0);
    }

    async handleFlashSpin(finishData: any) {
        const record = this.createSpinRecord(finishData);
        this.hyperSpinHandler.updateSettlementSingleSpin(record);

        if (record.detailRecords) {
            const length = record.detailRecords.length;
            await AnimationUtils.delayTime(length * 0.5);
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


    private createSpinRecord(finishData: any): SettlementInfo {
        const tumbles = finishData.tumbles;
        const detailRecords = tumbles.map(tumble => {
            const win = tumble.win ?? 0;
            const { multiplier, winLevel } = this.hyperSpinStore.calculateMultiplier(win, this.hyperSpinStore.singleSpinData.bet);
            console.log(`create spin record  ${win} ${multiplier} ${winLevel}`);
            return {
                winAmount: win,
                multiplier: multiplier,
                winLevel: winLevel,
            };
        });

        return {
            totalWin: finishData.actualBetwin,
            balanceAfter: this.hyperSpinStore.singleSpinData.balanceBefore - this.hyperSpinStore.singleSpinData.bet + finishData.actualBetwin,
            detailRecords: detailRecords.length > 1 ? detailRecords : undefined,//normal at least 1 record
        }
    }

    private async handleSettlement(finishData: any) {
        // if (!finishData) {

        //     if (this.hyperSpinStore.isActiveHyperSpin) {
        //         this.hyperSpinHandler.checkSpinNextRound(true);
        //     }

        //     return;
        // }

        // const settlementData = this.extractSettlementData(finishData);
        // const isFreeSpinActive = settlementData.isFreeSpin || settlementData.totalFreeSpins > 0;
        // const skipPlayFreeSpin = this.shouldSkipPlayFreeSpin(isFreeSpinActive);
        // if (skipPlayFreeSpin && this.hyperSpinStore.isActiveHyperSpin) {
        //     this.hyperSpinHandler.checkSpinNextRound(true);
        //     return;
        // }

        // this.handleFreeSpinLogic(settlementData);

        // if (this.hyperSpinStore.isActiveHyperSpin) {
        //     this.hyperSpinHandler.checkSpinNextRound(false);
        // }
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
}
