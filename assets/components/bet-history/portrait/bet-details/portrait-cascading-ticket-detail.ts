import gc from '@sg/game-client-base';
import { _decorator, EventTouch, Label, Node } from 'cc';
import { CascadingTicketDetail } from '../../bet-details/cascading-ticket-detail';
import { CascadingBetHistoryTable } from '../../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
import Observer from 'observer';
const { ccclass, property } = _decorator;
const { render, handle } = Observer;

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

    public betHistory: any[] = [];
    public betHistoryDetial: any = null;
    private currentId = 0;
    private pagination: any = null;
    private isNavigatingToNextPage = false;

    private touchStart = 0;
    private readonly MIN_SWIPE_DISTANCE = 5;




    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: true })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        this.betHistory = betHistoryModel.betLogs;
        if (this.betHistory.length > 0) {
            const currentItemExists = this.betHistory.find(item => item.id === this.currentId);
            if (!currentItemExists || this.currentId === 0) {
                // Select appropriate item based on navigation direction
                const targetItem = this.isNavigatingToNextPage ? this.betHistory[0] : this.betHistory[this.betHistory.length - 1];
                this.currentId = targetItem.id;
                this.betHistoryDetial = {
                    betHistoryLog: targetItem
                };
                this.content.removeAllChildren();
                this.multiplierNode.active = false;
                this.setData(this.betHistoryDetial);
                this.isNavigatingToNextPage = false; // Reset flag
            }
        }
    }

    setData(data: any) {
        super.setData(data);
        const { betHistoryLog } = data;
        if (!this.pagination) {
            this.pagination = this.node.scene.getComponentInChildren(Pagination);
        }
        if (betHistoryLog) {
            this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            this.betLevelDetail.string = betHistoryLog.betLevel;
            this.coinValueDetail.string = betHistoryLog.coinValue;
            this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2);
            this.currentId = betHistoryLog.id;
        }
        this.touchEvents('add');
    }

    onDestroy() {
        this.touchEvents('remove');
    }

    private touchEvents(type: string) {
        const parentContent = this.content?.getParent();
        if (parentContent) {
            if (type === 'add') {
                parentContent.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
                parentContent.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
                parentContent.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            } else {
                parentContent.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
                parentContent.off(Node.EventType.TOUCH_END, this.onTouchEnd, this);
                parentContent.off(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
            }
        }
    }


    onTouchStart(event: EventTouch) {
        this.touchStart = event.getLocationX();
    }

    onTouchEnd(event: EventTouch) {
        const touchEnd = event.getLocationX();
        const touchDiff = touchEnd - this.touchStart;
        const swipeDistance = Math.abs(touchDiff);

        if (swipeDistance < this.MIN_SWIPE_DISTANCE) {
            return;
        }
        if (touchDiff > 0) {
            this.onClickNextHistoryDetail();
        } else {
            this.onClickPreviousHistoryDetail();
        }
    }



    handleMultiplierData(data: any) {
        super.handleMultiplierData(data);
        this.textMultiplier.string = `${gc.Translator.gameTranslate('total_multiplier')}:`;
    }

    onClickClose() {
        const betHistoryTable = this.node.scene.getComponentInChildren(CascadingBetHistoryTable);
        if (betHistoryTable) {
            betHistoryTable.onClickClose();
            super.onClickClose();
        }
    }


    onClickBackToHistory() {
        super.onClickClose();
    }

    findCurrentIndex() {
        return this.betHistory.findIndex((item) => item.id === this.currentId);
    }

    onClickPreviousHistoryDetail() {
        const index = this.findCurrentIndex();
        if (index > 0) {
            this.currentId = (this.betHistory[index - 1]).id;
            this.updateHistoryDetail();
        } else if (index === 0) {
            if (this.pagination) {
                const currentPage = this.pagination.currentPage;
                if (currentPage > 1) {
                    this.isNavigatingToNextPage = false; // Going to previous page, select last item
                    this.pagination.hanldePreviousPage();
                } else {
                    console.log('first page');
                }
            }
        }
    }
    onClickNextHistoryDetail() {
        const index = this.findCurrentIndex();
        if (index >= 0 && index < this.betHistory.length - 1) {
            this.currentId = (this.betHistory[index + 1]).id;
            this.updateHistoryDetail();
        } else if (index === this.betHistory.length - 1) {
            if (this.pagination) {
                const currentPage = this.pagination.currentPage;
                const totalPages = this.pagination.totalPages;
                if (currentPage < totalPages) {
                    this.isNavigatingToNextPage = true; // Going to next page, select first item
                    this.pagination.hanldeNextPage();
                } else {
                    console.log('last page');
                }
            }
        }
    }

    updateHistoryDetail() {
        const newItem = this.betHistory.find(item => item.id === this.currentId);
        this.betHistoryDetial = {
            betHistoryLog: newItem
        }
        this.content.removeAllChildren();
        this.multiplierNode.active = false;
        this.setData(this.betHistoryDetial);
    }

}



