import { _decorator, Node, tween, UIOpacity, Vec3 } from 'cc';
import { CascadingBetHistoryTable } from '../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
import TouchSwipeBase from 'db://shared-components/shared/common-components/touch-swipe-base';
const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingBetHistoryTable extends CascadingBetHistoryTable {

    @property(Node)
    wrapper: Node = null;

    private pagination: Pagination = null;
    private isAnimating = false;

    @property(TouchSwipeBase)
    touchSwipeHandler: TouchSwipeBase = null;


    private setupTouchHandler() {
        if (this.touchSwipeHandler && this.touchSwipeHandler.swipeCallback) {
            this.touchSwipeHandler.swipeCallback = (isLeft: boolean) => {
                if (isLeft) {
                    this.handleNextPage();
                } else {
                    this.handlePreviousPage();
                }
            }
        }
    }

    onLoad() {
        this.setupTouchHandler();
        super.onLoad();
        if (!this.pagination) {
            this.pagination = this.node?.scene?.getComponentInChildren(Pagination);
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


