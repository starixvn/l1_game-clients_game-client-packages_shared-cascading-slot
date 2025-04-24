import { _decorator, EventTouch, input, Input, KeyCode, Node } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { CascadingHoldActionHandlers } from "../handlers/cascading-hold-action-handlers";
import { CascadingUIHandler } from "../handlers/cascading-ui-handler";
import { SlotBetHandler } from "../handlers/slot-bet-handler";
import { AutoPlayStore } from "../stores/auto-play-store";
import { HoldActionStore } from "../stores/hold-action-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class HoldActionButton extends ObserverComponent {
    private spinButtonSound = "spin_button";
    private quickPressSpinTriggered = false;

    onLoad() {
        this.addEvent();
        this.registerTouchEvents();
        super.onLoad();
    }

    addEvent() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);

        // // Add click event to ensure focus is set when user clicks anywhere on canvas
        // if (game.canvas) {
        //     game.canvas.addEventListener("click", () => {
        //         game.canvas.focus();
        //     });
        // }
    }

    registerTouchEvents() {
        this.node.on(Node.EventType.TOUCH_START, this.startHoldButton, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.stopHoldButton, this);
        this.node.on(Node.EventType.TOUCH_END, this.handleTouchEnd, this);
    }

    removeEvent() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER) {
            this.handleHoldAction();
            this.updatePressingDownKeyTime(Date.now());
        }
    }

    onKeyUp(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER) {
            this.handleDropAction();
            this.updatePressingUpKeyTime(Date.now());
        }
    }

    private startHoldButton() {
        this.handleHoldAction();
        this.updatePressingDownKeyTime(Date.now());
    }

    private stopHoldButton() {
        this.handleDropAction();
        this.updatePressingUpKeyTime(Date.now());
    }

    @handle(CascadingHoldActionHandlers, (handler, pressingDownKeyTime: number) => handler.updatePressingDownKeyTime(pressingDownKeyTime))
    updatePressingDownKeyTime(pressingDownKeyTime: number) {
        return pressingDownKeyTime;
    }

    @handle(CascadingHoldActionHandlers, (handler, pressingUpKeyTime: number) => handler.updatePressingUpKeyTime(pressingUpKeyTime))
    updatePressingUpKeyTime(pressingUpKeyTime: number) {
        return pressingUpKeyTime;
    }

    @handle(CascadingHoldActionHandlers, (handler) => handler.handleHoldAction())
    handleHoldAction() {}

    @handle(CascadingHoldActionHandlers, (handler) => handler.handleDropAction())
    handleDropAction() {}

    private handleTouchMove(event: EventTouch) {
        const location = event.getLocation();
        const transform = ComponentUtils.getTransform(this.node);
        const hit = transform ? transform.hitTest(location) : false;
        if (!hit) {
            this.stopHoldButton();
            event.propagationStopped = true;
        }
    }

    private handleTouchEnd(event: EventTouch) {
        const location = event.getLocation();
        const transform = ComponentUtils.getTransform(this.node);
        const hit = transform ? transform.hitTest(location) : false;
        this.stopHoldButton();
        if (hit) {
            this.quickPressSpinTriggered = true;
            this.spin();
            // Reset flag after a short delay to allow for next interactions
            setTimeout(() => {
                this.quickPressSpinTriggered = false;
            }, 1500);
        }
    }

    @render(HoldActionStore, (store) => store.isAutoSpinHolding, { fireImmediately: false })
    handlePressingKey(isAutoSpinHolding: boolean) {
        setTimeout(() => {
            if (isAutoSpinHolding && !this.quickPressSpinTriggered) {
                this.spin();
            }
        }, 1000);
    }

    spin() {
        this.playSound(this.spinButtonSound);
        this.handleNewRound();
        this.sendBet();
        this.handleSymbolPreviewVisiblity(false);
    }

    @render(AutoPlayStore, (store) => store.triggerBet)
    renderTriggerBet(triggerBet: boolean) {
        if (triggerBet) {
            this.spin();
        }
    }

    @handle(SlotBetHandler, (handler) => handler.handle())
    sendBet() {}

    @handle(CascadingUIHandler, (handler) => handler.handleNewRound())
    handleNewRound() {}

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }

    @handle(CascadingUIHandler, (handler, isVisible: boolean) => handler.handleSymbolPreviewVisiblity(isVisible))
    handleSymbolPreviewVisiblity(isVisible: boolean) {
        return isVisible;
    }
}
