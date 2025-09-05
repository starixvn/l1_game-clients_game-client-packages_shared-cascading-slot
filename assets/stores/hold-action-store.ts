import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class HoldActionStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    enabled = true;
    triggerAction = null;
    isHolding = false;
}
