import gc from "@sg/game-client-base";
import { _decorator } from "cc";
import { CascadingTicketDetailItem } from "../../bet-details/cascading-ticket-detail-item";
import { cascadingSlotLogger } from "../../../../cascading-slot-logger";



const { ccclass, property } = _decorator;

@ccclass
export class PortraitCascadingTicketDetailItem extends CascadingTicketDetailItem {
    setData(tumble: any, index: number, data: any, currWinTumble: number) {
        cascadingSlotLogger.info("PortraitCascadingTicketDetailItem: setData called with", { tumble, index, data, currWinTumble });
        super.setData(tumble, index, data, currWinTumble);
        const labelText = index === 0 ? `${gc.Translator.gameTranslate('header_initial_spin')}` : `${gc.Translator.gameTranslate('header_tumble')} ${index}`;
        cascadingSlotLogger.info("PortraitCascadingTicketDetailItem: updating index label to", labelText);
        this.updateIndexLabel(labelText);
    }
    calculateHeightRow(numberOfIcon: number) {
        cascadingSlotLogger.info("PortraitCascadingTicketDetailItem: calculateHeightRow called with", numberOfIcon, "- empty implementation for portrait");
    }
}
