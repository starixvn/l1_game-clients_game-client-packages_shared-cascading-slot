import { cascadingSlotLogger } from "./cascading-slot-logger";

cascadingSlotLogger.info('[CASCADE_SLOT_STATE] Initializing cascading slot state constants');

export const CascadingSlotState = {
    NOT_READY_BET: "NOT_READY_BET",
    READY_BET: "READY_BET",
    SPINNING: "SPINNING",
    SETTLED: "SETTLED",
};

cascadingSlotLogger.info('[CASCADE_SLOT_STATE] Available slot states:', CascadingSlotState);
