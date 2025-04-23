import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class HoldActionStore {
    isPressingKey = false;
    isTouching = false;
    isPressingDownKeyTime = 0;
    isPressingUpKeyTime = 0;
    constructor() {
        mobx.makeAutoObservable(this);
    }

    get isAutoSpinHolding() {
        return this.isTouching || this.isPressingKey;
    }
}
