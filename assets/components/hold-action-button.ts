import { _decorator, EventTouch, game, input, Input, KeyCode, Node } from "cc";
import Observer from "observer";

import gc from "@sg/game-client-base";
import { AudioIds } from "db://assets/game/audios/AudioIds";
import { FSBPromotionUIHandler } from "db://shared-common-slot/fsb-promotion/scripts/handlers/fsb-promotion-ui-handler";
import { ObserverComponent } from "db://shared-components/shared/common-components/observer-component/scripts/observer-component";
import { ComponentUtils } from "db://shared-components/shared/utils/component-utils";
import { AutoPlayHandler } from "../handlers/auto-play-handlers";
import { CascadingHoldActionHandlers } from "../handlers/cascading-hold-action-handlers";
import { AutoPlayStore } from "../stores/auto-play-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { cascadingSlotLogger } from "../cascading-slot-logger";


const { ccclass, property } = _decorator;
const { render, handle } = Observer;
@ccclass
export class HoldActionButton extends ObserverComponent {
    onBlur = () => {
        cascadingSlotLogger.info(`[HoldActionButton] onBlur called - clearing trigger action`);
        this.clearTriggerAction();
    };

    onLoad() {
        cascadingSlotLogger.info(`[HoldActionButton] Component loaded, adding events and registering touch events`);
        this.addEvent();
        this.registerTouchEvents();
        super.onLoad();
    }

    onDestroy() {
        cascadingSlotLogger.info(`[HoldActionButton] Component being destroyed, removing blur event listener`);
        game.canvas.removeEventListener("blur", this.onBlur);
        super.onDestroy();
    }

    addEvent() {
        cascadingSlotLogger.info(`[HoldActionButton] Adding keyboard event listeners`);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    registerTouchEvents() {
        cascadingSlotLogger.info(`[HoldActionButton] Registering touch events`);
        this.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(Node.EventType.TOUCH_MOVE, this.handleTouchMove, this);
        this.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        this.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);

        game.canvas.addEventListener("blur", this.onBlur);
    }

    private handleTouchMove(event: EventTouch) {
        const location = event.getLocation();
        const transform = ComponentUtils.getTransform(this.node);
        const hit = transform.hitTest(location, event.windowId);
        cascadingSlotLogger.info(`[HoldActionButton] handleTouchMove - location: ${location}, hit: ${hit}`);
        if (!hit) {
            cascadingSlotLogger.info(`[HoldActionButton] Touch moved outside button, clearing trigger action`);
            this.clearTriggerAction();
        }
    }

    onTouchStart() {
        cascadingSlotLogger.info(`[HoldActionButton] onTouchStart called`);
        this.callTriggerAction();
    }

    onTouchEnd() {
        cascadingSlotLogger.info(`[HoldActionButton] onTouchEnd called`);
        this.clearTriggerAction();
    }

    removeEvent() {
        cascadingSlotLogger.info(`[HoldActionButton] removeEvent called - removing keyboard event listeners`);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onKeyDown(event) {
        const { keyCode } = event;
        cascadingSlotLogger.info(`[HoldActionButton] onKeyDown called with keyCode: ${keyCode}`);
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER || keyCode === KeyCode.NUM_ENTER) {
            cascadingSlotLogger.info(`[HoldActionButton] Trigger key pressed, calling trigger action`);
            this.callTriggerAction();
        }
    }

    onKeyUp(event) {
        const { keyCode } = event;
        cascadingSlotLogger.info(`[HoldActionButton] onKeyUp called with keyCode: ${keyCode}`);
        if (keyCode === KeyCode.SPACE || keyCode === KeyCode.ENTER || keyCode === KeyCode.NUM_ENTER) {
            cascadingSlotLogger.info(`[HoldActionButton] Trigger key released, clearing trigger action`);
            this.clearTriggerAction();
        }
    }

    @handle(CascadingHoldActionHandlers, (handler) => handler.callTriggerAction())
    callTriggerAction() {
        cascadingSlotLogger.info(`[HoldActionButton] callTriggerAction called`);
    }

    @handle(CascadingHoldActionHandlers, (handler) => handler.clearTriggerAction())
    clearTriggerAction() {
        cascadingSlotLogger.info(`[HoldActionButton] clearTriggerAction called`);
    }

    @render(HoldActionStore, (store) => store.triggerAction, { fireImmediately: false })
    handlePressingKey(triggerAction: any) {
        cascadingSlotLogger.info(`[HoldActionButton] handlePressingKey called with triggerAction: ${triggerAction}`);
        if (triggerAction) {
            cascadingSlotLogger.info(`[HoldActionButton] Trigger action active, triggering FSB manual and placing bet`);
            this.triggerFSBManual();
            this.placeBet();
        }
    }

    @handle(FSBPromotionUIHandler, (handler) => handler.triggerFSBManual())
    triggerFSBManual() {
        cascadingSlotLogger.info(`[HoldActionButton] triggerFSBManual called`);
    }

    @handle(AutoPlayHandler, (handler) => handler.placeBet())
    placeBet() {
        cascadingSlotLogger.info(`[HoldActionButton] placeBet called`);
    }

    @render(AutoPlayStore, (store) => store.triggerBet)
    renderTriggerBet(triggerBet: any) {
        cascadingSlotLogger.info(`[HoldActionButton] renderTriggerBet called with triggerBet: ${triggerBet}`);
        if (triggerBet) {
            cascadingSlotLogger.info(`[HoldActionButton] Playing spin button sound`);
            this.playSound(AudioIds.SPIN_BUTTON);
        }
    }

    @handle(gc.Audios.AudioHandler, (handle, id: string) => handle.playSFX(id))
    playSound(id: string) {
        cascadingSlotLogger.info(`[HoldActionButton] playSound called with id: ${id}`);
        return id;
    }
}



