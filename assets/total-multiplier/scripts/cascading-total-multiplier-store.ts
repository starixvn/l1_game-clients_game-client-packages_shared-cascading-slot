import inversify from "inversify";
import mobx from "mobx";

const { injectable, inject } = inversify;

@injectable()
export class CascadingTotalMultiplierStore {
    constructor() {
        mobx.makeAutoObservable(this);
    }

    totalMultiplier = 0;
    winMultiplier = false;
}
