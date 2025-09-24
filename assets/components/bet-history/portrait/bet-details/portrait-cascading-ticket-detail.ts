import gc from '@sg/game-client-base';
import { _decorator, Color, EventTouch, Label, Node } from 'cc';
import { CascadingTicketDetail } from '../../bet-details/cascading-ticket-detail';
import { CascadingBetHistoryTable } from '../../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
import Observer from 'observer';
const { ccclass, property } = _decorator;
const { render } = Observer;

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
    roundId: Label = null;

    public betHistory: any[] = [];
    public betHistoryDetial: any = null;
    private currentId = 0;
    private pagination: any = null;
    private isNavigatingToNextPage = false;

    private touchStart = 0;
    private readonly MIN_SWIPE_DISTANCE = 5;

    private page = 0;
    private totalItems = 0;



    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: true })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        const { page, total, betLogs } = betHistoryModel;
        this.betHistory = betLogs;
        this.page = page;
        this.totalItems = total;
        this.handleBetHistorySelection();
    }

    private handleBetHistorySelection() {
        if (this.betHistory.length > 0) {
            const currentItemExists = this.betHistory.find(item => item.id === this.currentId);
            if (!currentItemExists || this.currentId === 0) {
                // Select appropriate item based on navigation direction
                const targetItem = this.isNavigatingToNextPage ? this.betHistory[0] : this.betHistory[this.betHistory.length - 1];
                this.currentId = targetItem.id;
                this.betHistoryDetial = {
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
        if (!this.pagination) {
            this.pagination = this.node?.scene?.getComponentInChildren(Pagination);
        }
        if (betHistoryLog) {
            if (this.timeDetail) this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            if (this.betLevelDetail) this.betLevelDetail.string = betHistoryLog.betLevel;
            if (this.coinValueDetail) this.coinValueDetail.string = betHistoryLog.coinValue;
            if (this.totalBetDetail) this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2);
            this.currentId = betHistoryLog.id;
        }
        this.touchEvents('add');
    }

    onDestroy() {
        super.onDestroy();
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
            if (this.page > 0) {
                this.isNavigatingToNextPage = false;
                this.pagination.hanldePreviousPage();
                this.handleBetHistorySelection();
            } else {
                console.log('Already at first page');
            }
        }
    }
    onClickNextHistoryDetail() {
        const index = this.findCurrentIndex();
        if (index >= 0 && index < this.betHistory.length - 1) {
            this.currentId = (this.betHistory[index + 1]).id;
            this.updateHistoryDetail();
        } else if (index === this.betHistory.length - 1) {
            const totalPages = Math.ceil(this.totalItems / this.betHistory.length);
            if (this.page < totalPages - 1) {
                this.isNavigatingToNextPage = true;
                this.pagination.hanldeNextPage();
                this.handleBetHistorySelection();
            } else {
                console.log('Already at last page');
            }
        }
    }


    private resetMultiplierNode() {
        if (!this.multiplierNode) {
            return;
        }

        this.multiplierNode.active = false;
        if (!this.multiplierTotal || !this.textMultiplier) {
            return
        }

        const defaultColor = Color.WHITE;
        this.multiplierTotal.node.getComponent(Label).color = defaultColor;
        this.textMultiplier.node.getComponent(Label).color = defaultColor;
    }

    private clearContent() {
        this.content?.removeAllChildren();
        this.resetMultiplierNode();
    }


    updateHistoryDetail() {
        const newItem = this.betHistory.find(item => item.id === this.currentId);
        this.betHistoryDetial = {
            betHistoryLog: newItem
        }
        this.clearContent();
        this.setData(this.betHistoryDetial);
    }

}



