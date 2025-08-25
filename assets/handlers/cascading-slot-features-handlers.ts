import inversify from "inversify";
import mobx from "mobx";
import { BuyFsFeatureMessage } from "../buy-freespins/handler/buy-freespins-definitions";
import { BuyFreespinsStore } from "../buy-freespins/handler/buy-freespins-store";

const { injectable, inject } = inversify;

@injectable()
export class FeaturesHandlers {
    @inject(BuyFreespinsStore) private readonly buyFsStore: BuyFreespinsStore;

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
                this.buyFsStore.fsMultiplier = features[featureKey]?.multiplier;
            }
        });
    }
}
