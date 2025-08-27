import inversify from "inversify";
import mobx from "mobx";
import { BuyFsFeatureMessage } from "../buy-freespins/handler/buy-freespins-definitions";
import { BuyFreespinsHandler } from "../buy-freespins/handler/buy-freespins-handlers";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class FeaturesHandlers {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;
    @inject(BuyFreespinsHandler) private readonly buyFsHandler: BuyFreespinsHandler;

    constructor() {
        mobx.makeAutoObservable(this);
    }

    eventHandleList = [
        {
            name: "features",
            handle: this.handleFeatures,
        },
    ];

    handleFeatures(features: any) {
        Object.keys(features).forEach((featureKey) => {
            if (featureKey === BuyFsFeatureMessage.Feature_Name) {
                if (features[featureKey]?.enabled) {
                    this.buyFsHandler.setFsMultiplier(features[featureKey].multiplier);
                }
            }
        });
    }
}
