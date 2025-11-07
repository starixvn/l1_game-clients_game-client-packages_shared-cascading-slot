import gc from "@sg/game-client-base";
import { FSBPromotionHandlers } from "db://shared-common-slot/fsb-promotion/scripts/handlers/fsb-promotion-handlers";
import { GameVisibilityStore } from "db://shared-components/shared/common-components/game-visibility/game-visibility-store";
import inversify from "inversify";
import { CascadingSlotBoardStore } from "../stores/cascading-slot-board-store";
import { SlotBetHandler } from "./slot-bet-handler";
const { injectable, inject } = inversify;


@injectable()
export class InterruptionHandlers {
    @inject(gc.Connection.ConnectionStore) protected readonly connectionStore: gc.Connection.ConnectionStore;
    @inject(gc.Notification.NotificationStore) protected readonly notificationStore: gc.Notification.NotificationStore;
    @inject(GameVisibilityStore) protected readonly gameVisibilityStore: GameVisibilityStore;
    @inject(CascadingSlotBoardStore) protected readonly slotBoardStore: CascadingSlotBoardStore;
    @inject(SlotBetHandler) protected readonly slotBetHandler: SlotBetHandler;
    @inject(gc.Auth.AuthHandlers.TriggerRecheckIn) protected readonly triggerRecheckIn: gc.Auth.AuthHandlers.TriggerRecheckIn;

    @inject(FSBPromotionHandlers) protected readonly fsbPromotionHandlers: FSBPromotionHandlers;
    onGameHide() {
        // this.slotBoardStore.gameHidden = true;
        // this.slotBoardStore.hasInterruption = true;
    }

    onGameShow() {
        // this.slotBoardStore.gameHidden = false;
        this.triggerRecheckIn.handle();
        if (!this.connectionStore.isConnected) {
            this.connectionStore.reconnect();
            this.slotBetHandler.handleInterruption();
        }
        if (!this.notificationStore.isConnected) {
            this.fsbPromotionHandlers.removeNotificationListeners();
            this.notificationStore.reconnect();
            this.fsbPromotionHandlers.initNotificationListeners();
        }
    }
}
