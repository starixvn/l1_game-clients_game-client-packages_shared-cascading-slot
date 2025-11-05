import { _decorator, Node, tween, UITransform, v3 } from "cc";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import Observer from "observer";
import { CascadingUIStore } from "../../stores/cascading-ui-store";
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass, property } = _decorator;
const { observer, render, handle } = Observer;

@ccclass
export class PortraitCascadingMessagesContainer extends ObserverComponent {
    @property(Node)
    nodeLeft: Node = null;

    // Layout constants
    private readonly TOTAL_MULTIPLIER_WIDTH = 200;
    private readonly GAME_WIDTH = 786;
    private readonly PADDING = 86;
    private readonly MOVE_OFFSET = 100;
    private readonly ANIMATION_DURATION = 0.5;
    private readonly ANIMATION_EASING = "sineOut";

    @render(CascadingUIStore, (store) => store.portraitshowTotalMultiplierView)
    moveTumbleWinView(shouldMove: boolean) {
        cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] moveTumbleWinView called with shouldMove: ${shouldMove}`);
        if (!this.nodeLeft) {
            cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] No nodeLeft found, returning early`);
            return;
        }

        if (shouldMove) {
            cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Moving to left position`);
            this.moveToLeftPosition();
        } else {
            cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Resetting to original position`);
            this.resetToOriginalPosition();
        }
    }

    private moveToLeftPosition(): void {
        const currentX = this.nodeLeft.position.x;
        const targetX = currentX - this.MOVE_OFFSET;
        cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Moving from x:${currentX} to x:${targetX}`);

        this.updateChildWidths(this.getCollapsedWidth());

        tween(this.nodeLeft)
            .to(this.ANIMATION_DURATION, { position: v3(targetX, 0, 0) }, { easing: this.ANIMATION_EASING })
            .start();
    }

    private resetToOriginalPosition(): void {
        cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Resetting to original position (0,0,0)`);
        this.nodeLeft.position = v3(0, 0, 0);
        this.updateChildWidths(this.getExpandedWidth());
    }

    private updateChildWidths(width: number): void {
        cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] updateChildWidths called with width: ${width}`);
        const children = this.nodeLeft.children;
        cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Updating ${children.length} child widths`);

        for (const child of children) {
            const uiTransform = child.getComponent(UITransform);
            if (uiTransform) {
                uiTransform.width = width;
                cascadingSlotLogger.info(`[PortraitCascadingMessagesContainer] Set child width to: ${width}`);
            }
        }
    }

    private getCollapsedWidth(): number {
        return this.GAME_WIDTH - this.TOTAL_MULTIPLIER_WIDTH - this.PADDING;
    }

    private getExpandedWidth(): number {
        return this.GAME_WIDTH - this.PADDING;
    }
}



