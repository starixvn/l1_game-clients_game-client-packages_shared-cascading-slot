import gc from "@sg/game-client-base";
import inversify from "inversify";
import mobx from "mobx";
const { injectable, inject } = inversify;

@injectable()
export class CascadingSlotSettlementStore {
    @inject(gc.Player.MainPlayerStore) protected readonly mainPlayerStore: gc.Player.MainPlayerStore;
    constructor() {
        mobx.makeAutoObservable(this);
    }
    private _finishData = null;

    get finishData() {
        return this._finishData;
    }

    set finishData(data: any) {
        if (data) {
            this.handleFinishData(data);
        }
        
        this._finishData = data;
    }

    handleFinishData(data: any) {
        data.actualBetwin = data.actualBetwin * this.mainPlayerStore.xMode;
        data.win = data.win * this.mainPlayerStore.xMode;
        this.applyXModeToTumbles(data.tumbles);
    }

    private applyXModeToTumbles(tumbles: any[]) {
        if (!tumbles || !Array.isArray(tumbles)) {
            return;
        }

        tumbles.forEach((tumble: any) => {
            tumble.win = tumble.win * this.mainPlayerStore.xMode;
            this.applyXModeToTumbleIcons(tumble.icons);
        });
    }

    private applyXModeToTumbleIcons(icons: any) {
        if (!icons || typeof icons !== 'object') {
            return;
        }

        Object.keys(icons).forEach((iconKey: string) => {
            const icon = icons[iconKey];
            if (icon && typeof icon.win === 'number') {
                icon.win = icon.win * this.mainPlayerStore.xMode;
            }
        });
    }
}
