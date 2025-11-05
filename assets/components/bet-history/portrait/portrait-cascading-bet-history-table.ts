import { _decorator, Node, tween, UIOpacity, Vec3 } from 'cc';
import { CascadingBetHistoryTable } from '../cascading-bet-history-table';
import Pagination from 'db://shared-components/game/pagination/scripts/components/pagination';
import TouchSwipeBase from 'db://shared-components/shared/common-components/touch-swipe-base';
import { cascadingSlotLogger } from "../../../cascading-slot-logger";

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
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: setupTouchHandler called");
        if (this.touchSwipeHandler && this.touchSwipeHandler.swipeCallback) {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: setting up swipe callback");
            this.touchSwipeHandler.swipeCallback = (isLeft: boolean) => {
                cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: swipe detected", isLeft ? "left" : "right");
                if (isLeft) {
                    this.handleNextPage();
                } else {
                    this.handlePreviousPage();
                }
            }
        } else {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: touchSwipeHandler not available");
        }
    }

    onLoad() {
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: onLoad called");
        this.setupTouchHandler();
        super.onLoad();
        if (!this.pagination) {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: initializing pagination");
            this.pagination = this.node?.scene?.getComponentInChildren(Pagination);
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: pagination initialized", this.pagination);
        }
    }


    slideAnimation(isRight: boolean, onComplete?: () => void) {
        if (this.body) {
            if (this.isAnimating) {
                return;
            }
            this.isAnimating = true;
            const opacity = this.body.getComponent(UIOpacity) || this.body.addComponent(UIOpacity);
            const pos = this.body.position;
            const moveX = isRight ? -800 : 800;

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
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: handleNextPage called");
        const currentPage = this.pagination.currentPage;
        const totalPages = this.pagination.totalPages;
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: currentPage", currentPage, "totalPages", totalPages);
        if (currentPage < totalPages) {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: navigating to next page");
            this.slideAnimation(true, () => {
                this.pagination.hanldeNextPage();
            });
        } else {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: already at last page");
        }
    }

    handlePreviousPage() {
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: handlePreviousPage called");
        const currentPage = this.pagination.currentPage;
        cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: currentPage", currentPage);
        if (currentPage > 1) {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: navigating to previous page");
            this.slideAnimation(false, () => {
                this.pagination.hanldePreviousPage();
            });
        } else {
            cascadingSlotLogger.info("PortraitCascadingBetHistoryTable: already at first page");
        }
    }

}





