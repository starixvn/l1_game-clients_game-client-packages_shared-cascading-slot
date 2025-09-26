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
    multiplierDetail: Label = null;


    @property(Node)
    btnNext: Node = null;

    @property(Node)
    btnPrevious: Node = null;

    public betHistory: any[] = [];
    public betHistoryDetial: any = null;
    private currentId = 0;
    private pagination: any = null;
    private isNavigatingToNextPage = false;

    private touchStart = 0
    private hasTriggeredSwipe = false;
    private readonly MIN_SWIPE_DISTANCE = 50;



    @render(gc.BetHistory.BetHistoryStore, (store) => store.betHistoryModel, { fireImmediately: true })
    showBetHistory(betHistoryModel: gc.BetHistory.BetHistoryModel) {
        const { betLogs } = betHistoryModel;
        this.betHistory = betLogs;
        this.handleBetHistorySelection();
        if (betLogs.length <= 1) {
            this.btnNext.active = false;
            this.btnPrevious.active = false;
        }
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
            this.timeDetail.string = gc.DateTimeUtils.getStringDateByTime(betHistoryLog.time);
            this.betLevelDetail.string = betHistoryLog.betLevel;
            this.coinValueDetail.string = betHistoryLog.coinValue;
            this.totalBetDetail.string = betHistoryLog.freeSpin ? "0" : gc.FormatUtils.numberWithCommas(betHistoryLog.totalAmount, 2)
            this.currentId = betHistoryLog.id;
            if (this.multiplierNode.active) {
                this.multiplierDetail.string = `(${betHistoryLog.totalTumbleWin}x${betHistoryLog.totalMultiplier})`;
            }
            this.multiplierDetail.node.active = this.multiplierNode.active;
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
                parentContent.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            } else {
                parentContent.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
                parentContent.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            }
        }
    }


    onTouchStart(event: EventTouch) {
        this.touchStart = event.getLocation().x;
        this.hasTriggeredSwipe = false;
    }

    onTouchMove(event: EventTouch) {
        if (this.hasTriggeredSwipe) {
            return;
        }
        const currentX = event.getLocation().x;
        const touchDiff = currentX - this.touchStart;
        const swipeDistance = Math.abs(touchDiff);
        if (swipeDistance > this.MIN_SWIPE_DISTANCE) {
            this.hasTriggeredSwipe = true; // Prevent multiple triggers
            if (touchDiff > 0) {
                this.onClickNextHistoryDetail();
            } else {
                this.onClickPreviousHistoryDetail();
            }
        }
    }







    handleMultiplierData(data: any) {
        super.handleMultiplierData(data);
        this.textMultiplier.string = `${gc.Translator.gameTranslate('total_multiplier')}:`;
        if (data.freeSpin) {
            this.textMultiplier.node.getComponent(Label).color = new Color("FFFC00");
            this.multiplierTotal.node.getComponent(Label).color = new Color("#06F");
        }
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
        const newItem = this.betHistory.find(item => item.id === this.currentId);
        this.betHistoryDetial = {
            betHistoryLog: newItem
        }
        this.clearContent();
        this.setData(this.betHistoryDetial);
    }

}




