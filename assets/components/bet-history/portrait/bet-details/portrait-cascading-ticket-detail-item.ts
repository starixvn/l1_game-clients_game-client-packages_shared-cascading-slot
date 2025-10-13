import gc from "@sg/game-client-base";
import { _decorator, Label } from "cc";
import { CascadingTicketDetailItem } from "../../bet-details/cascading-ticket-detail-item";


const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingTicketDetailItem extends CascadingTicketDetailItem {
    @property(Label)
    // scarterNode: Node = null;

    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        super.setData(tumble, index, data, currWinTumble);
        this.updateIndexLabel(index === 0 ? `${gc.Translator.gameTranslate('header_initial_spin')}` : `${gc.Translator.gameTranslate('header_tumble')} ${index}`);
    }
    calculateHeightRow(numberOfIcon: number) { }
}
