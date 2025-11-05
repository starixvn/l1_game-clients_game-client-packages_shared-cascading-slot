import gc from "@sg/game-client-base";
import inversify from "inversify";

import { cascadingSlotLogger } from "../cascading-slot-logger";
import { GameServiceMessageCascading } from "../game-messages-cascading";
import { CascadingSlotConfigsStore } from "../stores/cascading-slot-configs-store";

const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotConfigsHandlers implements gc.Shared.IMultipleHandlers {
    @inject(CascadingSlotConfigsStore) protected readonly configStore: CascadingSlotConfigsStore;

    constructor() {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] constructor called", {
            hasConfigStore: !!this.configStore,
            timestamp: new Date().toISOString()
        });
    }

    handleConfigs(gameConfigs: GameServiceMessageCascading.CascadingSlotConfigsMsg) {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] handleConfigs called", {
            gameConfigs,
            hasGameConfigs: !!gameConfigs,
            hasConfigStore: !!this.configStore,
            willSetGameConfigs: true,
            timestamp: new Date().toISOString()
        });

        this.configStore.gameConfigs = gameConfigs;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] Game configs set in store", {
            gameConfigsSet: true,
            timestamp: new Date().toISOString()
        });
    }

    handleTrialUser(trialUser: GameServiceMessageCascading.CascadingTrialUserMsg) {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] handleTrialUser called", {
            trialUser,
            hasTrialUser: !!trialUser,
            trialUserBalance: trialUser?.balance,
            hasConfigStore: !!this.configStore,
            willSetTrialUser: true,
            timestamp: new Date().toISOString()
        });

        this.configStore.trialUser = trialUser;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] Trial user set in store", {
            trialUserSet: true,
            timestamp: new Date().toISOString()
        });
    }

    handleGameInfo(data: { gameInfo: GameServiceMessageCascading.GameInfoMsg }) {
        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] handleGameInfo called", {
            data,
            hasData: !!data,
            gameInfo: data?.gameInfo,
            hasGameInfo: !!data?.gameInfo,
            hasConfigStore: !!this.configStore,
            willSetGameInfo: true,
            timestamp: new Date().toISOString()
        });

        const { gameInfo } = data;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] Extracted gameInfo", {
            gameInfo,
            volatility: gameInfo?.volatility,
            timestamp: new Date().toISOString()
        });

        this.configStore.gameInfo = gameInfo;

        cascadingSlotLogger.info("[CASCADING_SLOT_CONFIGS_HANDLERS] Game info set in store", {
            gameInfoSet: true,
            timestamp: new Date().toISOString()
        });
    }

    eventHandleList = [
        {
            name: GameServiceMessageCascading.CascadingSlotConfigsMsg.eventName,
            handle: this.handleConfigs,
        },
        {
            name: GameServiceMessageCascading.CascadingTrialUserMsg.eventName,
            handle: this.handleTrialUser,
        },
        {
            name: GameServiceMessageCascading.GameInfoMsg.eventName,
            handle: this.handleGameInfo,
        },
    ];
}
