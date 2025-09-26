import { _decorator, EventTouch, Node } from 'cc';
import { CascadingBetHistoryTable } from '../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingBetHistoryTable extends CascadingBetHistoryTable {

    @property(Node)
    wrapper: Node = null;
    private pagination: any = null;
    private touchStart = 0
    private hasTriggeredSwipe = false;
    private readonly MIN_SWIPE_DISTANCE = 50;


    private touchEvents(type: string) {
        if (this.wrapper && this.wrapper.isValid) {
            if (type === 'add') {
                this.wrapper.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
                this.wrapper.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            } else {
                this.wrapper.off(Node.EventType.TOUCH_START, this.onTouchStart, this);
                this.wrapper.off(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
            }
        }
    }
    onLoad() {
        super.onLoad();
        this.touchEvents('add');
        if (!this.pagination) {
            this.pagination = this.node?.scene?.getComponentInChildren(Pagination);
        }
    }

    onDestroy() {
        this.touchEvents('remove');
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
                this.handleNextPage();
            } else {
                this.handlePreviousPage();
            }
        }
    }

    handleNextPage() {
        const currentPage = this.pagination.currentPage;
        const totalPages = this.pagination.totalPages;
        if (currentPage < totalPages) {
            this.pagination.hanldeNextPage();
        }
    }

    handlePreviousPage() {
        const currentPage = this.pagination.currentPage;
        if (currentPage > 1) {
            this.pagination.hanldePreviousPage();
        }
    }

}


