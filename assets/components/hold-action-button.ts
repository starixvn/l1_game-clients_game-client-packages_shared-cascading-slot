import { _decorator, EventTouch, game, input, Input, KeyCode, Node } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { AutoPlayHandler } from "../handlers/auto-play-handlers";
import { CascadingHoldActionHandlers } from "../handlers/cascading-hold-action-handlers";
import { AutoPlayStore } from "../stores/auto-play-store";
import { HoldActionStore } from "../stores/hold-action-store";

const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class HoldActionButton extends ObserverComponent {
    private readonly spinButtonSound = "spin_button";

    onBlur = () => {
        this.clearTriggerAction();
    };

    onLoad() {
        this.addEvent();
        this.registerTouchEvents();
        super.onLoad();
    }

    onDestroy() {
        game.canvas.removeEventListener("blur", this.onBlur);
        super.onDestroy();
    }

    addEvent() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    registerTouchEvents() {
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        game.canvas.addEventListener("blur", this.onBlur);
    }

    private handleTouchMove(event: EventTouch) {
        const location = event.getUILocation();
        const transform = ComponentUtils.getTransform(this.node);
        const boundingBox = transform.getBoundingBox();
        const hit = boundingBox.contains(location);
        if (!hit) {
            this.clearTriggerAction();
        }
    }

    onTouchStart() {
        this.callTriggerAction();
    }

    onTouchEnd() {
        this.clearTriggerAction();
    }

    removeEvent() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER || keyCode === KeyCode.NUM_ENTER) {
            this.callTriggerAction();
        }
    }

    onKeyUp(event) {
        const { keyCode } = event;
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER || keyCode === KeyCode.NUM_ENTER) {
            this.clearTriggerAction();
        }
    }

    @handle(CascadingHoldActionHandlers, (handler) => handler.callTriggerAction())
    callTriggerAction() { }

    @handle(CascadingHoldActionHandlers, (handler) => handler.clearTriggerAction())
    clearTriggerAction() { }

    @render(HoldActionStore, (store) => store.triggerAction, { fireImmediately: false })
    handlePressingKey(triggerAction: any) {
        if (triggerAction) {
            this.placeBet();
        }
    }

    @handle(AutoPlayHandler, (handler) => handler.placeBet())
    placeBet() { }

    @render(AutoPlayStore, (store) => store.triggerBet)
    renderTriggerBet(triggerBet: any) {
        if (triggerBet) {
            this.playSound(this.spinButtonSound);
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        return id;
    }
}
