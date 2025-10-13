import gc from '@sg/game-client-base';
import { _decorator, Color, Label, Node, tween, Vec3, ScrollView } from 'cc';
import { CascadingTicketDetail } from '../../bet-details/cascading-ticket-detail';
import { CascadingBetHistoryTable } from '../../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
import Observer from 'observer';
import TouchSwipeBase from 'db://shared-components/shared/common-components/touch-swipe-base';
import { AudioUtils } from 'db://shared-components/game/audios/utils';
const { ccclass, property } = _decorator;
const { render } = Observer;
interface PortraitBetHistoryLog extends gc.BetHistory.BetHistoryLog {
    id: number;
}
interface PortraitBetHistoryModel extends gc.BetHistory.BetHistoryModel {
    betLogs: PortraitBetHistoryLog[];
}

@ccclass
export class PortraitCascadingTicketDetail extends CascadingTicketDetail {
    @property(Label)
    timeDetail: Label = null;
    @property(Label)
    coinValueDetail: Label = null;
    @property(Label)
    betLevelDetail: Label = null;
    @property(Label)
    totalBetDetail: Label = null;
    @property(Label)
    multiplierDetail: Label = null;

    @property(ScrollView)
    scrollView: ScrollView = null;

    @property(TouchSwipeBase)
    PortraitTouchSwipeHandler: TouchSwipeBase = null;

    @property(Node)
    btnNext: Node = null;

    @property(Node)
    btnPrevious: Node = null;

    public betHistory: PortraitBetHistoryLog[] = [];
    public betHistoryDetail: { betHistoryLog: gc.BetHistory.BetHistoryLog } = null;
    private currentId = 0;
    private pagination: Pagination = null;
    private isNavigatingToNextPage = false;
    private isAnimating = false;

    onLoad() {
        this.setupTouchHandler();
        super.onLoad();
    }

    private setupTouchHandler() {
        if (this.PortraitTouchSwipeHandler && this.PortraitTouchSwipeHandler.swipeCallback) {
            this.PortraitTouchSwipeHandler.swipeCallback = (isLeft: boolean) => {
                if (isLeft) {
                    this.onClickNextHistoryDetail();
                } else {
                    this.onClickPreviousHistoryDetail();
                }
            }
        }
    }


    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: true })
    showBetHistory(betHistoryModel: PortraitBetHistoryModel) {
        const { betLogs } = betHistoryModel;
        this.betHistory = betLogs;
        this.handleBetHistorySelection();
        this.updateNavigationButtons(betLogs);
    }


    private updateNavigationButtons(betHistoryLog: PortraitBetHistoryLog[]) {
        const currentIndex = this.findCurrentIndex();
        const isAtFirstElement = currentIndex === 0;
        const isAtLastElement = currentIndex === betHistoryLog.length - 1;
        this.btnNext.active = !isAtFirstElement && this.betHistory.length > 1 || this.pagination.currentPage > 1;
        this.btnPrevious.active = !isAtLastElement || this.pagination.currentPage < this.pagination.totalPages;
    }

    private handleBetHistorySelection() {
        if (this.betHistory && this.betHistory.length > 0) {
            const currentItemExists = this.betHistory.find(item => item.id === this.currentId);
            if (!currentItemExists || this.currentId === 0) {
                // Select appropriate item based on navigation direction
                const targetItem = this.isNavigatingToNextPage ? this.betHistory[0] : this.betHistory[this.betHistory.length - 1];
                this.currentId = targetItem.id;
                this.betHistoryDetail = {
                    betHistoryLog: targetItem
                };
                this.clearContent();
                this.setData({
                    betHistoryLog: targetItem
                });
                this.isNavigatingToNextPage = false;
            }
        }
    }

    setData(data: any) {
        if (!data) {
            return;
        }
        super.setData(data);
        const { betHistoryLog } = data;
        console.log(betHistoryLog)
        if (!this.pagination) {
            this.pagination = this.node?.scene?.getComponentInChildren(Pagination);
        }
        if (betHistoryLog) {
            this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            this.betLevelDetail.string = betHistoryLog.betLevel;
            this.coinValueDetail.string = betHistoryLog.coinValue;
            this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2)
            this.currentId = betHistoryLog.id;
            if (this.multiplierNode.active) {
                const winFreeSpin = gc.FormatUtils.numberWithCommas(betHistoryLog.settlementResult.freeSpins?.win, 2, false);
                if (betHistoryLog.freeSpin) {
                    if (betHistoryLog.settlementResult.freeSpins?.win > 0) {
                        this.multiplierDetail.string = `(${gc.FormatUtils.numberWithCommas(betHistoryLog.totalTumbleWin, 2, false)}x${betHistoryLog.totalMultiplier})`;
                    } else {
                        this.multiplierDetail.string = `(${gc.FormatUtils.numberWithCommas(betHistoryLog.totalTumbleWin, 2, false)}x${betHistoryLog.totalMultiplier})`;
                    }
                } else {
                    if (betHistoryLog.settlementResult.freeSpins?.win > 0) {
                        this.multiplierDetail.string = `((${gc.FormatUtils.numberWithCommas(betHistoryLog.totalTumbleWin, 2, false)}x${betHistoryLog.multiplier}) + ${winFreeSpin})`;
                    } else {
                        this.multiplierDetail.string = `(${gc.FormatUtils.numberWithCommas(betHistoryLog.totalTumbleWin, 2, false)}x${betHistoryLog.multiplier})`;
                    }
                }
            }
            this.multiplierDetail.node.active = this.multiplierNode.active;
        }
        this.updateNavigationButtons(this.betHistory);
    }
    handleMultiplierData(data: any) {
        super.handleMultiplierData(data);
        this.textMultiplier.string = `${gc.Translator.gameTranslate('cascadingslot.header_total_multiplier')}:`;
        if (data.freeSpin) {
            this.textMultiplier.node.getComponent(Label).color = new Color("EDBB02");
            this.multiplierTotal.node.getComponent(Label).color = new Color("#06F");
            this.multiplierTotal.string = `x${data.totalMultiplier}`;
        } else {
            this.multiplierTotal.string = `x${data.multiplier}`;
        }
    }

    onClickCloseDetail() {
        const betHistoryTable = this.node.scene.getComponentInChildren(CascadingBetHistoryTable);
        if (betHistoryTable) {
            betHistoryTable.onClickClose();
        }
        this.onClickClose();
    }


    onClickBackToHistory() {
        this.onClickClose();
    }

    findCurrentIndex() {
        return this.betHistory.findIndex((item) => item.id === this.currentId)
    }

    onClickPreviousHistoryDetail() {
        const index = this.findCurrentIndex();
        this.resetScrollPosition();
        if (this.betHistory && index >= 0 && index < this.betHistory.length - 1) {
            this.slideAnimation(false, () => {
                this.currentId = this.betHistory[index + 1].id;
                this.updateHistoryDetail();
            });
        } else if (this.betHistory && index === this.betHistory.length - 1) {
            if (this.pagination) {
                const currentPage = this.pagination.currentPage;
                const totalPages = this.pagination.totalPages;
                if (currentPage < totalPages) {
                    this.slideAnimation(false, () => {
                        this.isNavigatingToNextPage = true; // Going to next page, select first item
                        this.pagination.hanldeNextPage();
                    });
                }
            }
        }
    }
    onClickNextHistoryDetail() {
        const index = this.findCurrentIndex();
        this.resetScrollPosition();
        if (index > 0 && this.betHistory[index - 1]) {
            this.slideAnimation(true, () => {
                this.currentId = this.betHistory[index - 1].id;
                this.updateHistoryDetail();
            });
        } else if (index === 0) {
            if (this.pagination) {
                const currentPage = this.pagination.currentPage;
                if (currentPage > 1) {
                    this.slideAnimation(true, () => {
                        this.isNavigatingToNextPage = false; // Going to previous page, select last item
                        this.pagination.hanldePreviousPage();
                    });
                }
            }
        }
    }
    slideAnimation(isRight: boolean, onComplete?: () => void) {
        if (!this.content || this.isAnimating) {
            return;
        }

        this.isAnimating = true;
        const pos = this.content.position;
        const moveX = isRight ? -800 : 800;

        tween(this.content)
            .to(0.2, { position: new Vec3(pos.x + moveX, pos.y, pos.z) })
            .call(() => {
                onComplete?.();
                this.content.setPosition(new Vec3(pos.x - moveX, pos.y, pos.z));
                tween(this.content)
                    .to(0.2, { position: pos })
                    .call(() => this.isAnimating = false)
                    .start();
            })
            .start();
    }
    private resetScrollPosition() {
        if (this.scrollView) {
            this.scrollView.scrollToTop(0);
        }
    }

    private resetMultiplierNode() {
        if (!this.multiplierNode) {
            return;
        }

        if (!this.multiplierTotal || !this.textMultiplier) {
            return
        }

        const defaultColor = Color.WHITE;
        this.multiplierNode.active = false;
        this.multiplierTotal.node.getComponent(Label).color = defaultColor;
        this.textMultiplier.node.getComponent(Label).color = defaultColor;
    }

    private clearContent() {
        this.content?.removeAllChildren();
        this.resetMultiplierNode();
    }




    updateHistoryDetail() {
        AudioUtils.playClick();
        const newItem = this.betHistory ? this.betHistory.find(item => item.id === this.currentId) : null;
        this.betHistoryDetail = {
            betHistoryLog: newItem
        }
        this.clearContent();
        this.setData(this.betHistoryDetail);
    }

}




