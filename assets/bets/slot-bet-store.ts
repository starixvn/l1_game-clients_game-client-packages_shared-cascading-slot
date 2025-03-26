import inversify from "inversify";
const { injectable, inject } = inversify;

@injectable()
export class SlotBetStore {
    coinValue = 0;
    betLevel = 0;
    totalBet = 0;
    freeSpin = false;
}
