import { _decorator, EventTouch, Node, tween, UIOpacity, Vec3 } from 'cc';
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
    private readonly MIN_SWIPE_DISTANCE = 250;
    private isAnimating = false;


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
                this.handlePreviousPage();
            } else {
                this.handleNextPage();
            }
        }
    }

    slideAnimation(direction: string, onComplete?: () => void) {
        if (this.body) {
            if (this.isAnimating) {
                return;
            }
            this.isAnimating = true;
            const opacity = this.body.getComponent(UIOpacity) || this.body.addComponent(UIOpacity);
            const pos = this.body.position;
            const moveX = direction === 'right' ? -800 : 800;

            // Fade out current slide
            tween(this.body)
                .parallel(
                    tween(opacity).to(0.2, { opacity: 0 }),
                    tween(this.body).to(0.2, { position: new Vec3(pos.x + moveX, pos.y, pos.z) })
                )
                .call(() => {
                    onComplete?.();
                    this.body.setPosition(new Vec3(pos.x - moveX, pos.y, pos.z));

                    // Fade in new slide
                    tween(this.body)
                        .parallel(
                            tween(opacity).to(0.2, { opacity: 255 }),
                            tween(this.body).to(0.2, { position: pos })
                        )
                        .call(() => this.isAnimating = false)
                        .start();
                })
                .start();
        }

    }

    handleNextPage() {
        const currentPage = this.pagination.currentPage;
        const totalPages = this.pagination.totalPages;
        if (currentPage < totalPages) {
            this.slideAnimation('right', () => {
                this.pagination.hanldeNextPage();
            });
        }
    }

    handlePreviousPage() {
        const currentPage = this.pagination.currentPage;
        if (currentPage > 1) {
            this.slideAnimation('left', () => {
                this.pagination.hanldePreviousPage();
            });
        }
    }

}


