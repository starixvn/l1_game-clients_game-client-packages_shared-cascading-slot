import gc from "@sg/game-client-base";
import inversify from "inversify";

import { cascadingSlotLogger } from "../cascading-slot-logger";
import { CascadingSlotState } from "../cascading-slot-state";
import { AutoPlayStore } from "../stores/auto-play-store";
import { CascadingUIStore } from "../stores/cascading-ui-store";
import { HoldActionStore } from "../stores/hold-action-store";
import { CascadingUIHandler } from "./cascading-ui-handler";

const { injectable, inject } = inversify;

@injectable()
export class CascadingHoldActionHandlers implements gc.Shared.IHandler<number> {
    @inject(HoldActionStore) protected readonly holdActionStore: HoldActionStore;
    @inject(CascadingUIStore) protected readonly cascadingUIStore: CascadingUIStore;
    @inject(CascadingUIHandler) protected readonly cascadingUIHandler: CascadingUIHandler;
    @inject(AutoPlayStore) protected readonly autoPlayStore: AutoPlayStore;
    private timeoutHolding: NodeJS.Timeout;
    private readonly HOLDING_THRESHOLD = 1000;

    constructor() {
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] constructor called", {
            hasHoldActionStore: !!this.holdActionStore,
            hasCascadingUIStore: !!this.cascadingUIStore,
            hasCascadingUIHandler: !!this.cascadingUIHandler,
            hasAutoPlayStore: !!this.autoPlayStore,
            holdingThreshold: this.HOLDING_THRESHOLD,
            timestamp: new Date().toISOString()
        });
    }

    handle() {
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] handle called", {
            timestamp: new Date().toISOString()
        });
    }

    callTriggerAction() {
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] callTriggerAction called", {
            holdActionEnabled: this.holdActionStore.enabled,
            hasTriggerAction: !!this.holdActionStore.triggerAction,
            isAutoplay: this.autoPlayStore.isAutoplay,
            cascadingState: this.cascadingUIStore.cascadingState,
            disabledSpinButton: this.cascadingUIStore.disabledSpinButton,
            isTrialMode: this.cascadingUIStore.isTrialMode,
            willCheckConditions: true,
            timestamp: new Date().toISOString()
        });

        if (!this.holdActionStore.enabled) {
            cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Hold action not enabled, returning", {
                enabled: false,
                timestamp: new Date().toISOString()
            });
            return;
        }

        if (!this.holdActionStore.triggerAction && !this.autoPlayStore.isAutoplay) {
            cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Checking bet conditions", {
                noTriggerAction: !this.holdActionStore.triggerAction,
                notAutoplay: !this.autoPlayStore.isAutoplay,
                timestamp: new Date().toISOString()
            });

            const canBet =
                this.cascadingUIStore.cascadingState === CascadingSlotState.READY_BET ||
                this.cascadingUIStore.cascadingState === CascadingSlotState.SETTLED;

            cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Bet condition evaluation", {
                cascadingState: this.cascadingUIStore.cascadingState,
                isReadyBet: this.cascadingUIStore.cascadingState === CascadingSlotState.READY_BET,
                isSettled: this.cascadingUIStore.cascadingState === CascadingSlotState.SETTLED,
                canBet,
                disabledSpinButton: this.cascadingUIStore.disabledSpinButton,
                spinButtonEnabled: !this.cascadingUIStore.disabledSpinButton,
                willTriggerAction: canBet && !this.cascadingUIStore.disabledSpinButton,
                timestamp: new Date().toISOString()
            });

            if (canBet && !this.cascadingUIStore.disabledSpinButton) {
                cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Setting trigger action", {
                    willSetTriggerAction: true,
                    isTrialMode: this.cascadingUIStore.isTrialMode,
                    willSetTimeout: !this.cascadingUIStore.isTrialMode,
                    timeoutMs: this.HOLDING_THRESHOLD,
                    timestamp: new Date().toISOString()
                });

                this.holdActionStore.triggerAction = {};

                if (!this.cascadingUIStore.isTrialMode) {
                    this.timeoutHolding = setTimeout(() => {
                        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Timeout triggered - setting isHolding to true", {
                            timeoutTriggered: true,
                            timestamp: new Date().toISOString()
                        });
                        this.holdActionStore.isHolding = true;
                    }, this.HOLDING_THRESHOLD);

                    cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Hold timeout set", {
                        timeoutSet: true,
                        timeoutId: !!this.timeoutHolding,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Trial mode - no timeout set", {
                        isTrialMode: true,
                        timestamp: new Date().toISOString()
                    });
                }
            } else {
                cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Bet conditions not met, not setting trigger action", {
                    canBet,
                    spinButtonEnabled: !this.cascadingUIStore.disabledSpinButton,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Trigger action already exists or in autoplay mode", {
                hasTriggerAction: !!this.holdActionStore.triggerAction,
                isAutoplay: this.autoPlayStore.isAutoplay,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] callTriggerAction completed", {
            finalTriggerAction: !!this.holdActionStore.triggerAction,
            finalIsHolding: this.holdActionStore.isHolding,
            hasTimeout: !!this.timeoutHolding,
            timestamp: new Date().toISOString()
        });
    }

    clearTriggerAction() {
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] clearTriggerAction called", {
            currentTriggerAction: this.holdActionStore.triggerAction,
            currentIsHolding: this.holdActionStore.isHolding,
            hasTimeout: !!this.timeoutHolding,
            willClearTriggerAction: true,
            willClearIsHolding: true,
            willClearTimeout: !!this.timeoutHolding,
            timestamp: new Date().toISOString()
        });

        this.holdActionStore.triggerAction = null;
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Trigger action cleared", {
            triggerActionCleared: true,
            timestamp: new Date().toISOString()
        });

        this.holdActionStore.isHolding = false;
        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Is holding cleared", {
            isHoldingCleared: true,
            timestamp: new Date().toISOString()
        });

        if (this.timeoutHolding) {
            clearTimeout(this.timeoutHolding);
            cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] Timeout cleared", {
                timeoutCleared: true,
                timestamp: new Date().toISOString()
            });
        }

        cascadingSlotLogger.info("[CASCADING_HOLD_ACTION_HANDLERS] clearTriggerAction completed", {
            triggerAction: this.holdActionStore.triggerAction,
            isHolding: this.holdActionStore.isHolding,
            timeoutCleared: !this.timeoutHolding,
            timestamp: new Date().toISOString()
        });
    }
}
