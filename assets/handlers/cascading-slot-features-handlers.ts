import inversify from "inversify";
import mobx from "mobx";
import { cascadingSlotLogger } from "../cascading-slot-logger";
import { BuyFsFeatureMessage } from "../buy-freespins/handler/buy-freespins-definitions";
import { BuyFreespinsHandler } from "../buy-freespins/handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class FeaturesHandlers {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;
    @inject(BuyFreespinsHandler) private readonly buyFsHandler: BuyFreespinsHandler;

    constructor() {
        cascadingSlotLogger.info(`[FeaturesHandlers] Constructor called, making auto observable`);
        mobx.makeAutoObservable(this);
    }

    eventHandleList = [
        {
            name: "features",
            handle: this.handleFeatures,
        },
    ];

    handleFeatures(features: any) {
        cascadingSlotLogger.info(`[FeaturesHandlers] handleFeatures called with features:`, features);
        Object.keys(features).forEach((featureKey) => {
            cascadingSlotLogger.info(`[FeaturesHandlers] Processing feature key: ${featureKey}`);
            if (featureKey === BuyFsFeatureMessage.Feature_Name) {
                cascadingSlotLogger.info(`[FeaturesHandlers] Found BuyFs feature, enabled: ${features[featureKey]?.enabled}`);
                if (features[featureKey]?.enabled) {
                    const multiplier = features[featureKey].multiplier;
                    cascadingSlotLogger.info(`[FeaturesHandlers] Setting BuyFs multiplier to: ${multiplier}`);
                    this.buyFsHandler.setFsMultiplier(multiplier);
                }
            }
        });
    }
}
