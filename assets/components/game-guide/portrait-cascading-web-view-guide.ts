import { _decorator } from 'cc';
import { CascadingWebViewGuide } from './cascading-web-view-guide';
import { cascadingSlotLogger } from "../../cascading-slot-logger";

const { ccclass } = _decorator;

@ccclass
export class PortraitCascadingWebViewGuide extends CascadingWebViewGuide {
    loadGameGuide(url: string) {
        const portraitUrl = url + "&mode=portrait";
        cascadingSlotLogger.info(`[PortraitCascadingWebViewGuide] loadGameGuide called with url: ${url}, loading portrait URL: ${portraitUrl}`);
        super.loadGameGuide(portraitUrl);
    }
}





