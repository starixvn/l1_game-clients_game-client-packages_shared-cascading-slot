import gc from "@sg/game-client-base";
import { _decorator, Label } from 'cc';
import { CascadingHistoryItem } from '../cascading-history-item';

const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingHistoryItem extends CascadingHistoryItem {

    @property(Label)
    haveFreeSpin: Label = null;
    setData(data: any) {
        super.setData(data);
        this.handleFreeSpin(data);
    }

    handleFreeSpin(data: any) {
        const { betHistoryLog } = data;
        const freeSpin = betHistoryLog.freeSpin;
        if (freeSpin) {
            this.haveFreeSpin.node.active = true;
            this.haveFreeSpin.string = `(${gc.Translator.gameTranslate("free_spin")})`;
        }
    }
}


